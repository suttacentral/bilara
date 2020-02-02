import regex

def numericsortkey(string, _split=regex.compile(r'(\d+)').split):
    # if regex.fullmatch('\d+', s) then int(s) is valid, and vice-verca.
    return [int(s) if i % 2 else s for i, s in enumerate(_split(str(string)))]


def humansortkey(string, _split=regex.compile(r'(\d+(?:[.-]\d+)*)').split):
    # With split, every second element will be the one in the capturing group.
    return [numericsortkey(s) if i % 2 else s
            for i, s in enumerate(_split(str(string)))]

def alpha_to_numeric(string):
    m = 1
    result = 0
    for c in reversed(string):
        result += m * (ord(c) - 96)
        m *= 26
    return result
        


def bilarasortkey(string):
    subresult = humansortkey(string)

    result = []
    for i, obj in enumerate(subresult):
        if '^' in obj:
            result.append('')
        else:
            result.append(obj)
    
    if len(result) > 1 and result[-1].isalpha():
        result[-1] = alpha_to_numeric(result[-1])
    return result
    
            
        
