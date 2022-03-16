import threading
from tqdm import tqdm
from git import Repo, RemoteProgress
from config import (
    GIT_REMOTE_REPO,
    REPO_DIR,
    CHECKOUTS_DIR,
    GIT_SYNC_ENABLED
)

class CloneProgress(RemoteProgress):
    def __init__(self):
        super().__init__()
        self.pbar = tqdm()

    def update(self, op_code, cur_count, max_count=None, message=''):
        self.pbar.total = max_count
        self.pbar.n = cur_count
        self.pbar.refresh()

if REPO_DIR.exists() and (REPO_DIR / 'HEAD').exists():
    print('Repo already exists')
    base_repo = Repo(REPO_DIR)
else:
    print("Pulling Repo (one time only)")
    base_repo = Repo.clone_from(
        GIT_REMOTE_REPO, REPO_DIR, bare=True, progress=CloneProgress()
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
        self.lock = threading.RLock()
        self.name = branch_name
        self.path = self.get_checkout_dir()
        if self.path.exists():
            print(f'Checkout for {self.name} does not exist')
            self.repo = Repo(self.path)
        else:
            print(f'Checkout for {self.name} does not exist')

            self.repo = self.get_or_create_repo()

    def get_file_map(self):
        files = {}

        r = self.repo.git.ls_tree('-r', self.name)

        for line in r.split('\n'):
            if line:
                p, t, sha, filepath  = line.split()
                files[filepath] = sha
        return files

    def pull(self):
        print(f'Pulling {self.name}')
        self.repo.git.pull()

    def push(self, **kwargs):
        if not GIT_SYNC_ENABLED:
            print('Not Pushing because disabled in config')
            return
        self.repo.git.push("--set-upstream", "origin", self.name, **kwargs)

    def commit(self, message):
        self.repo.git.commit(m=message)
