from git import Repo, GitCommandError
from config import config

import threading
import time

import notify


import atexit

from search import search

_lock = threading.RLock()
master = 'master'
PUSH_DELAY = 15
working_branch = 'master'

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

_pending_commit = None

def update_file(file, user):
    global _pending_commit
    file = str(file).lstrip('/')
    with _lock:
        branch = checkout_branch(working_branch)

        commit_message = f'Translations by {user["login"]} to {file}'

        if _pending_commit and branch.commit.message == commit_message:
            # We can add onto this commit
            git.add(file)
            git.commit(amend=True, no_edit=True)
        else:
            finalize_commit(working_branch)

            git.add(file)
            try:
                git.commit(m=commit_message, author=f'{user.get("name") or user["login"]} <{user["email"]}>')
                _pending_commit = branch.commit
            except GitCommandError as e:
                if e.status == 1 and ('nothing to commit' in e.stdout or 'nothing added to commit' in e.stdout):
                    # This is unusual but fine
                    pass
                else:
                    raise

def update_files(user, files):
    global _pending_commit
    with _lock:
        branch = checkout_branch(working_branch)
        if _pending_commit:
            finalize_commit(working_branch)

        
        git.add(files)
        git.commit(m=f"Bulk update", author=f'{user["name"] or user["login"]} <{user["email"]}>')
        finalize_commit(branch_name)

def githook(webhook_payload, branch_name=working_branch):
    ref = webhook_payload['ref'].split('/')[-1]
    if ref != branch_name:
        return
    
    added = []
    modified = []
    removed = []
    
    for commit in webhook_payload['commits']:
        if commit['id'] == repo.active_branch.commit.hexsha:
            return 
        added.extend(commit['added'])
        modified.extend(commit['modified'])
        removed.extend(commit['removed'])
    
    print(f'{len(added)} added, {len(modified)} modified, {len(removed)} removed')
    with _lock:
        if _pending_commit:
            finalize_commit()
        git.pull('-Xtheirs')

    if added or removed:
        import app
        app.init()
    
    #search.files_removed([( filepath, get_deleted_file_data(filepath) ) for filepath in removed])
    search.update_partial(added, modified)



def finalize_commit(branch_name=working_branch):
    global _pending_commit
    if not _pending_commit:
        return
    branch = checkout_branch(branch_name)
    if not config.GIT_SYNC_ENABLED:
        print('Not Pushing because disabled in config')
        _pending_commit = None
        return
    print(f'Pushing to {branch_name}... ', end='')
    for i in range(0, 3):
        try:
            git.push('-u', 'origin', master)
            print('Success')
            break
        except GitCommandError:
            print('Git push failed, attempting to pull and trying again')
            if i <= 1:
                git.pull('-Xtheirs')
            
    else:
        print('Failure')
        print('Git push failed multiple times')
        notify.send_message_to_admin('Bilara failed to push to Github, this requires manual intervention', title='Bilara Push Fail')
        return
    _pending_commit = None


def finalizer_task_runner(interval):
    while True:
        time.sleep(interval)
        if not _pending_commit:
            continue
        
        with _lock:
            now = time.time()
            if not _pending_commit:
                continue
            if now - _pending_commit.committed_date > PUSH_DELAY:
                finalize_commit()

atexit.register(finalize_commit)

def start_finalizer(interval):
    finalizer = threading.Thread(target=finalizer_task_runner, args=(interval,))
    finalizer.daemon = True
    finalizer.start()
    return finalizer

_finalizer = start_finalizer(5)