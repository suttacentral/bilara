
import arango
from config import config


client = ArangoClient(protocol='http', host='localhost', port=8529)
sys_db = client.db('_system', username='root', password='test')
if not sys_db.has_database('bilara'):
    sys_db.create_database('bilara')

db = client.db(config.ARANGO_DB_NAME, username=config.ARANGO_USER, password=config.ARANGO_PASSWORD)

if db.has_collection('users'):
    users = db.collection('users')
else:
    users = db.create_collection('users')

if db.has_collection('texts'):
    texts = db.collection('texts')
else:
    texts = db.create_collection('texts')
