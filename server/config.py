import logging
from os import environ

import pathlib

class Config(dict):
    def __getattr__(self, key):
        return self[key]

config = Config({
    'GIT_APP_KEY': '',
    'GIT_APP_SECRET': '',
    
    'GIT_USER': '',
    'GIT_PASSWORD': '',
    
    'REPO_URL': 'https://github.com/suttacentral/bilara-data.git',
    'REPO_DIR':  pathlib.Path(__file__).absolute().parent.parent / 'repo',
    
    'ARANGO_USER': 'root',
    'ARANGO_PASSWORD': 'test',
    'ARANGO_DB_NAME': 'bilara'
})

print(config.REPO_DIR)

try:
    import local_config
    config.update(local_config.config)
except ImportError:
    logging.error('local_config.py does not exist')
