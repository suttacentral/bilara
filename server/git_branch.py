import filelock
import time
from retry import retry

from git import Repo, GitCommandError, Actor
from config import (
    GIT_REMOTE_REPO,
    REPO_DIR,
    CHECKOUTS_DIR,
    GIT_SYNC_ENABLED
)

if REPO_DIR.exists():
    base_repo = Repo(REPO_DIR)
else:
    print("Pulling Repo (one time only)")
    base_repo = Repo.clone_from(
        GIT_REMOTE_REPO, REPO_DIR, bare=True
    )

class GitBranch:
    repo = None
    branch = None
    path = None
    name = None
    lock = None

    def get_checkout_dir(self):
        return CHECKOUTS_DIR / self.name

    @property
    def branch(self):
        return self.repo.active_branch

    def get_or_create_repo(self):
        return Repo.clone_from(
            GIT_REMOTE_REPO,
            self.path,
            multi_options=[
                f"--reference={REPO_DIR}",
                "--single-branch",
                f"--branch={self.name}",
            ],
        )

    def __init__(self, branch_name):
        self.lock = filelock.FileLock(f'/tmp/{branch_name}.branch.lock')
        self.name = branch_name
        self.path = self.get_checkout_dir()
        if self.path.exists():
            self.repo = Repo(self.path)
        else:
            self.repo = self.get_or_create_repo()
        self.origin = self.repo.remotes['origin']
        self.repo.git.config('push.default', 'current')

    def get_file_map(self):
        files = {}

        r = self.repo.git.ls_tree('-r', self.name)
        
        for line in r.split('\n'):
            if line:
                p, t, sha, filepath  = line.split()
                files[filepath] = sha
        return files

    @retry(exceptions=IOError, tries=7, delay=0.5, backoff=2)
    def add(self, files):
        self.repo.index.add(files)

    @retry(exceptions=IOError, tries=7, delay=0.5, backoff=2)
    def remove(self, files):
        self.repo.index.remove(files, working_tree=True)

    @retry(exceptions=IOError, tries=5, delay=2, jitter=2)
    def pull(self, *args, **kwargs):
        print(f'Pulling {self.name}')
        self.origin.pull()

    @retry(exceptions=IOError, tries=5, delay=2, jitter=2)
    def push(self, *args, **kwargs):
        if not GIT_SYNC_ENABLED:
            print('Not Pushing because disabled in config')
            return
        self.origin.push(*args, **kwargs)

    @retry(exceptions=IOError, tries=7, delay=0.5, backoff=2)
    def commit(self, message, author_name=None, author_email=None):
        if author_name:
            author = Actor(author_name, author_email)
        else:
            author = None
        self.repo.index.commit(message, author=author)

    def finalize_commit(self):
        if not GIT_SYNC_ENABLED:
            print('Not Pushing because disabled in config')
            return
        
        git = self.repo.git
        
        print(f'Pushing to {self.name}... ', end='')
        for i in range(0, 4):
            try:
                self.origin.push(kill_after_timeout=20).raise_if_error()
                print('Success')
                break
            except (GitCommandError, IOError):
                print('Git push failed, attempting to pull and trying again')
                if i <= 2:
                    git.pull('-Xtheirs', kill_after_timeout=20)

        else:
            print('Failure')
            print('Git push failed multiple times')
            notify.send_message_to_admin('Bilara failed to push to Github, this requires manual intervention', title='Bilara Push Fail')
            return