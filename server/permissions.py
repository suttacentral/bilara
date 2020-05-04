import json
import regex
from config import config
from fs import json_load

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
                    "edit": [github_id],
                    "suggest": ["*"],
                    "view": ["*"]
                }
            if source_path not in result[github_id]["edit"]:
                result[github_id]["edit"].append(source_path)
            
    
    return result
            
        
_cached_rules = {}
def get_permissions(path, github_id):
    mtime = publications_file.stat().st_mtime_ns
    rules = _cached_rules.get(mtime)
    if not rules:
        _cached_rules.clear()
        _cached_rules[mtime] = rules = build_rules(json_load(publications_file))
    
    result = {"edit": False, "suggest": True, "view": True}
    if github_id not in rules:
        return result
    
    for key in ["edit", "suggest", "view"]:
        parts = rules[github_id][key]
        if '*' in parts:
            result[key] = True
        else:
            rex = regex.compile('|'.join(rf'\b{part}\b' for part in parts))
            if rex.search(path):
                result[key] = True
    return result
