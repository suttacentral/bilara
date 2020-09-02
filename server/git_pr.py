from git import Repo, GitCommandError
from github import Github
from git_fs import Branch, CHECKOUTS_DIR, GIT_REMOTE_REPO, REPO_DIR, published
from config import config

BASE_PR_DIR = CHECKOUTS_DIR / 'pull_requests'

if not BASE_PR_DIR.exists():
    BASE_PR_DIR.mkdir()

gh = Github(config['GITHUB_ACCESS_TOKEN'])
gh_repo = gh.get_repo('/'.join(GIT_REMOTE_REPO.split('/')[-2:]))

class PRBranch(Branch):

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
            multi_options=[f'--reference={REPO_DIR}', '--single-branch', f'--branch={published.name}']
        )
        repo.git.checkout('HEAD', b=self.name)
        return repo
    
    def __init__(self, name):
        base_name = name
        name = self.make_path_name(name)
        super().__init__(branch_name=name)

    def create_pr(self):
        self.repo.git.push('--set-upstream', 'origin', self.name)
        gh_repo.create_pull(title="New Translations for {self.base_name}", body="", head=self.name, base=published.name)
