import regex

string_a = 'Taṃ devo makkhaliṃ gosālaṃ payirupāsatu.'
string_b = 'Appeva nāma devassa makkhaliṃ gosālaṃ payirupāsato cittaṃ pasīdeyyā”ti.'

def common_prefix(a, b):
    result = []
    for c1, c2 in zip(a, b):
        if c1 != c2:
            break
        result.append(c1)
    return ''.join(result)

def highlight_matching(a, b):
    a_words = [w.casefold() for w in regex.findall(r'\w+', a)]

    def repl_fn(m):
        word = m[0]
        if word.casefold() in a_words:
            return f'<mark>{word}</mark>'
        else:
            longest_match = 0
            for other_word in a_words:
                prefix = common_prefix(word.casefold(), other_word.casefold())
                if len(prefix) > longest_match:
                    longest_match = len(prefix)
            if longest_match >= 5:
                return f'<mark>{word[:longest_match]}</mark>{word[longest_match:]}'
        return word

    return regex.sub(r'\w+', repl_fn, b).replace('</mark> <mark>', ' ')