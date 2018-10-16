import json
from config import config
from util import humansortkey

REPO_DIR = config.REPO_DIR

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


