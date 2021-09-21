import json
import logging
from time import monotonic

from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED

from arango_common import get_db 

from config import WORKING_DIR


def load_data():
    # On my PC using a ThreadPoolExecutor cuts the import time to one-third
    executor = ThreadPoolExecutor(max_workers=4)
    limit = 4
    futures = set()
    
    db = get_db()
    strings_coll = db['strings']
    strings_coll.truncate()
    start = monotonic()
    for folder in sorted(WORKING_DIR.glob('*')):
        if folder.name not in {'root', 'translation', 'comment'}:
            continue
        print(f'\nProcessing: {folder.name}')
        files = list(folder.glob('**/*.json'))
        docs = []
        for i, file in enumerate(files):
            print(f'{i} of {len(files)}', end='    \r')
            
            with file.open() as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    logging.error(f'Could not parse JSON, skipping: {file.relative_to(REPO_DIR)}')
                    continue
            uid, muids = file.stem.split('_')
            for segment_id, string in data.items():
                doc = {
                    '_key': f'{muids}:{segment_id}',
                    'muids': muids,
                    'segment_id': segment_id,
                    'string': string
                }
                docs.append(doc)
            if len(docs) > 10000:
                if len(futures) > limit:
                    completed, futures = wait(futures, return_when=FIRST_COMPLETED)
                futures.add(executor.submit(strings_coll.insert_many, docs.copy()))
                docs.clear()
        if docs:
            futures.add(executor.submit(strings_coll.insert_many, docs.copy()))
    
    completed, futures = wait(futures)

        
    
    print(f'\nComplete in {monotonic()-start} seconds')


def search(query: str, filter=[]):
    db = get_db()

    literal = query.startswith('"') and query.endswith('"')

    if literal:
        query = ''''
        FOR doc IN strings_ngram_view
            SEARCH ANALYZER(doc.string, PHRASE(TOKENS(@query)))
                AND ANALYZER(doc.muids == @type, 'splitter')
            RETURN doc
        '''
    else:
        words = query.split()
        query_parts = []
        for i, word in enumerate(words, 1):
            if len(word) < 5:
                query_parts.append(f'PREFIX(@query{i})')
            else:
                query_parts.append(f'PHRASE(TOKENS(@query{i}))')
        
        query = f"""
        FOR doc IN strings_ngram_view
        SEARCH ANALYZER({' AND '.join(query_parts)}, 'ngrams5')
        
        
        """

