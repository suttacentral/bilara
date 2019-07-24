from git import Repo, GitCommandError
from config import config

import threading
import time


import atexit

_lock = threading.RLock()
master = 'master'
AUTO_COMMIT_DELAY = 30

from config import config
REPO_DIR = config.REPO_DIR
repo = Repo(REPO_DIR)
git = repo.git

def checkout_branch(branch_name):
    if repo.active_branch.name == branch_name:
        return repo.active_branch
    
    if branch_name in repo.branches:
        try:
            git.checkout(branch_name)
        except GitCommandError:
            git.stash()
            print(f'Checkout failed for branch {branch_name} : stashing and trying again')
            try:
                git.checkout_branch_name
            except GitCommandError:
                print(f'Could not check out branch {branch_name}')
                raise
    else:
        git.checkout('-b', branch_name, master)
    return repo.active_branch

def create_empty_commit(user, branch_name):
    git.commit(allow_empty=True, m=f'Translations by {user["login"]}', author=f'{user["name"]} <{user["email"]}>')
    _pending_commits[branch_name] = time.time()

_pending_commits = {}
def update_file(file, user):
    file = str(file).lstrip('/')
    with _lock:
        branch_name = user['login']
        
        checkout_branch(branch_name)
        branch = repo.branches[branch_name]
        print(f'Checking out branch {branch_name}')
        files = branch.commit.stats.files
        reuse_commit = False
        if branch_name in _pending_commits:
            if len(files) == 1 and file in files:
                reuse_commit = True
        else:
            if not files:
                # If the old commit has no messages we can simply reuse it
                # otherwise we create a new empty commit
                _pending_commits[branch_name] = time.time()
                reuse_commit = True
        
        if not reuse_commit:
            if branch_name in _pending_commits:
                finalize_commit(branch_name)
            create_empty_commit(user, branch_name)

        print(f'Adding {file} to index')    
        git.add(file)
        print(f'Commiting')
        git.commit(amend=True, no_edit=True)


def update_files(user, files):
    with _lock:
        branch_name = user['login']
        checkout_branch(branch_name)
        branch = repo.branches[branch_name]
        if branch.commit.files:
            finalize_commit(branch_name)
        
        git.add(files)
        git.commit(m=f"Bulk update", author=f'{user["name"]} <{user["email"]}>')
        finalize_commit(branch_name)

def finalize_commit(branch_name, push_master=True, push_branch=True):
    print(f'Finalizing Commit in {branch_name}')
    branch = checkout_branch(branch_name)
    if not branch.commit.stats.files:
        _pending_commits.pop(branch_name)
        return
    if push_branch:
        git.push('-u', 'origin', branch_name, '--force')
    git.checkout(master)
    print('Merging into master... ', end='')
    try:
        git.merge(branch_name, '-Xtheirs')
        print('Success')
    except:
        print('Failure')
        raise
    _pending_commits.pop(branch_name)
    if push_master:
        print('Pushing to master... ', end='')
        for i in range(0, 2):
            try:
                git.push('-u', 'origin', master)
                print('Success')
                break
            except GitCommandError:
                print('Git push failed, attempting to pull and trying again')
                if i == 0:
                    git.pull('-Xtheirs')
        else:
            print('Failure')
            print('Git push failed multiple times')
            return
    print('Rebasing to master')
    git.checkout(branch_name)
    git.rebase(master)


def finalize_commits(force=False):
    if not _pending_commits:
        return
    
    with _lock:
        now = time.time()
        for name, commit_time in tuple(_pending_commits.items()):
            if now - commit_time > AUTO_COMMIT_DELAY or force == True:
                finalize_commit(name)

def finalizer_task_runner(interval):
    while True:
        time.sleep(interval)
        finalize_commits()

atexit.register(finalize_commits, force=True)

def start_finalizer(interval):
    finalizer = threading.Thread(target=finalizer_task_runner, args=(interval,))
    finalizer.daemon = True
    finalizer.start()

_finalizer = start_finalizer(10)