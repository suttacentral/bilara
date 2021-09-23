def migrate(db):
    db.create_analyzer(
        "simple-normalizer",
        "norm",
        {
            "locale": "en.utf-8",
            "case": "lower",
            "accent": False,
        },
        [],
    )