import logging
from os import environ
from dotenv import dotenv_values
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

    'GITHUB_USERNAME': '',
    'GITHUB_PERSONAL_ACCESS_TOKEN': '',

    # Git Repo
    'GITHUB_REPO': '',
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
    'LOCAL_EMAIL': 'bob@example.com',
    **dotenv_values(".env"),
})

for k in config.keys():
    v = environ.get(k)
    if v:
        config[k] = v

print(config)

GITHUB_REPO = config.GITHUB_REPO
GIT_REMOTE_REPO = config.GIT_REMOTE_REPO
REPO_DIR = config.REPO_DIR
CHECKOUTS_DIR = config.CHECKOUTS_DIR

PUBLISHED_BRANCH_NAME = config.PUBLISHED_BRANCH_NAME
UNPUBLISHED_BRANCH_NAME = config.UNPUBLISHED_BRANCH_NAME
GIT_SYNC_ENABLED = config.GIT_SYNC_ENABLED

WORKING_DIR = CHECKOUTS_DIR / UNPUBLISHED_BRANCH_NAME

# TM_ALIAS format is like: 'foo=bar,spam=baz'
if config.get('TM_ALIAS'):
    TM_ALIAS = dict(t.split('=') for t in config.get('TM_ALIAS', '').split(','))
else:
    TM_ALIAS = {}

if GIT_SYNC_ENABLED:
    GITHUB_ACCESS_TOKEN = config.GITHUB_PERSONAL_ACCESS_TOKEN
else:
    GITHUB_ACCESS_TOKEN = None

import json
