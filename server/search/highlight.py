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
    a_words = regex.findall(r'\w+', a)

    def repl_fn(m):
        word = m[0]
        if word in a_words:
            return f'<mark>{word}</mark>'
        else:
            longest_match = ''
            for other_word in a_words:
                prefix = common_prefix(word, other_word)
                if len(prefix) > len(longest_match):
                    longest_match = prefix
            if len(longest_match) > 5:
                return f'<mark>{prefix}</mark>{word[len(prefix):]}'
        return word

    return regex.sub(r'\w+', repl_fn, b)