import json
from log import logging
import regex

def numericsortkey(string, _split=regex.compile(r'(\d+)').split):
    # if regex.fullmatch('\d+', s) then int(s) is valid, and vice-verca.
    return [int(s) if i % 2 else s for i, s in enumerate(_split(str(string)))]


def humansortkey(string, _split=regex.compile(r'(\d+(?:[.-]\d+)*)').split):
    # With split, every second element will be the one in the capturing group.
    return [numericsortkey(s) if i % 2 else s
            for i, s in enumerate(_split(str(string)))]

def bilarasortkey(string):
    subresult = humansortkey(string)

    result = []
    for i, obj in enumerate(subresult):
        if '^' in obj:
            result.append('')
        else:
            result.append(obj)
    
    if len(result) > 1 and result[-1].isalpha():
        result[-1] = result[-1].zfill(4)
    return result
    
            
        
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


def profile(sort_args=['cumulative'], print_args=[30]):
    import cProfile
    import pstats

    profiler = cProfile.Profile()

    def decorator(fn):
        def inner(*args, **kwargs):
            result = None
            try:
                result = profiler.runcall(fn, *args, **kwargs)
            finally:
                stats = pstats.Stats(profiler)
                stats.strip_dirs().sort_stats(*sort_args).print_stats(*print_args)
            return result
        return inner
    return decorator