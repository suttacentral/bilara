def migrate(db):
    links = {
        "strings": {
            "fields": {
                "string": {"analyzers": ["ngrams5"]},
                "muids": {"analyzers": ["identity", "splitter"]},
                "segment_id": {"analyzers": ["identity"]},
            }
        }
    }
    db.replace_arangosearch_view("strings_ngram_view", {"links": links})