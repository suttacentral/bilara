
import json
import regex
import logging
import threading
from log import problemsLog
from enum import IntEnum
from config import config
from util import json_load, json_save

class Permission(IntEnum):
    NONE = 0
    VIEW = 1
    SUGGEST = 2
    EDIT = 3


REPO_DIR = config.REPO_DIR

publications_file_name = '_publication.json'
publications_file = REPO_DIR / publications_file_name

with publications_file.open() as f:
    pass
    
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

def build_rules(publications):
    result = {}
    for pub_id, entry in publications.items():
        try:
            source_path = source_url_to_path(entry['source_url'])
        except ValueError as e:
            problemsLog.add(
                file=publications_file_name,
                msg=f"In {entry['publication_number']}: {e.args[0]} "
            )
        github_ids = [entry.get('author_github_handle')]
        for collaborator in entry.get("collaborator", []):
            github_ids.append(collaborator.get('author_github_handle'))
        
        if not any(github_ids) and 'parent_publication' not in entry:
            problemsLog.add(
                file=publications_file_name,
                msg=f"Publication {pub_id} has no author or collaborator"
            )
        
        for github_id in github_ids:
            if not github_id:
                continue
            if github_id not in result:
                result[github_id] = {
                    Permission.EDIT: [],
                    Permission.SUGGEST: [],
                    Permission.VIEW: ["*"]
                }
            if source_path not in result[github_id][Permission.EDIT]:
                result[github_id][Permission.EDIT].append(source_path)
            
    
    return result
            
        
_cached_rules = {}

def get_rules():
    mtime = publications_file.stat().st_mtime_ns
    rules = _cached_rules.get(mtime)
    if not rules:
        _cached_rules.clear()
        _cached_rules[mtime] = rules = build_rules(json_load(publications_file))
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
        parts = rules[github_id][key]
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
    # Downgrade permissions for non-translations
    # if not regex.match(r'\b(?:translation)\b', path):
    if permission == Permission.SUGGEST:
        permission = Permission.VIEW

    return permission

def validate_permissions(rules=None):
    if not rules:
        rules = get_rules()
    files = REPO_DIR.glob('**/*.json')
    files = [str(file.relative_to(REPO_DIR)) 
             for file in files 
             if not any(part for part in file.parts if part.startswith('.'))]

    for user, user_permissions in rules.items():
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

#    authors = json_load(REPO_DIR / '_author.json')
#    for uid, entry in authors.items():
#        if entry['type'] == 'translator':
#            if uid not in rules:
#                problemsLog.add(file=publications_file_name, msg=f'Translator "{uid}" does not have permissions defined')

#warmup
get_permissions('/', '')