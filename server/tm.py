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




es = Elasticsearch()

def yield_all_segment_data():
    repo_dir = config.REPO_DIR

    source_dir = repo_dir / 'source'
    translation_dir = repo_dir / 'translation'

    file_uid_mapping = defaultdict(list)

    for file in itertools.chain(source_dir.glob('**/*.json'), translation_dir.glob('**/*.json')):
        uid = file.stem
        if uid.startswith('_'):
            continue
        file_uid_mapping[uid].append(file)
    progress = tqdm(sorted(file_uid_mapping.items()))
    for uid, files in progress:
        progress.set_description(f'Indexing {uid}')
        composed_docs = defaultdict(lambda: {'translation': {}})

        for file in files:
            with file.open() as f:
                data = json.load(f)
                if '_meta' in data:
                    data.pop('_meta')
                
                rel_path = file.relative_to(repo_dir)

                for segment_id, string in data.items():
                    doc = composed_docs[segment_id]
                    lang = rel_path.parts[1]
                    if rel_path.parts[0] == 'source':
                        doc['language'] = lang
                        doc['source'] = string
                    else:
                        doc['translation'][lang] = string
        yield from (
            {
                '_id': _id,
                '_index': 'tm_db',
                '_type': 'segment',
                **doc
            } for _id, doc in composed_docs.items() if len(doc) > 1
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
        result = es.count('tm_db')
        indexed_segment_count = result['count']
    except NotFoundError:
        indexed_segment_count = 0
    
    # there should be about 20-100 segments per uid
    # this just detects if something is horribly wrong
    if indexed_segment_count < uid_count:
        print('Building TM')
        index_bulk(force=True)
    else:
        print('Not rebuilding TM')

def update_docs(segments):
    for segment in segments.values():
        path = pathlib.Path(segment['filepath'])
        lang = path.parts[2]
        if path.parts[1] == 'translation':
            es.update('tm_db', 'segment', segment['segmentId'], { 
                 'script': { 
                         'source': f'ctx._source.translation[params.lang]= params.value; ctx._source.timestamp = ctx._now', 
                         'lang': 'painless', 
                         'params': { 
                           'lang': lang, 
                           'value': segment['value']
                          } 
                     } 
                 })

def ensure_index_exists(index_name='tm_db', recreate=False):
    exists = es.indices.exists(index_name)
    if recreate and exists:
        es.indices.delete(index_name)
        exists = False

    if not exists:
        es.indices.create(index_name,
            {
                "settings": {
                    "index": {
                        "number_of_shards": 1,
                        "number_of_replicas": 1
                    }
                }
            })

def generate_diff(string_a, string_b):
    """
    http://stackoverflow.com/a/788780
    Unify operations between two compared strings seqm is a difflib.
    SequenceMatcher instance whose a & b are strings
    """

    seq_a = [s for s in regex.split(r'\b', string_a) if s]
    seq_b = [s for s in regex.split(r'\b', string_b) if s]

    seqm = difflib.SequenceMatcher(None, seq_a, seq_b)
    opcodes = seqm.get_opcodes()
    output = []
    total_equal = 0
    for opcode, a0, a1, b0, b1 in opcodes:
        if opcode == 'equal':
            chunk = ''.join(seqm.a[a0:a1])
            output.append(chunk)
            total_equal += len(chunk)
        elif opcode == 'insert':
            output.append(f'<ins>{"".join(seqm.b[b0:b1])}</ins>')
        elif opcode == 'delete':
            output.append(f'<del>{"".join(seqm.a[a0:a1])}</del>')
        elif opcode == 'replace':
            # seqm.a[a0:a1] -> seqm.b[b0:b1]
            output.append(f'<del>{"".join(seqm.a[a0:a1])}</del><ins>{"".join(seqm.b[b0:b1])}</ins>')
        else:
            raise RuntimeError("unexpected opcode")
    sim = total_equal / max(len(string_a), len(string_b))
    return (sim, ''.join(output))

def query_related_strings(string, source_language, target_language):
    clean_string = regex.sub('[\s\p{punct}]+', ' ', string)
    phrase_qs = f'"{clean_string}"'
    fuzzy_qs = ' '.join(f'{s}~' for s in clean_string.split())
    print(phrase_qs)
    print(fuzzy_qs)
    body = {
      "size": 20,
        "query": {
            "bool" : {
                "minimum_should_match": 1, 
                "boost" : 1.2,
                "must": [
                    {
                        "exists": {
                            "field": f"translation.{target_language}"
                        }
                    },
                    {
                        "term": {
                            "language": source_language
                        }
                    }
                ],
                "should" : [
                    {
                        "query_string": {
                            "default_field": f"source",
                            "minimum_should_match": "50%", 
                            "query": fuzzy_qs
                        }
                    },
                    {
                        "query_string": {
                            "default_field": f"source",
                            "query": phrase_qs
                        }
                    }
                ]
            }
        },
        "aggs": {
            "by_source" :{ 
                "terms":  { 
                    "field": "source.keyword", 
                    "order": { "max_score": "desc"},
                    "size": 3,
                    "min_doc_count": 1
                }, 
                "aggs": { 
                    "translation": {"terms": {"field": f"translation.{target_language}.keyword", "min_doc_count": 1}},
                    "max_score": { "max": { "script": "_score"}}
                }
            }
        }
    }
    
    #print(json.dumps(body, ensure_ascii=False, indent=2))
    return es.search(index='tm_db', body=body)

def get_related_strings(string, source_language, target_language, case_sensitive=False, original_id=None):
    es_results = query_related_strings(string, source_language, target_language)

    buckets = es_results['aggregations']['by_source']['buckets']
    hits = es_results['hits']['hits']

    ids = {}
    translations = {}
    for hit in hits:
        _source = hit['_source']
        key = (_source['source'], _source['translation'][target_language])
        if key not in ids:
            ids[key] = hit['_id']
        if _source['source'] not in translations:
            translations[_source['source']] = _source['translation'][target_language]

    results = []

    best_match_quality = -1

    for bucket in buckets:
        source = bucket['key']
        sim, diffed_source_string = generate_diff(string, source)

        best_match_quality = max(best_match_quality, sim)
        results.append({
            'source': source,
            'source_language': source_language,
            'diffed_source': diffed_source_string,
            'match_quality': sim,
            'translations': [
                {
                    'translation': d['key'],
                    'count': d['doc_count'],
                    'id': ids.get( (source, d['key']) )
                } 
                for d in bucket['translation']['buckets']
            ]
        })

    results.sort(key=lambda r: r['match_quality'], reverse=True)
    results = [result for result in results if result['match_quality'] > best_match_quality / 2]

    for result in results:
        if not result['translations']:
            key = (result['source'], _source['translation'][target_language])
            source = result['source']
            translation = translations[result['source']]
            result['translations'] = [{
                'translation': translation,
                'count': 1,
                'id': ids.get( (source, translation) )
            }]
    
    
    return results
