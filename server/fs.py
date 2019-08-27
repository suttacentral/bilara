import json
import pathlib
import logging
import threading
import linecache
from config import config
from util import humansortkey, bilarasortkey
from itertools import groupby
from copy import copy, deepcopy

from collections import defaultdict, Counter

import tm
import simple_git_fs as git_fs

REPO_DIR = config.REPO_DIR

def get_file(filepath):
    if filepath.startswith('/'):
        filepath = filepath[1:]
    return REPO_DIR / filepath


def strip_suffix(file):
    if file.isdir():
        return file.name
    else:
        return file.stem

def load_json(file):
    try:
        with file.open('r') as f:
            return json.load(f)
    except json.JSONDecodeError as err:
        logging.error(file)
        logging.error(err.doc)
        raise err

def invert_meta(metadata):
    new_meta = {}
    for key, obj in deepcopy(metadata).items():
        type = obj.pop('type')
        obj['uid'] = key
        new_meta[type] = obj
    return new_meta

def get_uid_and_muids(file):
    if isinstance(file, str):
        file = pathlib.Path(file)

    if file.suffix in {'.json', '.html'}:
        uid, muid_string = file.stem.split('_')
    else:
        uid, muid_string = file.name.split('_')
    return uid, muid_string.split('-')

def make_file_index():
    global _tree_index
    global _uid_index
    global _muid_index
    global _file_index

    print('Building file index')

    _muid_index = muid_index = {}
    _uid_index = uid_index = {}
    _file_index = file_index = {}
    def recurse(folder, meta_definitions=None):
        subtree = {}
        meta_definitions = meta_definitions.copy()

        metafiles = set(folder.glob('_*.json'))
        if metafiles:
            for metafile in sorted(metafiles, key=humansortkey):
                meta_definitions.update(json_load(metafile))
        
        for file in sorted(folder.glob('*'), key=humansortkey):
            
            if file.name.startswith('.'):
                continue
            if file in metafiles:
                continue
            filename = file.stem
            meta = {}
            for part in file.parts:
                if part.endswith('.json'):
                    part = part[:-5]
                if part in meta_definitions:
                    meta[part] = meta_definitions[part]
            if file.is_dir():
                subtree[file.name] = recurse(file, meta_definitions=meta_definitions)
                subtree[file.name]['_meta'] = meta
            elif file.suffix == '.json':

                mtime = file.stat().st_mtime_ns
                path = str(file.relative_to(REPO_DIR))
                obj = subtree[filename] = {
                    'path': path,
                    'mtime': mtime,
                    '_meta': meta
                }
                if '_' in filename:
                    uid, muids = get_uid_and_muids(file)
                else:
                    uid = file.name if file.is_dir() else file.stem
                    muid = None
                obj['uid'] = uid
                if uid not in uid_index:
                    uid_index[uid] = set()
                uid_index[uid].add(filename)
                if filename in file_index:
                    logging.error('{str(file)} not unique')
                file_index[filename] = obj
                if muids:
                    for muid in muids:
                        if muid not in muid_index:
                            muid_index[muid] = set()
                        muid_index[muid].add(filename)

        return subtree

 

    _tree_index = recurse(REPO_DIR, {})
    _uid_index = uid_index
    _muid_index = muid_index
    _file_index = file_index

    for v in file_index.values():
        v['_meta'] = invert_meta(v['_meta'])

    build_thread = threading.Thread(target=tm.build_tm_if_needed, args=(len(_uid_index),))
    build_thread.start()


_tree_index = None
_uid_index = None

class StatsCalculator:
    def __init__(self):
        self._completion = {}

    def get_completion(self, translation):

        path = translation['path']

        if path not in self._completion:
            self._completion[path] = self.calculate_completion(translation)

        return copy(self._completion[path])

    def calculate_completion(self, translation):
        translated_count = self.count_strings(translation)

        source_entry = get_source_entry(translation)
        source_count = self.count_strings(source_entry)

        return {'_translated': translated_count, '_source': source_count}

    def count_strings(self, entry):
        json_file = get_file(entry['path'])
        data = json_load(json_file)
        count = 0
        for k, v in data.items():
            if k == '_meta':
                continue
            if v:
                count += 1
        return count

stats_calculator = StatsCalculator()

def get_matching_entries(uid, muids=None):
    try:
        result = _uid_index[uid]
        if muids:
            for muid in muids:
                result.intersection_update(_muid_index[muid])
        return result
    except KeyError as e:
        raise ValueError(f'No match for "{e.args[0]} for query {uid}, {muids}')

def get_matching_entry(uid, muids=None):
    result = get_matching_entries(uid, muids)
    if len(result) == 1:
        (result, ) = result
        return result
    elif len(result) == 0:
        raise ValueError(f'No matches for {uid}, {muids}')
    else:
        raise ValueError(f'Multiple matches for {uid}, {muids}')

def get_source_entry(translation):
    uid = translation['uid']
    root_lang = get_child_property_value(translation, 'root_lang')
    root_edition = get_child_property_value(translation, 'root_edition')
    
    return _file_index[get_matching_entry(uid, ['root', root_lang, root_edition] )]




def json_load(file):
    with file.open('r') as f:
        try:
            return json.load(f)
        except Exception as e:
            logging.error(file)
            raise e

def json_save(data, file):
    with file.open('w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_json(result):
    _meta = result.get('_meta', {})
    _meta['path'] = result.get('path')
    json_file = get_file(result['path'])
    return {**_meta, 'segments': json_load(json_file)}

def get_child_property_value(obj, name):
    for child_obj in obj['_meta'].values():
        if name in child_obj:
            return child_obj[name]


def get_match(matches):
    if len(matches) == 0:
        raise ValueError('No matches')
    elif len(matches) > 1:
        raise ValueError('More than one match')
    (match,) = matches
    return match
    

def get_data(filename, extra=['root']):
    result = {}
    primary_result = load_json(_file_index[filename])
    primary_type = primary_result['category']['uid']

    result[primary_type] = primary_result

    if extra:
        uid, _ = get_uid_and_muids(filename)
        for muid in extra:
            result[muid] = load_json(_file_index[get_match(_uid_index[uid].intersection(_muid_index[muid]))])
        
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
            if value.get('path', '').endswith('.json'):
                result[key] = stats_calculator.get_completion(value)
                result[key]['_type'] = 'document'
            elif key.startswith('_meta'):
                pass
            else:
                result[key] = recurse(value)
                result[key]['_type'] = 'node'
        return result

    tree = recurse(tree)
    sum_counts(tree)
    return tree

def update_segments(segments, user):
    results = {}
    for filepath, group in groupby(segments.items(), lambda t: t[1]['filepath']):
        file_segments = list(group)
        results.update(update_file(filepath, file_segments, user))
            
    try:
        tm.update_docs(segments)
    except Exception as e:
        logging.exception("Could not update TM")
        #logging.error("Could not update TM")
    return results


def update_file(filepath, segments, user):
    with git_fs._lock:
        print(f'Updating {filepath} for {user}')
        file = get_file(filepath)

        file_data = json_load(file)

        for key, segment in sorted(segments, key=lambda t: t[1]['timestamp']):
            file_data[segment['segmentId']] = segment['value']

        sorted_data = dict(sorted(file_data.items(), key=bilarasortkey))
        try:
            json_save(sorted_data, file)
            result = {key: "SUCCESS" for key, segment in segments}
            success = True
        except Exception as e:
            logging.exception(f"error writing json to {filepath}")
            result = {key: "ERROR" for key in segments}
            success = False

        if success and config.GIT_COMMIT_ENABLED:
            git_fs.update_file(filepath, user)
        return result



make_file_index()