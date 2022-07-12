
import json
import regex
import logging
import threading
from itertools import chain
from log import problemsLog
from enum import IntEnum
from config import WORKING_DIR
from util import json_load, json_save

from projects import get_projects, projects_file

class Permission(IntEnum):
    NONE = 0
    VIEW = 1
    SUGGEST = 2
    EDIT = 3


publications_file_name = '_publication-v2.json'
publications_file = WORKING_DIR / publications_file_name





def source_url_to_path(url):
    prefix_rex = regex.compile(r"https://github.com/[\w-]+/[\w-]+/[\w-]+/[\w-]+/(.*)")
    m = prefix_rex.match(url)
    if m:
        return m[1]
    else:
        if url is None:
            reason = '[source_url not defined]'
        elif not url:
            reason = '[source_url is empty]'
        else:
            reason = '[source_url is not a valid github URL]'
        raise ValueError(f'Invalid Source URL {url}: {reason}')

def build_rules(publications, projects):
    result = {
        '*': {
            Permission.EDIT: [],
            Permission.SUGGEST: [],
            Permission.VIEW: ["*"]
        }
    }
    result['_paths'] = {}
    entries = []

    for entry in chain(publications, projects):
        pub_id = entry.get('publication_number') or entry.get('project_uid')
        if 'translation_path' in entry:
            source_path = entry['translation_path']
            is_project = True
        else:
            is_project = False
            try:
                source_path = source_url_to_path(entry['source_url'])
            except ValueError as e:
                problemsLog.add(
                    file=publications_file_name,
                    msg=f"In {entry['publication_number']}: {e.args[0]} "
                )
        creator_github_ids = entry.get('creator_github_handle') or []
        if isinstance(creator_github_ids, str):
            creator_github_ids = [creator_github_ids]

        proofreader_github_ids = entry.get('proofreader_github_handle')  or []
        if isinstance(proofreader_github_ids, str):
            proofreader_github_ids = [proofreader_github_ids]

        result['_paths'][source_path] = True

        if not any(creator_github_ids) and 'parent_publication' not in entry:
            problemsLog.add(
                file=publications_file_name,
                msg=f"Publication {pub_id} has no author or collaborator"
            )



        for github_id in chain(creator_github_ids, proofreader_github_ids):
            if not github_id:
                continue
            if github_id not in result:
                result[github_id] = {
                    Permission.EDIT: [],
                    Permission.SUGGEST: [],
                    Permission.VIEW: ["*"]
                }

        for github_id in creator_github_ids:
            if not github_id:
                continue
            if source_path not in result[github_id][Permission.EDIT]:
                result[github_id][Permission.EDIT].append(source_path)

        for github_id in proofreader_github_ids:
            if not github_id:
                continue
            if source_path not in result[github_id][Permission.SUGGEST]:
                result[github_id][Permission.SUGGEST].append(source_path)

    return result


_cached_rules = {}

def get_rules(rebuild=False):
    mtime = (publications_file.stat().st_mtime_ns, projects_file.stat().st_mtime_ns)
    rules = _cached_rules.get(mtime)
    if rebuild or not rules:
        _cached_rules.clear()
        _cached_rules[mtime] = rules = build_rules(json_load(publications_file), json_load(projects_file))
        threading.Thread(target=validate_permissions, args=(rules,)).start()
    return rules


def get_base_permissions(path, github_id):
    """
    Check what permissions a user has for a path
    """
    if github_id and 'login' in github_id:
        github_id = github_id['login']
    path = str(path)

    rules = get_rules()

    result = Permission.VIEW
    if github_id not in rules:
        return result


    for key in reversed(Permission):
        if key is Permission.NONE:
            continue
        parts = rules[github_id][key] + rules['*'][key]
        if '*' in parts:
            return key
        else:
            rex = regex.compile('|'.join(rf'\b{part}\b' for part in parts))
            if rex.search(path):
                return key
    return result

def get_permissions(path, github_id):
    if 'comment' in path:
        path = path.replace('comment', 'translation')
    permission = get_base_permissions(path, github_id)
    return permission

def validate_permissions(rules=None):
    if not rules:
        rules = get_rules()
    files = WORKING_DIR.glob('**/*.json')
    files = [str(file.relative_to(WORKING_DIR))
             for file in files
             if not any(part for part in file.parts if part.startswith('.'))]

    for user, user_permissions in rules.items():
        if user.startswith('_'):
            continue # Not a valid Github ID, used for bilara
        for paths in user_permissions.values():
            for path in paths:

                if path == '*':
                    continue
                for file in files:
                    if file.startswith(path):
                        break
                else:
                    problemsLog.add(file=publications_file_name,
                                    msg=f"No files match path: {path}")

def make_may_publish_regex():
    rules = get_rules()
    paths = rules['_paths']
    return regex.compile(r'^\L<paths>', paths=paths)


#    authors = json_load(WORKING_DIR / '_author.json')
#    for uid, entry in authors.items():
#        if entry['type'] == 'translator':
#            if uid not in rules:
#                problemsLog.add(file=publications_file_name, msg=f'Translator "{uid}" does not have permissions defined')

#warmup
# get_permissions('/', '')
