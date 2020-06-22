import logging
import git_fs
from config import config
from util import bilarasortkey
from fs import get_file_path, get_file, get_parent_uid
from util import json_load, json_save
from permissions import Permission, get_permissions

from search import search


def update_segment(segment, user):
    """
    segment looks like:
    {
      "segmentId": "dn1:1.1",
      "field": "translation-en-sujato",
      "value": "..", "oldValue": "..."
    }
    """

    segment_id = segment["segmentId"]

    uid, _ = segment_id.split(":")
    parent_uid = get_parent_uid(uid)

    long_id = f'{parent_uid}_{segment["field"]}'
    try:
        filepath = get_file_path(long_id)
    except KeyError as e:
        logging.exception(e)
        logging.error('f"{long_id}" not found, {segment}')
        return {"error": "file not found"}

    file = get_file(filepath)

    permission = get_permissions(filepath, user)
    if permission != Permission.EDIT:
        logging.error("User not allowed to edit")
        return {"error": "Inadequate Permission"}

    with git_fs._lock:
        try:
            file_data = json_load(file)
        except FileNotFoundError:
            file.parent.mkdir(parents=True, exist_ok=True)
            file_data = {}
        current_value = file_data.get(segment_id)
        result = {}
        if current_value and current_value != segment.get("oldValue"):
            result["clobbered"] = current_value

        if current_value != segment["value"]:
            result["changed"] = True

        file_data[segment_id] = segment["value"]

        sorted_data = dict(sorted(file_data.items(), key=bilarasortkey))

        try:
            json_save(sorted_data, file)
            result["success"] = True
        except Exception:
            logging.exception(f"could not write segment: {segment}")
            return {"error": "could not write file"}
        try:
            if config.GIT_COMMIT_ENABLED:
                git_fs.update_file(filepath, user)
        except Exception:
            logging.exception("Git Commit Failed")

        try:
            search.update_segment(segment)
        except Exception:
            logging.exception("Could not update TM for segment: {segment}")

        return result
