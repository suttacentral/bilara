import shutil
from git import Repo, GitCommandError
from github import Github
from git_branch import GitBranch
import git_fs
from config import GITHUB_ACCESS_TOKEN, CHECKOUTS_DIR, GIT_REMOTE_REPO, REPO_DIR

BASE_PR_DIR = CHECKOUTS_DIR / 'pull_requests'

if not BASE_PR_DIR.exists():
    BASE_PR_DIR.mkdir()

gh = Github(GITHUB_ACCESS_TOKEN)
gh_repo = gh.get_repo('/'.join(GIT_REMOTE_REPO.split('/')[-2:]))

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
        for file in sorted((git_fs.unpublished.path / self.relative_path).glob('**/*.json')):
            if file.name.startswith('_'):
                continue
            new_file = self.path / file.relative_to(git_fs.unpublished.path)
            new_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(file, new_file)
            self.repo.git.add(str(new_file))

    def create_pr(self):
        user = self.user
        r = gh_repo.create_pull(
            title=f"New translations for {str(self.relative_path)}",
            body="Request made by {user['login'] if user else '???'}",
            head=self.name,
            base=git_fs.published.name)
        return {'url': r.html_url}

    def commit(self):
        return super().commit(f"Publishing translations for {str(self.relative_path)}")

    def update(self):
        self.copy_files()
        self.commit()
        self.push()
        return self.create_pr()
    
