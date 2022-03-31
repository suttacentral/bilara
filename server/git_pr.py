import logging
import shutil
import json
from multiprocessing import RLock
from git import Repo, GitCommandError
from github import Github
from git_branch import GitBranch
import git_fs
from config import (GITHUB_ACCESS_TOKEN, CHECKOUTS_DIR, GITHUB_REPO, GIT_REMOTE_REPO, REPO_DIR,
                    GIT_SYNC_ENABLED)

BASE_PR_DIR = CHECKOUTS_DIR / 'pull_requests'

if not BASE_PR_DIR.exists():
    BASE_PR_DIR.mkdir(parents=True)

if GITHUB_REPO:
    gh = Github(GITHUB_ACCESS_TOKEN)
    gh_repo = gh.get_repo(GITHUB_REPO)

def get_checkout_paths():
    return {str(folder): PRBranch.get_original_path(folder) for folder in BASE_PR_DIR.glob('*')}

class PRLog:
    def __init__(self):
        self.path = BASE_PR_DIR / '_pr_log.json'
        self.lock = RLock()

    def set(self, k, v):
        with self.lock:
            data = self.load()
            if v is None and k in data:
                del data[k]
            else:
                data[k] = v

            with self.path.open('w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

    def unset(self, k):
        self.set(k, None)

    def load(self):
        with self.lock:
            try:
                with self.path.open('r') as f:
                    return json.load(f)
            except FileNotFoundError:
                return {}

pr_log = PRLog()

class PRBranch(GitBranch):

    def get_checkout_dir(self):
        return BASE_PR_DIR / self.name

    @staticmethod
    def make_path_name(name):
        if '__' in name:
            raise ValueError(f'__ not allowed in name: {name}')

        return name.replace('_', '__').replace('/', '_')

    @staticmethod
    def get_original_path(path):
        return path.relative_to(BASE_PR_DIR).replace('_', '/').replace('//', '_')

    def get_or_create_repo(self):
        repo = Repo.clone_from(
            GIT_REMOTE_REPO,
            self.path,
            multi_options=[f'--reference={REPO_DIR}', '--single-branch', f'--branch={git_fs.published.name}']
        )
        repo.git.checkout('HEAD', b=self.name)
        return repo

    def __init__(self, relative_path, user):
        self.relative_path = relative_path
        self.user = user
        name = self.make_path_name(relative_path)
        super().__init__(branch_name=name)

    def copy_files(self):
        file_path = git_fs.unpublished.path / (str(self.relative_path) +'.json')
        if file_path.exists():
            print(f'Using {file_path}')
            files = [file_path]
        else:
            files = sorted((git_fs.unpublished.path / self.relative_path).glob('**/*.json'))
            print(f'Using {files}')
        if not files:
            logging.error(f'No files copied for {self.relative_path}')
        else:
            self.copy_these_files(files)

    def copy_these_files(self, files):
        for file in files:
            if file.name.startswith('_'):
                continue
            if file.stat().st_size < 5:
                continue
            new_file = self.path / file.relative_to(git_fs.unpublished.path)
            new_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(file, new_file)
            self.repo.git.add(str(new_file))

    def delete_these_files(self, files):
        for file in files:
            pub_file = self.path / file.relative_to(git_fs.unpublished.path)
            if pub_file.exists():
                self.repo.git.rm(pub_file)

    def create_pr(self, msg=None, title=None):
        if not GIT_SYNC_ENABLED:
            msg = 'Not creating PR because GIT_SYNC_ENABLED is False'
            print(msg)
            return {'error': msg}
        user = self.user
        existing = pr_log.load()
        if self.name in existing:
            pr = gh_repo.get_pull(existing[self.name]['number'])
            pr.update_branch()
        else:
            if msg is None:
                msg = f'''
Request made by {user['login'] if user else '???'}

Please do not modify this branch directly. Changes should be
made via the Bilara Translation App and the Pull Request
updated from Bilara.
'''
            if title is None:
                title = f"New translations for {str(self.relative_path)}"
            pr = gh_repo.create_pull(
                title=title,
                body=msg,
                head=self.name,
                base=git_fs.published.name)
            pr_log.set(self.name, {'number': pr.number, 'url': pr.html_url, 'path': str(self.relative_path)})
        return {'url': pr.html_url}

    def commit(self):
        return super().commit(f"Publishing translations for {str(self.relative_path)}")

    def update(self):
        self.pull()
        self.copy_files()
        try:
            self.commit()
        except Exception as e:
            print('Git Commit Failed')
            print(e)
            return {'error': 'Nothing to update'}
        self.push()
        return self.create_pr()

def perform_housekeeping():
    remote_branches = {b.name for b in gh_repo.get_branches()}
    for folder in BASE_PR_DIR.glob('*'):
        if not folder.is_dir():
            continue
        if folder.name not in remote_branches:
            shutil.rmtree(folder)

    for pr_name, pr_value in  pr_log.load().items():
        pr_num = pr_value['number']
        pr = gh_repo.get_pull(pr_num)
        if pr.state == 'closed':
            pr_dir = BASE_PR_DIR / pr_name
            if pr_dir.exists():
                shutil.rmtree(pr_dir)
            pr_log.unset(pr_name)

if GITHUB_REPO:
    if pr_log.load():
        perform_housekeeping()
