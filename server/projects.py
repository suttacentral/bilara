from config import WORKING_DIR

projects_file_name = '_project-v2.json'
projects_file = WORKING_DIR / projects_file_name

from util import json_load

def get_projects():
    result = {}
    for doc in json_load(projects_file):
        creator_github_handle = doc["creator_github_handle"]
        if isinstance(creator_github_handle, str):
            creator_github_handle = [creator_github_handle]
        result[doc["project_uid"]] = {
            "project_uid": doc["project_uid"],
            "name": doc["name"],
            "root_path": doc["root_path"],
            "translation_path": doc["translation_path"],
            "translation_muids": doc["translation_muids"],
            "creator_github_handle": creator_github_handle,
        }
    return result
