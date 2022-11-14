def migrate(db):
    db.create_analyzer(
        "text_edge_ngrams",
        "text",
        {
            "edgeNgram": {"min": 5, "max": 5, "preserveOriginal": True},
            "locale": "en.utf-8",
            "case": "lower",
            "accent": False,
            "stemming": False,
            "stopwords": ["ti", "ca", "kho", "na", "bhikkhave", "vā", "hoti", "pe", "so", "te", "evaṁ",
                            "taṁ", "me", "bhante", "bhikkhu", "bhagavā", "ayaṁ", "atha", "yaṁ", "pana", 
                            "tassa", "no", "yo", "tattha", "ye", "dhammā"],
            "streamType": "utf8",
        },
        ["frequency", "norm", "position"],
    )

    db.create_analyzer(
        "normalizer",
        "text",
        {
            "locale": "en.utf-8",
            "case": "lower",
            "accent": False,
            "stemming": False,
            "stopwords": [],
            "streamType": "utf8",
        },
        ["frequency", "norm", "position"],
    )

    db.create_analyzer(
        "cjk_ngram_analyzer",
        "ngram",
        {
            "min": 1, 
            "max": 5, 
            "preserveOriginal": True,
            "streamType": "utf8"
        },
        ["frequency", "norm", "position"],
    )

    db.create_analyzer("splitter", "delimiter", {"delimiter": "-"})
