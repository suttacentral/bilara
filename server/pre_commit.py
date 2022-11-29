import regex
from bilara_types import Segment

def modify(segment: Segment):
    if should_normalize(segment['field']):
        segment['value'] = normalize_trailing_spaces(segment['value'])
    return segment


def should_normalize(field: str):
    if field.startswith('root-') or field.startswith('translation-'):
        if '-site-' in field or '-blurb-' in field or '-name-' in field:
            return False
        return True
    
    if field.startswith('variant-'):
        return True

    if field.startswith('comment-'):
        return True

def normalize_trailing_spaces(value: str):
    if value.isspace() or value == "":
        return value
    
    new_value = value.rstrip()

    if new_value.endswith('—'):
        return value
    
    new_value += ' '
    return new_value