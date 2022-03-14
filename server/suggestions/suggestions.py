import time
from arango_common import get_db


def add_suggestion(data, user):
    '''
    Add a new suggestion, returning the suggestion_key

    '''
    suggestion = {
        'user': user['login'],
        'segment_id': data['segment_id'],
        'file': data['file'],
        'muids': file.split('_')[1],
        'original_text': data['original_text'],
        'suggested_text': data['suggested_text'],
        'comment': data['comment'],
        'status': 'pending',
        'ctime': int(time.time() * 1000)
    }

    suggestion['_key'] = f"{suggestion['file']}_{suggestion['user']}_{suggestion['segment_id']}"

    db = get_db()

    db.collection['suggestions'].insert_document(suggestion, overwrite=True)

    return {'suggestion_key': suggestion['_key']}

def update_suggestion(suggestion_key, data):
    '''
    Modify an existing suggestion

    data should be something like
    {
        'status': 'accepted'
    }

    {
        'suggested_text': 'something else'
    }

    '''
    db = get_db()
    db.collection['suggestions'].update({'_key': suggestion_key, **data})

TEXT_QUERY = '''
FOR doc IN suggestions
    FILTER doc.file == @file
    RETURN doc
'''
def get_suggestions_for_text(file_stem):
    '''
    Get the suggestions that pertain to a particular text
    This is not specific to a user.
    '''
    db = get.db()

    result = db.aql.execute(TEXT_QUERY, bind_vars={'file': file_stem})
    return result

USER_QUERY = '''
FOR doc IN suggestions
    FILTER doc.muids == @muids
    FILTER doc.status == 'pending'
    RETURN doc
'''
def get_suggestions_for_translator(user):
    '''
    Get the suggestions directed towards a particular user
    '''
    return {}


