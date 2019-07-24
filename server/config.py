import logging
from os import environ

import pathlib

class Config(dict):
    def __getattr__(self, key):
        return self[key]

config = Config({
    # If GITHUB_AUTH is enabled then git details should be provided
    'GITHUB_AUTH_ENABLED': False,

    # If disabled, no push/pull is performed.
    'GIT_SYNC_ENABLED': False,

    # If disabled, the repo dir will be treated as a normal directory
    'GIT_COMMIT_ENABLED': False,

    'GIT_APP_KEY': '',
    'GIT_APP_SECRET': '',
    
    'GIT_USER': '',
    'GIT_PASSWORD': '',
    
    'REPO_URL': None,
    'REPO_DIR':  pathlib.Path(__file__).absolute().parent.parent / 'repo',
    
    'ARANGO_USER': 'root',
    'ARANGO_PASSWORD': 'test',
    'ARANGO_DB_NAME': 'bilara',


    

    'LOCAL_USERNAME': 'Bob',
    'LOCAL_LOGIN': 'Bob',
    'LOCAL_EMAIL': 'bob@example.com'
})

print(config.REPO_DIR)

try:
    import local_config
    config.update(local_config.config)
except ImportError:
    logging.error('local_config.py does not exist')
