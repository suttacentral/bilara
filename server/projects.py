from permissions import projects_file
from util import json_load

def get_projects():
    return json_load(projects_file)