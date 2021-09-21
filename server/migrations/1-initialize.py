"""
Create `strings` collection.
Create `ngrams5` analyzer.
Create `strings_ngram_view` view.
"""
from arango.database import TransactionDatabase


def migrate(db: TransactionDatabase):
    db.create_collection("strings")
    
    db.create_analyzer(
        "ngrams5",
        "pipeline",
        {
            "pipeline": [
                {
                    "type": "aql",
                    "properties": {
                        "queryString": r"""
                          //Remove punctuation
                          LET s1 = SUBSTITUTE(@param, '—', ' ')
                          RETURN REGEX_REPLACE(s1, "[^\\w\\s]", "")
                      """
                    },
                },
                {
                    "type": "norm",
                    "properties": {
                        "locale": "en.utf-8",
                        "case": "lower",
                        "accent": False,
                    },
                },
                {
                    "type": "ngram",
                    "properties": {
                        "min": 5,
                        "max": 5,
                        "preserveOriginal": False,
                        "streamType": "utf8",
                    },
                },
            ]
        },
        ["frequency", "norm", "position"],
    )

    db.create_analyzer("splitter", "delimiter", {"delimiter": "-"})

    links = {
        "strings": {
            "fields": {
                "string": {"analyzers": ["ngrams5"]},
                "muids": {"analyzers": ["identity", "splitter"]},
                "segment_id": {"analyzers": ["identity"]},
            }
        }
    }
    db.create_arangosearch_view("strings_ngram_view", {"links": links})
