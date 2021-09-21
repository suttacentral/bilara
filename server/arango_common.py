import pathlib
import importlib
from arango import ArangoClient
from arango.client import StandardDatabase

MIGRATIONS_DIR = pathlib.Path(__file__).parent / 'migrations'

def get_db():
    client = ArangoClient()
    return client.db(username="bilara", password="bilara", name="bilara")

def run_migrations(db: StandardDatabase):
    if not db.has_collection('meta'):
        db.create_collection('meta')
        migrations = []
    else:
        migrations = db['meta'].get('migrations')['migrations']

    for file in sorted(MIGRATIONS_DIR.glob('*.py'), key=lambda file: int(file.stem.split('-')[0])):
        if file.stem not in migrations:
            module = importlib.import_module(f'migrations.{file.stem}')
            read_coll = ['meta']
            write_coll = ['meta']
            if hasattr(module, 'read_coll'):
                read_coll.append(module.read_coll)
            if hasattr(module, 'write_coll'):
                write_coll.append(module.write_coll)

            txn_db = db.begin_transaction(read=read_coll, write=write_coll)
            
            module.migrate(txn_db)
                
            migrations.append(file.stem)
            txn_db['meta'].insert({'_key': 'migrations', 'migrations': migrations}, overwrite=True)
            txn_db.commit_transaction()
            print(f'Migration complete: {file.stem}')
            if module.__doc__:
                print(module.__doc__)
        
