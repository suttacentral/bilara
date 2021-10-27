def migrate(db):
    db.create_analyzer("path-splitter", "delimiter", {"delimiter": "/"}, ["position", "frequency"])
    links = {
        "strings": {
            "fields": {
                "string": {"analyzers": ["ngrams5"]},
                "muids": {"analyzers": ["identity", "splitter"]},
                "segment_id": {"analyzers": ["identity"]},
                "filepath": {"analyzers": ["identity", "path-splitter"]},
            }
        }
    }
    db.update_arangosearch_view("strings_ngram_view", {"links": links})
