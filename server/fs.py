import json
from config import config
from util import humansortkey

REPO_DIR = config.REPO_DIR


def make_file_index():
    global _tree_index
    global _flat_index
    
    index = {}
    def recurse(folder, old_meta=None):
        subtree = {}
        
        metafile = folder / '_meta.json'
        if metafile.exists():
            with metafile.open() as f:
                meta = json.load(f)
                print(meta)
        else:
            meta = {}
        if old_meta:
            meta.update(old_meta)
        
        for file in sorted(folder.glob('*'), key=humansortkey):
            if file.name.startswith('.'):
                continue
            if file.name == '_meta.json':
                continue
            if file.is_dir():
                subtree[file.name] = recurse(file, old_meta=meta)
            else:
                mtime = file.stat().st_mtime_ns
                index[file.name] = subtree[file.name] = {
                    'path': str(file.relative_to(REPO_DIR)),
                    'mtime': mtime,
                    **meta
                }
        return subtree
    
    _tree_index = recurse(REPO_DIR)
    _flat_index = index
    


_tree_index = None
_flat_index = None


