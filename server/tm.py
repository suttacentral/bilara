from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk, streaming_bulk

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

def ensure_index_exists(index_name='tm_db', recreate=False):
    exists = es.indices.exists(index_name)
    if recreate and exists:
        es.indices.delete(index_name)
        exists = False

    if not exists:
        es.indices.create(index_name)

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
        }
    }
    
    #print(json.dumps(body, ensure_ascii=False, indent=2))
    return es.search(index='tm_db', body=body)

def get_related_strings(string, source_language, target_language, original_id=None):
    es_results = query_related_strings(string, source_language, target_language)

    hits = es_results['hits']['hits']
    best_score = hits[0]['_score'] # this will usually be the string itself
    min_score = best_score * 0.4

    hits = [hit for hit in hits if hit['_score'] > min_score and hit['_id'] != original_id]
    
    results = {}

    for source_string, group in itertools.groupby(hits, lambda hit: hit['_source']['source']):
        results[source_string] = result_group = {}
        for hit in group:
            translation_string = hit['_source']['translation'][target_language]
            if translation_string not in result_group:
                result_group[translation_string] = [hit['_id']]
            else:
                result_group[translation_string].append(hit['_id'])
    
    return results


    for i, hit in enumerate(hits):
        if i == 0:
            print(json.dumps(hit, ensure_ascii=False, indent=2))
        source = hit['_source']['source'][source_language]
        keys = list(source.keys())
        assert len(keys) == 1
        origin = keys[0]
        source_string = source[origin]
        
        if source_string not in out:
            out[source_string] = OrderedDict()
            
        for origin, translation_string in hit['_source']['translation'][target_language].items():
            if translation_string not in out:
                out[source_string][translation_string] =  []
            out[source_string][translation_string].append({'lang': target_language, 'origin': origin})
                
                
    return [
        {'source_string': source_string,
         'translations': translations}
        for source_string, translations in out.items()]
    
    
    
