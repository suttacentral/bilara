'''
Create tasks collection and indexes.
'''
def migrate(db):
    """
    An example entry:
    
    status can be: "pending", "running", "failed", "completed"

    {
        "id": "do-something-xyz-111",
        "type": "update-segment",
        "ctime": 11111111111,
        "status": "created",
        "payload": {}
    }


    """
    
    tasks = db.create_collection('tasks')
    tasks.add_persistent_index(fields=["status"])
    tasks.add_ttl_index(fields=["ctime"], expiry_time=86400*30)