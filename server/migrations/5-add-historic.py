
def migrate(db):
    """
    An example entry:

    {
        "context": "something",
        "origin": "some origin",
        "strings": {
            "pli": "sati",
            "en": "memory"
        }
    }


    """
    
    db.create_collection('historic')
    links = {
        "historic": {
            "fields": {
                "strings": {"analyzers": ["ngrams5"], "includeAllFields": True},
                "context": {"analyzers": ["identity"]},
                "origin": {"analyzers": ["identity"]},
            }
        }
    }
    db.create_arangosearch_view("historic_ngram_view", {"links": links})

    