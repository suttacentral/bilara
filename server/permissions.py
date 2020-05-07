
import json
import regex
from enum import IntEnum
from config import config
from util import json_load, json_save

class Permission(IntEnum):
    NONE = 0
    VIEW = 1
    SUGGEST = 2
    EDIT = 3


REPO_DIR = config.REPO_DIR


publications_file = REPO_DIR / '_publication.json'

with publications_file.open() as f:
    pass
    
def source_url_to_path(url):
    prefix_rex = regex.compile(r"https://github.com/[\w-]+/[\w-]+/[\w-]+/[\w-]+/(.*)")
    m = prefix_rex.match(url)
    if m:
        return m[1]
    else:
        raise ValueError(f'Invalid Source URL {url}')

def build_rules(publications):
    result = {}
    for pub_id, entry in publications.items():
        source_path = source_url_to_path(entry['source_url'])
        github_ids = [entry.get('author_github_handle')]
        for collaborator in entry.get("collaborator", []):
            github_ids.append(collaborator.get('author_github_handle'))
        
        for github_id in github_ids:
            if not github_id:
                continue
            if github_id not in result:
                result[github_id] = {
                    Permission.EDIT: [github_id],
                    Permission.SUGGEST: ["*"],
                    Permission.VIEW: ["*"]
                }
            if source_path not in result[github_id][Permission.EDIT]:
                result[github_id][Permission.EDIT].append(source_path)
            
    
    return result
            
        
_cached_rules = {}
def get_base_permissions(path, github_id):
    """
    Check what permissions a user has for a path
    """
    if github_id and 'login' in github_id:
        github_id = github_id['login']
    print(f'Check permissions for {github_id} @ {path}')
    path = str(path)
    mtime = publications_file.stat().st_mtime_ns
    rules = _cached_rules.get(mtime)
    if not rules:
        _cached_rules.clear()
        _cached_rules[mtime] = rules = build_rules(json_load(publications_file))
    
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
    permission = get_base_permissions(path, github_id)
    # Downgrade permissions for non-translations
    if not regex.match(r'\b(?:translation)\b', path):
        if permission == Permission.SUGGEST:
            permission = Permission.VIEW
    
    return permission

