import logging
import pathlib
from collections import defaultdict
from git import Repo, GitCommandError
from config import (GIT_REMOTE_REPO, REPO_DIR, CHECKOUTS_DIR,
                    PUBLISHED_BRANCH_NAME, UNPUBLISHED_BRANCH_NAME, GIT_SYNC_ENABLED)


import threading
import time

import notify

import atexit

from git_branch import GitBranch, base_repo
import git_pr

PUSH_DELAY = 15

published = GitBranch(PUBLISHED_BRANCH_NAME)
unpublished = GitBranch(UNPUBLISHED_BRANCH_NAME)

git = unpublished.repo.git

def create_empty_commit(user, branch_name):
    git.commit(allow_empty=True, m=f'Translations by {user["login"]}', author=f'{user["name"]} <{user["email"]}>')
    _pending_commits[branch_name] = time.time()

_pending_commit = None

def update_file(file, user):
    global _pending_commit
    file = str(file).lstrip('/')
    with unpublished.lock:
        commit_message = f'Translations by {user["login"]} to {file}'
        unpublished.add(file)
        unpublished.commit(message=commit_message, author_name=f'{user["name"] or user["login"]}', author_email=user["email"])
    
    unpublished.finalize_commit()
        

def update_files(user, files):
    with unpublished.lock:
        unpublished.add(files)
        unpublished.commit(message=f"Bulk update", author_name=f'{user["name"] or user["login"]}', author_email=user["email"])
    unpublished.finalize_commit()

def update_localization(files, files_deleted):
    with unpublished.lock:
        unpublished.add(files)
        if files_deleted:
            unpublished.remove(files_deleted)
        unpublished.commit(m=f"Update Localization")
    
    unpublished.finalize_commit()

def publish_localization(files, files_deleted):
    try:
        branch = git_pr.PRBranch(relative_path='locale', user={'login': 'sc-translatatron'})
        branch.copy_these_files([unpublished.path/file for file in files])
        if files_deleted:
            branch.delete_these_files([unpublished.path/file for file in files_deleted])

        try:
            branch.commit()
        except GitCommandError:
            logging.exception("Git Commit failed (possibly harmless)")
            # We continue since something funny might have happened
            # like a previous commit working but the push not
            # so we want a repeated attempt to actually do the push
        branch.push(force=True)
        result = branch.create_pr(title='Update Localization', msg='This commit was generated by bilara')
        return result
    except Exception as e:
        logging.exception("Pull Request Creation Failed")
        return {'error': str(e) }

def githook(webhook_payload):
    ref = webhook_payload['ref'].split('/')[-1]
    if ref != unpublished.name:
        if ref == published.name:
            published.pull()
        return

    added = []
    modified = []
    removed = []

    for commit in webhook_payload['commits']:
        if commit['id'] == unpublished.branch.commit.hexsha:
            return
        added.extend(commit['added'])
        modified.extend(commit['modified'])
        removed.extend(commit['removed'])

    print(f'{len(added)} added, {len(modified)} modified, {len(removed)} removed')
    with unpublished.lock:
        unpublished.pull('-Xtheirs')

    if added or removed  or '_project.json' in modified or '_publication.json' in modified:
        import app
        app.init()

    from search import search
    search.update_partial(added, modified)


def get_publication_line_counts():
    file_stats = base_repo.git.diff('unpublished..published', '--numstat')

    result = defaultdict(int)

    for line in file_stats.split('\n'):
        if line:
            added, deleted, filepath = line.split()
            result[filepath] = int(added)+int(deleted)
            parts = pathlib.Path(filepath).parts

            for i in range(0, len(parts)):
                result['/'.join(parts[0:i])] += 1

    return dict(result)

def get_publication_state():
    if not GIT_SYNC_ENABLED:
        published.pull()
        unpublished.pull()
    published_files = published.get_file_map()
    unpublished_files = unpublished.get_file_map()
    
    not_published = {f for f in unpublished_files if f not in published_files}
    fully_published = {f for f,sha in unpublished_files.items() if published_files.get(f) == sha}
    modified = set(unpublished_files) - not_published - fully_published
    
    pr_in_progress = {entry.get('path'): entry['url'] for entry in git_pr.pr_log.load().values()}

    print(pr_in_progress)
    from permissions import make_may_publish_regex
    may_publish_regex = make_may_publish_regex()
    
    result = defaultdict(lambda: {'PUBLISHED':0, 'UNPUBLISHED': 0, 'MODIFIED': 0})
    
    for filepath, sha in unpublished_files.items():
        pathkey = filepath[:-5] if filepath.endswith('.json') else filepath
        if not filepath.startswith('translation/'):
            continue
        elif not may_publish_regex.match(filepath):
            continue
        elif pathkey in pr_in_progress:
                state = {'state': 'PULL_REQUEST', 'url': pr_in_progress[pathkey]}
        elif filepath in not_published:
            state = 'UNPUBLISHED'
        elif filepath in fully_published:
            state = 'PUBLISHED'
        elif filepath in modified:
            state = 'MODIFIED'
        else:
            logging.error(f'Filepath {filepath} has unexpected indeterminate publication status')
        result[filepath] = state
        if 'state' in state:
            state = 'MODIFIED'

        parts = pathlib.Path(filepath).parts
        for i in range(0, len(parts)):
            parent_path = '/'.join(parts[0:i])
            if parent_path in pr_in_progress:
                result[parent_path] = {'state': 'PULL_REQUEST', 'url': pr_in_progress[parent_path]}
            else:
                result[parent_path][state] += 1

    return dict(result)

def create_publish_request(path, user):
    try:
        branch = git_pr.PRBranch(path, user)
        branch.copy_files()
        try:
            branch.commit()
        except GitCommandError:
            logging.exception("Git Commit failed (possibly harmless)")
            # We continue since something funny might have happened
            # like a previous commit working but the push not
            # so we want a repeated attempt to actually do the push
        branch.push(force=True)
        result = branch.create_pr()
        return result
    except Exception as e:
        logging.exception("Pull Request Creation Failed")
        return {'error': str(e) }