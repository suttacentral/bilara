from elasticsearch import Elasticsearch, NotFoundError
from elasticsearch.helpers import bulk, streaming_bulk

from threading import Thread

import pathlib
import json
import regex
from collections import defaultdict, OrderedDict, Counter
import itertools

import difflib

from tqdm import tqdm

from config import config

repo_dir = config.REPO_DIR
root_dir = repo_dir / "root"
translation_dir = repo_dir / "translation"

es = Elasticsearch()


def yield_all_segment_data():
    file_uid_mapping = defaultdict(list)

    for file in itertools.chain(
        root_dir.glob("**/*.json"), translation_dir.glob("**/*.json")
    ):
        if "_" not in file.stem:
            continue
        if file.stem.startswith("_"):
            continue
        uid = file.stem.split("_")[0]
        file_uid_mapping[uid].append(file)

    progress = tqdm(sorted(file_uid_mapping.items()))
    for uid, files in progress:
        progress.set_description(f"Indexing {uid}")
        composed_docs = defaultdict(lambda: {"translation": {}})

        for file in files:
            with file.open() as f:
                data = json.load(f)
                if "_meta" in data:
                    data.pop("_meta")

                rel_path = file.relative_to(repo_dir)

                for segment_id, string in data.items():
                    doc = composed_docs[segment_id]
                    lang = rel_path.parts[1]
                    if rel_path.parts[0] == "root":
                        doc["language"] = lang
                        doc["root"] = string
                    else:
                        doc["translation"][lang] = string
        yield from (
            {"_id": _id, "_index": "tm_db", "_type": "segment", **doc}
            for _id, doc in composed_docs.items()
        )


def index_bulk(force=False):
    ensure_index_exists(recreate=force)
    docs = yield_all_segment_data()
    while True:
        chunk = itertools.islice(docs, 1000)
        r = bulk(es, chunk)
        if r[0] == 0:
            break


def build_tm_if_needed(uid_count):

    try:
        result = es.count("tm_db")
        indexed_segment_count = result["count"]
    except NotFoundError:
        indexed_segment_count = 0

    # there should be about 20-100 segments per uid
    # this just detects if something is horribly wrong
    if indexed_segment_count < uid_count:
        print("Building TM")
        index_bulk(force=True)
    else:
        print("Not rebuilding TM")


def update_docs(segments):
    print(segments)
    for segment in segments.values():
        path = pathlib.Path(segment["filepath"])
        lang = path.parts[1]
        if path.parts[0] == "translation":
            es.update(
                "tm_db",
                "segment",
                segment["segmentId"],
                {
                    "doc": {
                        "translation": {
                            lang: segment["value"],
                            "timestamp": segment["timestamp"],
                        }
                    }
                },
            )


def ensure_index_exists(index_name="tm_db", recreate=False):
    exists = es.indices.exists(index_name)
    if recreate and exists:
        es.indices.delete(index_name)
        exists = False

    if not exists:
        es.indices.create(
            index_name,
            {"settings": {"index": {"number_of_shards": 1, "number_of_replicas": 1}}},
        )


def generate_diff(string_a, string_b):
    """
    http://stackoverflow.com/a/788780
    Unify operations between two compared strings seqm is a difflib.
    SequenceMatcher instance whose a & b are strings
    """

    seq_a = [s for s in regex.split(r"\b", string_a) if s]
    seq_b = [s for s in regex.split(r"\b", string_b) if s]

    seqm = difflib.SequenceMatcher(None, seq_a, seq_b)
    opcodes = seqm.get_opcodes()
    output = []
    total_equal = 0
    for opcode, a0, a1, b0, b1 in opcodes:
        if opcode == "equal":
            chunk = "".join(seqm.a[a0:a1])
            output.append(chunk)
            total_equal += len(chunk)
        elif opcode == "insert":
            output.append(f'<ins>{"".join(seqm.b[b0:b1])}</ins>')
        elif opcode == "delete":
            output.append(f'<del>{"".join(seqm.a[a0:a1])}</del>')
        elif opcode == "replace":
            # seqm.a[a0:a1] -> seqm.b[b0:b1]
            output.append(
                f'<del>{"".join(seqm.a[a0:a1])}</del><ins>{"".join(seqm.b[b0:b1])}</ins>'
            )
        else:
            raise RuntimeError("unexpected opcode")
    sim = total_equal / max(len(string_a), len(string_b))
    return (sim, "".join(output))


def query_related_strings(string, root_language, translation_language, exclude_id):
    clean_string = regex.sub("[\s\p{punct}]+", " ", string)
    phrase_qs = f'"{clean_string}"'
    fuzzy_qs = " ".join(f"{s}~" for s in clean_string.split())
    print(phrase_qs)
    print(fuzzy_qs)
    body = {
        "size": 20,
        "query": {
            "bool": {
                "minimum_should_match": 1,
                "boost": 1.2,
                "must": [
                    {"exists": {"field": f"translation.{translation_language}"}},
                    {"term": {"language": root_language}},
                ],
                "should": [
                    {
                        "query_string": {
                            "default_field": f"root",
                            "minimum_should_match": "50%",
                            "query": fuzzy_qs,
                        }
                    },
                    {"query_string": {"default_field": f"root", "query": phrase_qs}},
                ],
                "must_not": [
                  {
                    "ids": {
                      "values": [exclude_id]
                    }
                  }
                ]
            }
        },
        "aggs": {
            "by_source": {
                "terms": {
                    "field": "root.keyword",
                    "order": {"max_score": "desc"},
                    "size": 3,
                    "min_doc_count": 1,
                },
                "aggs": {
                    "translation": {
                        "terms": {
                            "field": f"translation.{translation_language}.keyword",
                            "min_doc_count": 1,
                        }
                    },
                    "max_score": {"max": {"script": "_score"}},
                },
            }
        },
    }

    return es.search(index="tm_db", body=body)


def get_related_strings(
    string, root_language, translation_language, case_sensitive=False, exclude_id=None
):
    print('Exclude Id: ', exclude_id)
    es_results = query_related_strings(string, root_language, translation_language, exclude_id)

    buckets = es_results["aggregations"]["by_source"]["buckets"]
    hits = es_results["hits"]["hits"]

    ids = {}
    translations = {}
    for hit in hits:
        _source = hit["_source"]
        key = (_source["root"], _source["translation"][translation_language])
        if key not in ids:
            ids[key] = hit["_id"]
        if _source["root"] not in translations:
            translations[_source["root"]] = _source["translation"][translation_language]

    results = []

    best_match_quality = -1

    for bucket in buckets:
        root = bucket["key"]
        sim, diffed_root_string = generate_diff(string, root)

        best_match_quality = max(best_match_quality, sim)

        results.append(
            {
                "root": root,
                "root_language": root_language,
                "diffed_root": diffed_root_string,
                "match_quality": sim,
                "translations": [
                    {
                        "translation": d["key"],
                        "count": d["doc_count"],
                        "id": ids.get((root, d["key"])),
                    }
                    for d in bucket["translation"]["buckets"]
                ],
            }
        )

    results.sort(key=lambda r: r["match_quality"], reverse=True)
    results = [
        result for result in results if result["match_quality"] > best_match_quality / 2
    ]

    for result in results:
        if not result["translations"]:
            key = (result["root"], _source["translation"][translation_language])
            root = result["root"]
            translation = translations[result["root"]]
            result["translations"] = [
                {
                    "translation": translation,
                    "count": 1,
                    "id": ids.get((root, translation)),
                }
            ]

    
    
    print(json.dumps(results, indent=2, ensure_ascii=False))

    # filtered_results = []
    # for result in results:
    #     result['translations'] = [
    #       translation for translation in result['translations']
    #       if translation['count'] > 1
    #       or translation['id'] != original_id
    #     ]
    #     if result['translations']:
    #       filtered_results.append(result)

    return results
