import logging
from os import environ

import pathlib

class Config(dict):
    def __getattr__(self, key):
        return self[key]

BASE_DIR = pathlib.Path(__file__).absolute().parent.parent

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

    # Git Repo
    'GH_REPO': '',
    'GIT_REMOTE_REPO': '',
    'REPO_DIR':  BASE_DIR / 'repo',
    'CHECKOUTS_DIR': BASE_DIR / 'checkouts',

    'PUBLISHED_BRANCH_NAME': 'published',
    'UNPUBLISHED_BRANCH_NAME': 'unpublished',
    'REVIEW_BRANCH_NAME': 'review',

    'SECRET': 'CHANGE ME',
    
    'ARANGO_USER': 'root',
    'ARANGO_PASSWORD': 'test',
    'ARANGO_DB_NAME': 'bilara',

    'PUSHOVER_TOKEN': '',
    'PUSHOVER_ADMIN_KEY': '',

    'LOCAL_USERNAME': 'Bob',
    'LOCAL_LOGIN': 'Bob',
    'LOCAL_EMAIL': 'bob@example.com'
})



try:
    import local_config
    config.update(local_config.config)
except ImportError:
    logging.warning('local_config.py does not exist')



GH_REPO = config.GH_REPO
GIT_REMOTE_REPO = config.GIT_REMOTE_REPO
REPO_DIR = config.REPO_DIR
CHECKOUTS_DIR = config.CHECKOUTS_DIR

PUBLISHED_BRANCH_NAME = config.PUBLISHED_BRANCH_NAME
UNPUBLISHED_BRANCH_NAME = config.UNPUBLISHED_BRANCH_NAME
GIT_SYNC_ENABLED = config.GIT_SYNC_ENABLED

WORKING_DIR = CHECKOUTS_DIR / UNPUBLISHED_BRANCH_NAME

TM_ALIAS = config.get('TM_ALIAS', {})

if GIT_SYNC_ENABLED:
    GITHUB_ACCESS_TOKEN = config.GITHUB_ACCESS_TOKEN
else:
    GITHUB_ACCESS_TOKEN = None