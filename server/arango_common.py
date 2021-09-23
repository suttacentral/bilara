import pathlib
import importlib
from arango import ArangoClient
from arango.client import StandardDatabase

from concurrent.futures import ThreadPoolExecutor, FIRST_COMPLETED, wait

MIGRATIONS_DIR = pathlib.Path(__file__).parent / 'migrations'

def get_db():
    client = ArangoClient()
    return client.db(username="bilara", password="bilara", name="bilara")

def run_migrations():
    db = get_db()
    if not db.has_collection('meta'):
        db.create_collection('meta')
        migrations = []
    else:
        migrations = (db['meta'].get('migrations') or {}).get('migrations')
    migrations_performed = 0
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
            migrations_performed += 1
    
    if migrations_performed:
        print(f'Migrations completed: {migrations_performed}')
    else:
        print(f'No new migrations.')


_executor = ThreadPoolExecutor(max_workers=4)
_limit = 4
_futures = set()

def import_background(collection, docs):

    def error_handler(future):
        result = future.result()
        if result["errors"] > 0:
            print(result)
    
    if len(_futures) > _limit:
        completed, futures = wait(_futures, return_when=FIRST_COMPLETED)
    future = _executor.submit(collection.import_bulk, docs, on_duplicate="replace", halt_on_error=False)
    _futures.add(future)
    future.add_done_callback(error_handler)
    return future
