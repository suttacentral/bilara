import json
import pathlib
import logging
from config import config
from util import humansortkey

from collections import defaultdict, Counter

REPO_DIR = config.REPO_DIR

for file in REPO_DIR.glob('**/*.json'):
    if file.name == '_meta.json':
        new_file = file.parent / f'_{file.parent.name}'
        file.rename(new_file)

def strip_suffix(file):
    if file.isdir():
        return file.name
    else:
        return file.stem

def make_file_index():
    global _tree_index
    global _flat_index

    index = {}
    def recurse(folder, old_meta=None, names=None):
        subtree = {}

        meta = old_meta.copy() if old_meta else {}

        metafile = folder / '_meta.json'
        if not metafile.exists():
            metafile = folder / f'_{folder.name}.json'


        names = names.copy() if names else {}
        if metafile.exists():
            with metafile.open() as f:
                new_meta = json.load(f)
            if 'names' in new_meta:
                names.update(new_meta.pop('names'))
            meta.update(new_meta)


        for file in sorted(folder.glob('*'), key=humansortkey):
            if file.name.startswith('.'):
                continue
            if file == metafile:
                continue
            if file.is_dir():
                subtree[file.name] = recurse(file, old_meta=meta, names=names)
                _meta = meta.copy()
                if file.name in names:
                    _meta['name'] = names[file.name]
                subtree[file.name]['_meta'] = _meta
            else:
                mtime = file.stat().st_mtime_ns
                obj = subtree[file.name] = {
                    'path': '/' + str(file.relative_to(REPO_DIR)),
                    'mtime': mtime,
                    '_meta': meta
                }
                uid = file.name if file.is_dir() else file.stem
                if uid not in index:
                    index[uid] = []
                index[uid].append(obj)
        return subtree

    _tree_index = recurse(REPO_DIR)
    _flat_index = index



_tree_index = None
_flat_index = None

class StatsCalculator:
    def __init__(self):
        self._completion = {}

    def get_completion(self, translation):

        path = translation['path']

        if path not in self._completion:
            self._completion[path] = self.calculate_completion(translation)

        return self._completion[path]

    def calculate_completion(self, translation):
        translated_count = self.count_strings(translation)

        source = get_source(translation)
        source_count = self.count_strings(source)

        return {'_translated': translated_count, '_source': source_count}

    def count_strings(self, entry):
        json_file = REPO_DIR / entry['path'][1:]
        data = json_load(json_file)
        count = 0
        for k, v in data.items():
            if k == '_meta':
                continue
            if v:
                count += 1
        return count

stats_calculator = StatsCalculator()

def get_source(translation):
    name = pathlib.Path(translation['path']).stem
    query = {'language': translation['_meta']['source_lang'],
             'edition': translation['_meta']['source_edition']}
    return get_matching_entry(name, query)

def get_matching_entry(filename, query):
    for result in _flat_index[filename]:
        if not result['path'].endswith('.json'):
            continue
        for k, v in query.items():
            if result['_meta'].get(k) != v:
                break
        else:
            #If we did not break we matched the query
            print(filename, result)
            return result
    raise FileNotFoundError(filename, keys)


def json_load(file):
    with file.open('r') as f:
        try:
            return json.load(f)
        except Exception as e:
            logging.error(file)
            raise e


def load_json(result):
    json_file = REPO_DIR / result['path'][1:]
    return {'_meta': result['_meta'], **json_load(json_file)}

def get_data(uid, to_lang, desired={'source', 'translation'}):
    if not _flat_index:
        make_file_index()

    translation = None
    source = None
    for result in _flat_index[uid]:
        path = result['path']
        if path.startswith(f'/translation/{to_lang}/'):
            translation = result
            break

    if not translation:
        raise ValueError(f'{uid} not found')

    source_lang = translation['_meta']['source_lang']
    for result in _flat_index[uid]:
        path = result['path']
        if path.startswith(f'/source/{source_lang}/'):
            source = result

    result = {
        'source': load_json(source),
        'target': load_json(translation)
    }

    return result


def sum_counts(subtree):
    counts = {'_translated_count': 0, '_source_count': 0}

    for key, child in subtree.items():
        if '_source' in child:
            counts['_source_count'] += child['_source']
            counts['_translated_count'] += child.get('_translated', 0)
        else:
            if key.startswith('_'):
                continue
            child_counts = sum_counts(child)
            for prop in ['_translated_count', '_source_count']:
                counts[prop] += child_counts[prop]
    subtree.update(counts)
    return counts

def get_condensed_tree(path):
    if not _tree_index:
        make_file_index()
    tree = _tree_index
    for part in path:
        tree = tree[part]

    def recurse(subtree):
        result = {}
        for key, value in subtree.items():
            if key.endswith('.json'):
                result[key] = stats_calculator.get_completion(value)
            elif key.startswith('_meta'):
                pass
            else:
                result[key] = recurse(value)
        return result

    tree = recurse(tree)
    sum_counts(tree)
    return tree




