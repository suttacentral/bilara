import git
from config import config
from git import RemoteProgress

import threading

def get_repo():
    if config.REPO_DIR.exists():
        repo = git.repo.Repo(config.REPO_DIR)
    else:
        print('Cloning remote repo')
        repo_uri = config.REPO_URL.split('//')[-1]
        url = f'https://{config.GIT_USER}:{config.GIT_PASSWORD}@{repo_uri}'
        repo = git.repo.Repo.clone_from(url, config.REPO_DIR)

repo = get_repo()
lock = threading.Lock()

