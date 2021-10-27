import arango
from arango import ViewDeleteError

import pathlib
import json
import itertools
import logging
import regex

from multiprocessing import Event

from cachetools import TTLCache

from config import WORKING_DIR, TM_ALIAS

from log import problemsLog

from .highlight import highlight_matching

from permissions import get_permissions, Permission

import fs



from arango_common import get_db, import_background




class ConstructedQuery:
    def __init__(self, search):
        self.search = search
        self.query = None
        self.bind_vars = {}

    def execute(self, bind_vars={}, **kwargs):
        print(self.query)
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
        self.version = 1.2
        self.db = get_db()
        self._cursor_cache = TTLCache(1000, 3600)
        self._build_complete = Event()
        self._verbose = True
        if self.needs_init():
            self.init()
            self.index()
        self._build_complete.set()
        

    def needs_init(self):
        return not self.db.has_collection("meta")

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
        if version < self.version:
            self.create_analyzers(force=True)
            version = self.version

        self.insert_or_update("meta", {"_key": "version", "version": version})
    
    def deinit(self):
        db = self.db
        for name in self.collection_names:
            self.db.delete_collection(name, True)
        self.db.delete_collection('meta', True)

    @property
    def collection_names(self):
        try:
            saved_names = set(self.db["meta"]["collection_names"]["value"])
            collection_names = {d['name'] for d in self.db.collections()}
            return saved_names.intersection(collection_names)

        except TypeError:
            return set()
    
    @collection_names.setter
    def collection_names(self, value):
        self.insert_or_update(
            "meta", {"_key": "collection_names", "value": list(value)}
        )


    def get_analyzers(self):
        return {
            obj["name"].split("::")[1]
            for obj in self.db.analyzers()
            if "::" in obj["name"]
        }

    def get_views(self):
        return {obj["name"] for obj in self.db.views()}

    def create_analyzers(self, force=False):
        if force:
            for analyzer in self.get_analyzers():
                self.db.delete_analyzer(analyzer)
                analyzers = []

        self.db.create_analyzer(
            "text_edge_ngrams",
            "text",
            {
                "edgeNgram": {"min": 5, "max": 5, "preserveOriginal": True},
                "locale": "en.utf-8",
                "case": "lower",
                "accent": False,
                "stemming": False,
                "stopwords": ["ti", "ca", "kho", "na", "bhikkhave", "vā", "hoti", "pe", "so", "te", "evaṁ",
                              "taṁ", "me", "bhante", "bhikkhu", "bhagavā", "ayaṁ", "atha", "yaṁ", "pana", 
                              "tassa", "no", "yo", "tattha", "ye", "dhammā"],
                "streamType": "utf8",
            },
            ["frequency", "norm", "position"],
        )

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

        self.db.create_analyzer(
            "cjk_ngram_analyzer",
            "ngram",
            {
                "min": 1, 
                "max": 5, 
                "preserveOriginal": True,
                "streamType": "utf8"
            },
            ["frequency", "norm", "position"],
        )

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

        self.insert_or_update(segment['field'], doc)
        doc['_key'] = f"{doc['muids']}_{doc['segment_id']}"
        self.insert_or_update('strings', doc)

    def execute(self, query, **kwargs):
        #print("=== Running Query ===")
        #print(query)
        if 'bind_vars' in kwargs:
            print(json.dumps(kwargs['bind_vars']))
        if 'count' not in kwargs:
            kwargs['count'] = True
        return self.db.aql.execute(query, **kwargs)

    def index(self, files=None, force=False):
        self._build_complete.clear()
        print('TM Indexing Started')
        db = self.db
        collection_names = self.collection_names

        if not files:
            files = self.iter_all_files()

        if force:
            try:
                self.db.delete_view('strings_view')
            except ViewDeleteError:
                pass
            
            for name in collection_names:
                try:
                    db.delete_collection(name)
                except arango.exceptions.CollectionDeleteError:
                    pass
            self.collection_names = set()

        for collection_name, group in itertools.groupby(
            self.yield_strings(files), lambda t: t[0]
        ):
            if collection_name not in collection_names:
                collection_names.add(collection_name)
            
            for chunk in grouper((t[1] for t in group), 1000):
                if not db.has_collection(collection_name):
                    db.create_collection(collection_name)
                
                import_background(db[collection_name], chunk)
                strings_chunk = []
                for doc in chunk:
                    _key = doc.pop('_key')
                    doc['_key'] = f"{doc['muids']}_{doc['segment_id']}"
                    strings_chunk.append(doc)
                import_background(db['strings'], strings_chunk)
        
        self.collection_names = collection_names
        print('Updating Search Views')
        self.create_search_view()

        print('TM Indexing Complete')

        self._build_complete.set()
    
    def update_partial(self, added=[], modified=[]):
        if modified or added:
            files = [WORKING_DIR / filepath for filepath in set(added).union(set(modified))]
            files = [file for file in files if 
                     file.suffix == '.json' and
                     not any(part.startswith('.') for part in file.parts)]
            self.index(files=files, force=False)

    def files_removed(self, files_and_data):
        for filepath, data in files_and_data:
            file = WORKING_DIR / filepath
            uid, muids = file.name.split('_')
            
            if not data:
                logging.error('No data could be found for deleted file {filepath}')
                continue
            self.db.collection[muids].delete_many([
                {
                    '_key': self.legalize_key(segment_id)
                }
                for segment_id in data
            ])
        

    @staticmethod
    def legalize_key(string):
        'Ensure that only legal characters are in the key, by replacing non-whitelisted characters with .'
        return regex.sub(r"[^a-zA-Z0-9_:.@()+,=;$!*'%-]", '.', string)

    def iter_all_files(self):
        for folder in WORKING_DIR.iterdir():
            if not folder.is_dir() or folder.name.startswith('.'):
                continue
            for file in folder.glob('**/*.json'):
                if "_" not in file.stem:
                    continue
                yield file

    def yield_strings(self, files):
        for file in files:
            if file.suffix != '.json':
                continue
            if '_' not in file.name:
                logging.error(f'Invalid filename: {file}')
                problemsLog.add(file=str(file.relative_to(WORKING_DIR)), msg=f'Not a valid filename: "_" missing')
                continue
            uid, muids = file.stem.split("_")
            if not uid:
                continue

            with file.open("r") as f:
                try:
                    data = json.load(f)
                except Exception as e:
                    logging.error(f'Error loading file: {file}')
                    problemsLog.add(file=str(file.relative_to(WORKING_DIR)), msg=f'JSON Decode Error on line {e.lineno}')
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
                        "filepath": str(file.relative_to(WORKING_DIR)),
                    },
                )

    def create_search_view(self):
        links = {}
        for name in self.collection_names:
            
            if "translation" in name or "root" in name or "comment" in name:
                
                if {'jpn', 'lzh', 'zh', 'ko'}.intersection(name.split('-')):
                    string_analyzer = "cjk_ngram_analyzer"
                else:
                    string_analyzer = "text_edge_ngrams"
                links[name] = {
                    "fields": {
                        "string": {"analyzers": [string_analyzer, "normalizer"]},
                        "muids": {"analyzers": ["identity", "splitter"]},
                        "segment_id": {"analyzers": ["identity"]},
                    }
                }

        if "strings_view" in self.get_views():
            self.db.replace_arangosearch_view("strings_view", {"links": links})
        else:
            self.db.create_arangosearch_view("strings_view", {"links": links})

    def generic_query(self, query_components, offset, limit, segment_id_filter):
        """
        >>> search.generic_query([{
            "muids": "root-pli-ms",
            "query": "dhamma"
        }, {
            "muids": "translation-en-sujato",
            "query": "teaching"
        }])

        example searches:
        Das große Kapitel
        The Great Chapter
        Mahāvagga


        """

        self._build_complete.wait()

        tab = '  '

        if segment_id_filter and '%' not in segment_id_filter:
            if ':' not in segment_id_filter:
                segment_id_filter += ':'
            segment_id_filter += '%'


        

        query_components.sort(key=lambda obj: not obj.get('query'))
        print(query_components)

        constructed_query = ConstructedQuery(self)
        parts = []
        return_parts = [tab + "segment_id: doc0.segment_id"]

        for n, component in enumerate(query_components):
            muids = component['muids']
            query = component.get('query')
            mandatory = component['mandatory']
            constructed_query.bind_vars[f'muids{n}'] = muids
            if query or mandatory:
                parts.extend([
                    tab * n + f'FOR doc{n} IN strings_ngram_view',
                    tab * (n + 1) + f'SEARCH ANALYZER(TOKENS(@muids{n}, "splitter") ALL IN doc{n}.muids, "splitter")',
                ])
                postpend = []
                if query:
                    
                    literal = query.startswith('"') and query.endswith('"')
                    
                    if literal:
                        query_parts = [query[1:-1]]
                    else:
                        query = regex.sub(r'[^\w\s]', '', query)
                        query_parts = query.split()
                        
                    
                    inner_parts = []
                    for j, part in enumerate(query_parts):
                        if len(part) > 5:
                            inner_parts.append(f'PHRASE(doc{n}.string, TOKENS(@query{n}_{j}, "ngrams5"))')
                        else:
                            inner_parts.append(f'STARTS_WITH(doc{n}.string, TOKENS(@query{n}_{j}, "simple-normalizer"))')
                        constructed_query.bind_vars[f'query{n}_{j}'] = part
                    
                    inner_query = ' AND '.join(inner_parts)
                    
                    parts.append(tab * (n + 1) + f'AND ANALYZER({inner_query}, "ngrams5")')

                    constructed_query.bind_vars[f'regex{n}'] = r'.{0,2}'.join(query_parts)
                    postpend.append(tab * (n + 1) + f'LET boost{n} = REGEX_TEST(doc{n}.string, @regex{n}, TRUE) ? 2 : 1')
                    postpend.append(tab * (n + 1) + f'SORT boost{n} * TFIDF(doc{n}) DESC')
                    
                if n == 0:
                    if segment_id_filter:
                        parts.append(tab * (n + 1) + f'FILTER doc{n}.segment_id LIKE @segment_id_filter')
                        constructed_query.bind_vars['segment_id_filter'] = segment_id_filter.lower()
                if n > 0:
                    parts.append(tab * (n + 1) + f'AND doc{n}.segment_id == doc0.segment_id')
                parts.extend(postpend)
                return_parts.append(tab + f'@muids{n}: doc{n}.string')
            else:
                return_parts.append(f'''
  @muids{n}: FIRST(
    FOR doc IN strings_ngram_view
      SEARCH doc.segment_id == doc0.segment_id
        AND ANALYZER(TOKENS(@muids{n}, "splitter") ALL IN doc.muids, "splitter")
      LIMIT 1
      RETURN doc
  ).string''')

        parts.append('LIMIT @offset, @limit')
        constructed_query.bind_vars.update({'offset': offset, 'limit': limit})
        parts.append('RETURN {\n' + ',\n'.join(return_parts) + '\n}')

        composed_query = '\n'.join(parts)

        constructed_query.query = composed_query

        return constructed_query.execute()

    def tm_alias(self, key, muids):
        result = {key: muids}
        if muids in TM_ALIAS:
            result[key+'_alias'] = TM_ALIAS[muids]
        return result

    def tm_generic_query(self, query, a_muids, b_muids, exclude_id, limit):
        self._build_complete.wait()
        tokens = set(
            self.execute(
                'RETURN TOKENS(@query, "text_edge_ngrams")', bind_vars={"query": query}
            ).pop()
        )

        minmatch_inner_query = ", ".join(f'a_doc.string == "{token}"' for token in tokens)

        a_aliased = self.tm_alias('a_muids', a_muids)
        b_aliased = self.tm_alias('b_muids', b_muids)

        composed_query = f"""
        FOR a_doc IN strings_view
            SEARCH 
                ANALYZER(MIN_MATCH({minmatch_inner_query}, {max(1, len(tokens) / 3)}), "text_edge_ngrams") OR
                BOOST(PHRASE(a_doc.string, @query, 'normalizer'), 3)
                OPTIONS {{collections: [{','.join(f'@{k}' for k in a_aliased)}]}}
            FILTER a_doc.segment_id != @exclude_id
            LET length_factor = ABS(LENGTH(@query) - LENGTH(a_doc.string)) / LENGTH(@query)
            LET a_score = BM25(a_doc) * 10 / (10 + length_factor)
            FOR b_doc IN strings_view
                SEARCH 
                    b_doc.segment_id == a_doc.segment_id
                    OPTIONS {{collections: [{','.join(f'@{k}' for k in b_aliased)}]}}
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
        
        bind_vars = {
            "query": query,
            **a_aliased,
            **b_aliased,
            "exclude_id": exclude_id,
            "limit": limit or 5
        }
        if self._verbose:
            print(composed_query)
            print(json.dumps(bind_vars, ensure_ascii=False, indent=2))

        return self.execute(composed_query, bind_vars=bind_vars)
    
    
    def tm_query(self, query, root_muids, translation_muids, exclude_id, limit=5):

        if not query or query.isspace():
            return []

        results = self.tm_generic_query(
                query=query,
                a_muids=root_muids,
                b_muids=translation_muids,
                exclude_id=exclude_id,
                limit=limit)
        
        return [{
            "root": result['a'],
            "highlighted": highlight_matching(query, result['a']),
            "translation": result['b'],
            "segment_ids": result['segment_ids']
        } for result in results]

    def search_query(self, *args, user, **kwargs):
        r = self.generic_query(*args, **kwargs)
        result = {
            'total': r.count(),
            'time': r.statistics()['execution_time'],
            'results': []
        }

        
        for entry in r:
            segment_id = entry['segment_id']
            uid = entry['segment_id'].split(':')[0]

            segments = {}
            for key, string in entry.items():
                if key == 'segment_id':
                    continue
                muids = key.split('-')
                try:
                    path = fs.get_matching_entry(uid, muids)
                    permission = get_permissions(str(path), user)
                except fs.NoMatchingEntry:
                    permission = Permission.NONE
                
                segments[key] = {
                    'string': string,
                    'permission': permission.name
                }
            result['results'].append({
                'segment_id': segment_id,
                'segments': segments
            })
        return result

