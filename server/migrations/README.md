# About Bilara Migrations

The migrations folder contains migrations for ArangoDB Database used by Bilara

Each migration should have a filename of the form `1-dostuff.py`, this is not
a valid name for normal imports, but importlib.import_module is used.

The migration file must contain a function:

```
def migrate(db):
  # do stuff
```

The db parameter is an arango.database.TransactionDatabase, the migration and 
the record that the migration has been performed are a single atmoic transaction.

If the migration reads or writes to a collection (this is unusual) then the migration
file should contain read_coll and write_coll, arrays containing the names of collections
read or write. This information is used for setting up the Transaction.