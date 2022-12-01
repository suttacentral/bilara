import filelock
import time
from retry import retry
from pathlib import Path
import notify
import logging

import pygit2

from git import Repo, GitCommandError, Actor, GitCmdObjectDB
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

class MergeConflict(Exception):
    pass

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

    def __init__(self, branch_name, repo_path=None):
        self.lock = filelock.FileLock(f'/tmp/{branch_name}.branch.lock')
        self.name = branch_name
        if repo_path:
            self.path = repo_path
            self.repo = Repo(self.path)
        else:
            self.path = self.get_checkout_dir()
            if self.path.exists():
                self.repo = Repo(self.path)
            else:
                self.repo = self.get_or_create_repo()
        self.repo.git.config('push.default', 'current')
        self.repo.git.config('pull.ff', 'true')

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
    def pull(self, remote_name='origin'):
        self.repo.remotes[remote_name].pull()

    @retry(exceptions=IOError, tries=5, delay=2, jitter=2)
    def push(self, remote_name='origin', **kwargs):
        if not GIT_SYNC_ENABLED:
            print('Not Pushing because disabled in config')
            return
        self.repo.remotes[remote_name].push(self.name, **kwargs)

    @retry(exceptions=IOError, tries=7, delay=0.5, backoff=2)
    def commit(self, message, author_name=None, author_email=None):
        if author_name:
            author = Actor(author_name, author_email)
        else:
            author = None
        self.repo.index.commit(message, author=author)

    def sync_remote(self, remote_name='origin'):
        if not GIT_SYNC_ENABLED:
            print('Not Pushing because disabled in config')
            return
        remote = self.repo.remotes[remote_name]
        try:
            remote.pull(X='theirs', kill_after_timeout=20)
            remote.push()
            return True
        except (GitCommandError, IOError) as e:
            logging.exception('Failed to pull/push')
            return False

class PyGitBranch(GitBranch):
    pygit2_repo = None
    def __init__(self, branch_name, repo_path=None):
        super().__init__(branch_name, repo_path)
        self.pygit2_repo = pygit2.Repository(self.path)

    def add(self, files):
        if isinstance(files, (str, Path)):
            self.pygit2_repo.index.add(files)
        else:
            self.pygit2_repo.index.add_all(files)

    def pull_NOT_WORKING(self, remote_name='origin'):
        print(f'Pulling {self.name}')
        
        branch = self.name
        
        repo = self.pygit2_repo
        
        
        remote = repo.remotes[remote_name]
        remote.fetch(refspecs=[branch])
        remote_master_id = repo.lookup_reference(f'refs/remotes/origin//{branch}').target
        merge_result, _ = repo.merge_analysis(remote_master_id)
        # Up to date, do nothing
        if merge_result & pygit2.GIT_MERGE_ANALYSIS_UP_TO_DATE:
            return
        # We can just fastforward
        elif merge_result & pygit2.GIT_MERGE_ANALYSIS_FASTFORWARD:
            repo.checkout_tree(repo.get(remote_master_id))
            try:
                master_ref = repo.lookup_reference(f'refs/heads/{branch}')
                master_ref.set_target(remote_master_id)
            except KeyError:
                repo.create_branch(branch, repo.get(remote_master_id))
            repo.head.set_target(remote_master_id)
        elif merge_result & pygit2.GIT_MERGE_ANALYSIS_NORMAL:
            repo.merge(remote_master_id)

            if repo.index.conflicts is not None:
                for conflict in repo.index.conflicts:
                    print 
                raise MergeConflict(f'Conflicts found in: {conflict[0].path}' )

            user = repo.default_signature
            tree = repo.index.write_tree()
            commit = repo.create_commit('HEAD',
                                        user,
                                        user,
                                        'Merge!',
                                        tree,
                                        [repo.head.target, remote_master_id])
            # We need to do this or git CLI will think we are still merging.
            repo.state_cleanup()
        else:
            raise MergeConflict('Unknown merge analysis result')
        remote.fetch([branch])

    @retry(exceptions=IOError, tries=5, delay=2, jitter=2)
    def push(self, remote_name='origin'):
        if not GIT_SYNC_ENABLED:
            print('Not Pushing because disabled in config')
            return
        repo = self.pygit2_repo
        ref = f'refs/heads/{self.name}:refs/heads/{self.name}'
        remote = repo.remotes[remote_name]
        remote.push([ref])

    def commit(self, message, author_name=None, author_email=None):
        repo = self.pygit2_repo
        
        if author_name:
            author = pygit2.Signature(author_name, author_email)
        else:
            author = repo.default_signature
        
        committer = repo.default_signature        
        
        index = repo.index
        index.write()
        tree = index.write_tree()
        ref = repo.head.name
        parents = [repo.head.target]
        
        repo.create_commit(ref, author, committer, message, tree, parents)