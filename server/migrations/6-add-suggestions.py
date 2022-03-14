
def migrate(db):
    """
    An example entry:

  {
    "user": "yoda",
    "segment_id": "dn1:1.1.1",
    "file": "dn1_translation-en-sujato",
    "original_text": "So I have heard. ",
    "suggestion": "Heard thus did I",
    "comment": "",
    "status": "rejected"
  }


    """

    suggestions = db.create_collection('suggestions')
    suggestions.add_persistent_index(['file'])
    suggestions.add_persistent_index(['muids'])
    suggestions.add_persistent_index(['user'])


