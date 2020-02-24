from arango import ArangoClient

import pathlib
import json
import itertools
import logging
import regex

from multiprocessing import Event

from cachetools import TTLCache

from config import config

from log import problemsLog

from .highlight import highlight_matching

repo_dir = config.REPO_DIR


class ConstructedQuery:
    def __init__(self, search):
        self.search = search
        self.query = None
        self.bind_vars = {}

    def execute(self, bind_vars={}, **kwargs):
        return self.search.execute(self.query, bind_vars={**self.bind_vars, **bind_vars}, **kwargs)

def grouper(iterable, n):
    it = iter(iterable)
    while True:
        chunk = tuple(itertools.islice(it, n))
        if not chunk:
            return
        yield chunk


class Search:
    def __init__(self):
        client = ArangoClient()
        self.db = client.db(username="bilara", password="bilara", name="bilara")
        self._cursor_cache = TTLCache(1000, 3600)
        self._build_complete = Event()
        self.init()
        self._build_complete.set()

    def init(self):
        db = self.db
        if db.has_collection("meta"):
            meta = db["meta"]
        else:
            meta = db.create_collection("meta")

        if "version" in meta:
            version = meta.get("version")["version"]
        else:
            version = 0
        if version < 1:
            self.create_analyzers()
            version = 1

        self.insert_or_update("meta", {"_key": "version", "version": version})

    @property
    def collection_names(self):
        return self.db["meta"]["collection_names"]["value"]

    def get_analyzers(self):
        return {
            obj["name"].split("::")[1]
            for obj in self.db.analyzers()
            if "::" in obj["name"]
        }

    def get_views(self):
        return {obj["name"] for obj in self.db.views()}

    def create_analyzers(self):
        analyzers = self.get_analyzers()

        if not "text_edge_ngrams" in analyzers:
            self.db.create_analyzer(
                "text_edge_ngrams",
                "text",
                {
                    "edgeNgram": {"min": 5, "max": 5, "preserveOriginal": True},
                    "locale": "en.utf-8",
                    "case": "lower",
                    "accent": False,
                    "stemming": False,
                    "stopwords": [],
                    "streamType": "utf8",
                },
                ["frequency", "norm", "position"],
            )

        if not "normalizer" in analyzers:
            self.db.create_analyzer(
                "normalizer",
                "text",
                {
                    "locale": "en.utf-8",
                    "case": "lower",
                    "accent": False,
                    "stemming": False,
                    "stopwords": [],
                    "streamType": "utf8",
                },
                ["frequency", "norm", "position"],
            )

        if not "splitter" in analyzers:
            self.db.create_analyzer("splitter", "delimiter", {"delimiter": "-"})

    def insert_or_update(self, collection, doc):
        if doc["_key"] in self.db[collection]:
            self.db[collection].update(doc)
        else:
            self.db[collection].insert(doc)

    def update_segment(self, segment):
        print(segment)
        doc = {
            'muids': segment['field'],
            'string': segment['value'],
            'segment_id': segment['segmentId'],
            '_key': self.legalize_key(segment['segmentId'])
        }

        self.db.update_document(doc)

    def execute(self, query, **kwargs):
        print("=== Running Query ===")
        print(query)
        if 'bind_vars' in kwargs:
            print(json.dumps(kwargs['bind_vars']))
        if 'count' not in kwargs:
            kwargs['count'] = True
        return self.db.aql.execute(query, **kwargs)

    def index(self, force=False):
        self._build_complete.clear()
        print('TM Indexing Started')
        db = self.db
        collection_names = set()

        if force:
            for doc in db.collections():
                if doc['name'].startswith('_'):
                    continue
                if doc['name'] in {'meta'}:
                    continue
                db.delete_collection(doc['name'])

        for collection_name, group in itertools.groupby(
            self.yield_strings(), lambda t: t[0]
        ):
            collection_names.add(collection_name)
            for chunk in grouper((t[1] for t in group), 1000):
                if not db.has_collection(collection_name):
                    db.create_collection(collection_name)
                result = db[collection_name].import_bulk(
                    chunk, on_duplicate="replace", halt_on_error=False
                )
                if result["errors"] > 0:
                    print(result)

        self.insert_or_update(
            "meta", {"_key": "collection_names", "value": list(collection_names)}
        )

        self.create_search_view()

        print('TM Indexing Complete')

        self._build_complete.set()

    @staticmethod
    def legalize_key(string):
        'Ensure that only legal characters are in the key, by replacing non-whitelisted characters with .'
        return regex.sub(r"[^a-zA-Z0-9_:.@()+,=;$!*'%-]", '.', string)

    def yield_strings(self):
        for folder in repo_dir.iterdir():
            if not folder.is_dir() or folder.name.startswith('.'):
                continue
            for file in folder.glob('**/*.json'):
                if "_" not in file.stem:
                    continue

                uid, muids = file.stem.split("_")
                if not uid:
                    continue

                with file.open("r") as f:
                    try:
                        data = json.load(f)
                    except Exception as e:
                        logging.error(file)
                        problemsLog.add(file=str(file.relative_to(repo_dir)), msg=f'JSON Decode Error on line {e.lineno}')
                        continue

                for segment_id, string in data.items():
                    if segment_id == "~":
                        continue
                    yield (
                        muids,
                        {
                            "_key": self.legalize_key(segment_id),
                            "segment_id": segment_id,
                            "string": string,
                            "muids": muids,
                        },
                    )

    def create_search_view(self):
        links = {}
        for name in self.collection_names:
            if "translation" in name or "root" in name:
                links[name] = {
                    "fields": {
                        "string": {"analyzers": ["text_edge_ngrams", "normalizer"]},
                        "muids": {"analyzers": ["identity", "splitter"]},
                        "segment_id": {"analyzers": ["identity"]},
                    }
                }

        if "strings_view" in self.get_views():
            self.db.replace_arangosearch_view("strings_view", {"links": links})
        else:
            self.db.create_arangosearch_view("strings_view", {"links": links})


    def generic_query(self, query_components, offset, limit):
        """
        >>> search.generic_query([{
            "muids": "root-pli-ms",
            "query": "dhamma"
        }, {
            "muids": "translation-en-sujato",
            "query": "teaching"
        }])

        """

        self._build_complete.wait()

        tab = '  '

        constructed_query = ConstructedQuery(self)
        parts = []
        return_parts = [tab + "segment_id: doc0.segment_id"]

        for n, component in enumerate(query_components):
            muids = component['muids']
            query = component.get('query')

            
            

            parts.extend([
                tab * n + f'FOR doc{n} IN strings_view',
                tab * (n + 1) + f'SEARCH ANALYZER(TOKENS(@muids{n}, "splitter") ALL IN doc{n}.muids, "splitter")'
            ])
            
            constructed_query.bind_vars[f'muids{n}'] = muids
            if query:
                parts.append(tab * (n + 1)  + f'AND ANALYZER(PHRASE(doc{n}.string, @query{n}), "normalizer")')
                constructed_query.bind_vars[f'query{n}'] = query

            if n > 0:
                parts.append(tab * (n + 1) + f'AND doc{n}.segment_id == doc0.segment_id')
            
            return_parts.append(tab + f'@muids{n}: doc{n}.string')
        
        parts.append('RETURN {\n' + ',\n'.join(return_parts) + '\n}')

        composed_query = '\n'.join(parts)

        constructed_query.query = composed_query

        return constructed_query.execute()

    
    def tm_generic_query(self, query, a_muids, b_muids, exclude_id, limit):
        self._build_complete.wait()
        tokens = set(
            self.execute(
                'RETURN TOKENS(@query, "text_edge_ngrams")', bind_vars={"query": query}
            ).pop()
        )

        minmatch_inner_query = ", ".join(f'a_doc.string == "{token}"' for token in tokens)

        composed_query = f"""
        FOR a_doc IN strings_view
            SEARCH 
                ANALYZER(TOKENS(@a_muids, 'splitter') ALL IN a_doc.muids, 'splitter') AND
                ANALYZER(MIN_MATCH({minmatch_inner_query}, {max(1, len(tokens) / 3)}), "text_edge_ngrams") OR
                BOOST(PHRASE(a_doc.string, @query, 'normalizer'), 3)
            FILTER a_doc.segment_id != @exclude_id
            LET length_factor = ABS(LENGTH(@query) - LENGTH(a_doc.string)) / LENGTH(@query)
            LET a_score = BM25(a_doc) * 10 / (10 + length_factor)
            FOR b_doc IN strings_view
                SEARCH 
                    b_doc.segment_id == a_doc.segment_id AND
                    ANALYZER(TOKENS(@b_muids, 'splitter') ALL IN b_doc.muids, "splitter")
                FILTER LENGTH(b_doc.string) > 1
                COLLECT a = a_doc.string, score=a_score, b = b_doc.string INTO group = {{
                        segment_id: b_doc.segment_id
                    }}
                SORT score * (1 + LENGTH(group) / 100) DESC
                LIMIT @limit
                RETURN {{
                    score: score,
                    a: a,
                    b: b,
                    segment_ids: group[*].segment_id
                }}

        """

        return self.execute(composed_query, bind_vars={
            "query": query,
            "a_muids": a_muids,
            "b_muids": b_muids,
            "exclude_id": exclude_id,
            "limit": limit or 5
        })
    
    
    def tm_query(self, query, root_lang, translation_lang, exclude_id, limit=5):

        results = self.tm_generic_query(
                query=query,
                a_muids='-'.join(['root', root_lang]),
                b_muids='-'.join(['translation', translation_lang]),
                exclude_id=exclude_id,
                limit=limit)
        
        return [{
            "root": result['a'],
            "highlighted": highlight_matching(query, result['a']),
            "translation": result['b'],
            "segment_ids": result['segment_ids']
        } for result in results]


