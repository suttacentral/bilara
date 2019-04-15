from git import Repo, GitCommandError
from python

import threading
import time
import signal

_lock = threading.RLock()
master = 'master'
AUTO_COMMIT_DELAY = 60 * 3

from config import config
REPO_DIR = config.REPO_DIR
repo = Repo(REPO_DIR)
git = repo.git

_current_branch = None
def checkout_branch(name):
    global _current_branch
    if _current_branch != name:    
        try:
            git.checkout(name)
        except GitCommandError:
            git.checkout(b=name, master)
        _current_branch = name
    return repo.branches[name]

_pending_commits = {}
def update_file(user, file):
    with _git_lock:
        name = user.name
        checkout_branch(name)
        branch = repo.branches[name]
        if name not in _pending_commits:
            if branch.commit.stats.files:
                # If the old commit has no messages we can simply reuse it
                # otherwise we create a new empty commit
                git.commit(allow_empty=True, m=f"Translations by {user.name}", author=f'{user.name} <{user.email}>')
                _pending_commits[name] = time.time()
        commit = branch.commit
        files = commit.stats.files
        if files:
            if file not in files:
                finalize_commit(commit)
            else:
                git.add(file)
                git.commit(amend=True, no_edit=True)


def update_files(user, files):
    with _lock:
        name = user.name
        checkout_branch(name)
        branch = repo.branches[name]
        if branch.commit.files:
            finalize_commit(name)
        
        git.add(files)
        git.commit(m=f"Bulk update", author=f'{user.name} <{user.email}>')
        finalize_commit(name)

def finalize_commit(name):
    with _lock:
        branch = git.checkout(name)
        if not branch.commit.stats.files:
            _pending_commits.pop(name)
            return
        git.push(u='origin', name, force_with_lease=True)
        git.checkout(master)
        git.merge(name, rebase=True)
        _pending_commits.pop(name)
        for i in range(0, 2):
            try:
                git.push(u='origin', master)
                break
            except GitCommandError:
                print('Git push failed, attempting to pull and trying again')
                git.pull()
        else:
            print('Git push failed multiple times')
            return

        git.checkout(name)
        git.rebase(master)


class Finalizer(threading.Thread):
    def __init__(self, interval):
        super()
        self.daemon = False
        self.stopped = threading.Event()
        self.interval = interval
    
    def stop(self):
        self.stopped.set()
        self.step(stopped=True)
        self.join()

    def step(self, stopped=False):
        now = time.time()
        for name, commit_time in tuple(_pending_commits.items()):
            if now - commit_time > AUTO_COMMIT_DELAY or stopped == True:
                finalize_commit(name)
    
    def run(self):
        while not self.stopped.wait(30):
            self.step()

def start_finalizer():
    finalizer = Finalizer(interval=30)
    signal.signal(signal.SIGTERM, finalizer.stop)
    signal.signal(signal.SIGINT, finalizer.stop)
    finalizer.start()
    