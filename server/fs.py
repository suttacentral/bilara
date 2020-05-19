import sys
import json
import pickle
import pathlib
import logging
from config import config
from util import humansortkey, bilarasortkey
from copy import copy, deepcopy
from threading import Event

from log import problemsLog

from permissions import get_permissions, Permission

from util import json_load

REPO_DIR = config.REPO_DIR

saved_state_file = pathlib.Path("./.saved_state.pickle")


class NoMatchingEntry(Exception):
    pass


def get_file_path(long_id):
    return _file_index[long_id]["path"]


def get_file(filepath):
    if filepath.startswith("/"):
        filepath = filepath[1:]
    return REPO_DIR / filepath


def strip_suffix(file):
    if file.isdir():
        return file.name
    else:
        return file.stem


def invert_meta(metadata):
    new_meta = {}
    for key, obj in deepcopy(metadata).items():
        type = obj.pop("type")
        obj["uid"] = key
        new_meta[type] = obj
    return new_meta


def get_uid_and_muids(file):
    if isinstance(file, str):
        file = pathlib.Path(file)

    if file.suffix in {".json", ".html"}:
        uid, muid_string = file.stem.split("_")
    else:
        uid, muid_string = file.name.split("_")
    return uid, muid_string.split("-")


def get_long_id(path):
    return pathlib.Path(path).name


def save_state():
    print("Saving file index")
    stored = (
        "_tree_index",
        "_uid_index",
        "_muid_index",
        "_file_index",
        "_meta_definitions",
        "_special_uid_mapping",
    )
    with saved_state_file.open("wb") as f:
        pickle.dump({k: globals()[k] for k in stored}, f)


def load_state():
    if not saved_state_file.exists():
        return
    try:
        with saved_state_file.open("rb") as f:
            globals().update(pickle.load(f))
        print("Loaded saved file index")
        _build_complete.set()
    except Exception:
        saved_state_file.unlink()


_build_started = Event()
_build_complete = Event()


def make_file_index(force=False):
    _build_started.set()
    global _tree_index
    global _uid_index
    global _muid_index
    global _file_index
    global _meta_definitions
    global _special_uid_mapping

    if not force:
        load_state()

    print("Building file index")

    _muid_index = muid_index = {}
    _uid_index = uid_index = {}
    _file_index = file_index = {}

    def recurse(folder, meta_definitions=None):
        subtree = {}
        meta_definitions = meta_definitions.copy()

        metafiles = set(folder.glob("_*.json"))
        if metafiles:
            for metafile in sorted(metafiles, key=humansortkey):
                file_data = json_load(metafile)
                meta_definitions.update(file_data)

                for k, v in file_data.items():
                    if k not in _meta_definitions:
                        _meta_definitions[k] = v

        for file in sorted(folder.glob("*"), key=humansortkey):

            if file.name.startswith("."):
                continue
            if file in metafiles:
                continue
            long_id = file.stem
            meta = {}
            for part in file.parts:
                if part.endswith(".json"):
                    part = part[:-5]
                if part in meta_definitions:
                    meta[part] = meta_definitions[part]
            if file.is_dir():
                subtree[file.name] = recurse(file, meta_definitions=meta_definitions)
                subtree[file.name]["_meta"] = meta
            elif file.suffix == ".json":

                mtime = file.stat().st_mtime_ns
                path = str(file.relative_to(REPO_DIR))
                obj = subtree[long_id] = {"path": path, "mtime": mtime, "_meta": meta}
                if "_" in long_id:
                    uid, muids = get_uid_and_muids(file)
                else:
                    uid = file.name if file.is_dir() else file.stem
                    muids = None
                obj["uid"] = uid
                if uid not in uid_index:
                    uid_index[uid] = set()
                uid_index[uid].add(long_id)
                if long_id in file_index:
                    logging.error(f"{str(file)} not unique")
                file_index[long_id] = obj
                if muids:
                    for muid in muids:
                        if muid not in muid_index:
                            muid_index[muid] = set()
                        muid_index[muid].add(long_id)

        return subtree

    _meta_definitions = {}
    _tree_index = recurse(REPO_DIR, {})
    _uid_index = uid_index
    _muid_index = muid_index
    _file_index = file_index
    _special_uid_mapping = make_special_uid_mapping()

    for v in file_index.values():
        v["_meta"] = invert_meta(v["_meta"])
    print("File Index Built")
    save_state()
    _build_complete.set()
    stats_calculator.reset()


_tree_index = None
_uid_index = None


def make_special_uid_mapping():
    uid_mapping = {}
    for file in REPO_DIR.glob("root/**/*.json"):
        if "blurbs" in str(file):
            continue
        with file.open() as f:
            data = json.load(f)
        for k in data:
            uid = k.split(":")[0]
            if uid not in _uid_index and uid not in uid_mapping:
                uid_mapping[uid] = file.name.split("_")[0]
    return uid_mapping


class StatsCalculator:
    def __init__(self):
        self.reset()

    def reset(self):
        self._completion = {}

    def invalidate(self, path):
        if path in self._completion:
            del self._completion[path]

    def get_completion(self, translation):

        path = translation["path"]

        if path not in self._completion:
            self._completion[path] = self.calculate_completion(translation)

        return copy(self._completion[path])

    def calculate_completion(self, translation):
        translated_count = self.count_strings(translation)
        uid, _ = get_uid_and_muids(translation["path"])
        root_lang = get_child_property_value(translation, "root_lang")
        root_edition = get_child_property_value(translation, "root_edition")
        missing = []
        if not root_lang or not root_edition:
            missing.append("root lang")
        if not root_edition:
            missing.append("root edition")
        if missing:
            msg = f'{", ".join(missing)} not found, please check author and project'
            print(str(translation["path"]), msg, file=sys.stderr)
            problemsLog.add(file=str(translation["path"]), msg=msg)
            total_count = translated_count
        else:
            root_entry = get_matching_entry(uid, ["root", root_lang, root_edition])
            root_count = self.count_strings(root_entry)
            total_count = max(root_count, translated_count)
        return {"_translated": translated_count, "_root": total_count}

    def count_strings(self, entry):
        json_file = get_file(entry["path"])
        data = json_load(json_file)
        count = 0
        for k, v in data.items():
            if k == "_meta":
                continue
            if v:
                count += 1
        return count


stats_calculator = StatsCalculator()


def get_matching_ids(uid, muids=None):
    try:
        result = _uid_index[uid].copy()
        if muids:
            for muid in muids:
                result.intersection_update(_muid_index[muid])
        return result
    except KeyError as e:
        raise NoMatchingEntry(f'No match for "{e.args[0]} for query {uid}, {muids}')


def get_matching_id(uid, muids=None):
    result = get_matching_ids(uid, muids)
    if len(result) == 1:
        (result,) = result
        return result
    elif len(result) == 0:
        raise NoMatchingEntry(f"No matches for {uid}, {muids}")
    else:
        raise ValueError(f"Multiple matches for {uid}, {muids}")


def load_json(entry):
    _meta = entry.get("_meta", {})
    _meta["path"] = entry.get("path")

    json_file = get_file(entry["path"])
    return {**deepcopy(_meta), "segments": json_load(json_file)}


def load_entry(long_id):
    entry = _file_index[long_id]
    result = load_json(entry)
    return result


def get_child_property_value(obj, name):
    if "_meta" in obj:
        obj = obj["_meta"]
    for child_obj in obj.values():
        if name in child_obj:
            return child_obj[name]


def get_match(matches):
    if len(matches) == 0:
        raise NoMatchingEntry("No matches")
    elif len(matches) > 1:
        raise ValueError("More than one match")
    (match,) = matches
    return match


def get_matching_entry(uid, muids):
    long_id = get_matching_id(uid, muids)
    return _file_index[long_id]


def update_result(result, long_id, entry, role=None, user=None):
    segments = entry.pop("segments")
    uid, muids = get_uid_and_muids(long_id)
    field = "-".join(muids)

    entry = deepcopy(entry)
    entry["permission"] = get_permissions(entry["path"], github_id=user).name
    entry["editable"] = True if role == "target" else False
    result["fields"][field] = entry
    result["fields"][field]["role"] = role or muids[0]
    for segment_id, segment_value in segments.items():
        if segment_id not in result["segments"]:
            result["segments"][segment_id] = {}
        result["segments"][segment_id][field] = segment_value

    return result


def get_data(primary_long_id, user=None, root=None, tertiary=None):
    """

    Returns a result that looks like this:

    {
      "uid": "",
      "filedata": {
        "mn1_root-pli-ms": {
           "category": "root",
           "language": "pli",
           "edition": "ms",
           "path": "translation/en/sujato/mn/mn1_translation-en-sujato.json",
           "segments": { ... }
        },
        "mn1_translation-en-sujato": { ... },
      },
      "fields": {
        "root": "mn1_root-pli-ms",
        "translation": "mn1_translation-en-sujato"
      }
    }

    or

    {
      "uid": "",
      "filedata": {
        "mn1_root-pli-ms": { ... },
        "mn1_translation-en-sujato": { ... },
        "mn1_translation-de-whoever": { ... }
      },
      "fields": {
        "root": "mn1_root-pli-ms",
        "translation": "mn1_translation-de-whoever",
        "extra_translations": ["mn1_translation-en-sujato"]
      }
    }

    {
      "segments": {
        "dn1:1.1": {
          "root-pli-ms": "...",
          "translation-en-sujato": "...",
          "comment-en-sujato": "..."
        },
        "dn1:1.2": { ... }
      },
      "fields": {
        "root-pli-ms": "source",
        "translation-en-sujato": "target",
        "comment-en-sujato": "comment"
      }
    }

    What is the fields field?

    "fields": {
      "root-pli-ms": "source",
      "translation-de-whoever": "target",
      "translation-en-sujato": "secondary-source",
    }



    """

    if not root:
        root = "root"

    result = {"segments": {}, "fields": {}}
    primary_entry = load_entry(primary_long_id)

    update_result(result, primary_long_id, primary_entry, role="target", user=user)
    result["targetField"] = primary_long_id.split("_")[1]

    uid, _ = get_uid_and_muids(primary_long_id)
    root_lang = get_child_property_value(primary_entry, "root_lang")
    root_edition = get_child_property_value(primary_entry, "root_edition")
    for muid in root.split(","):
        try:
            root_long_id = get_matching_id(uid, [muid, root_lang, root_edition])
            root_entry = load_entry(root_long_id)
            role = "source" if muid == "root" else muid
            update_result(result, root_long_id, root_entry, role=role, user=user)
            if role == "source":
                result["sourceField"] = root_long_id.split("_")[1]
        except NoMatchingEntry:
            pass

    if tertiary:
        for muids_string in tertiary.split(","):
            if muids_string in {result["targetField"], result["sourceField"]}:
                continue
            muids = muids_string.split("-")
            matches = get_matching_ids(uid, muids)
            if matches:
                for long_id in matches:
                    entry = load_entry(long_id)
                    update_result(result, long_id, entry, role="tertiary", user=user)

    try:
        sorted_results = sorted(
            result["segments"].items(), key=lambda t: bilarasortkey(t[0])
        )
    except TypeError:
        print("Sort failure ", file=sys.stderr)
        for k in result["segments"].keys():
            for k2 in result["segments"].keys():
                try:
                    sorted([k, k2], key=lambda t: bilarasortkey(t))
                except TypeError:

                    print(f"{k} > {k2}", file=sys.stderr)

        raise
    result["segments"] = dict(sorted_results)

    result["potential"] = [name.split("_")[1] for name in _uid_index[uid]]

    return result


def sum_counts(subtree):
    counts = {"_translated_count": 0, "_root_count": 0}

    for key, child in subtree.items():
        if key.startswith("_"):
            continue
        if "_root" in child:
            counts["_root_count"] += child["_root"]
            counts["_translated_count"] += child.get("_translated", 0)
        else:
            child_counts = sum_counts(child)
            for prop in ["_translated_count", "_root_count"]:
                counts[prop] += child_counts[prop]
    subtree.update(counts)
    return counts


def get_condensed_tree(path, user):
    print(f"Using user {user}")
    if not _build_started.is_set():
        make_file_index()
    _build_complete.wait()
    tree = _tree_index
    for part in path:
        tree = tree[part]

    def recurse(subtree):
        result = {}
        highest_permission = Permission.NONE
        for key, value in subtree.items():
            if value.get("path", "").endswith(".json"):
                result[key] = stats_calculator.get_completion(value)
                result[key]["_type"] = "document"
                permission = get_permissions(value.get("path"), user["login"])
                if not highest_permission:
                    highest_permission = permission
                else:
                    highest_permission = max(highest_permission, permission)
                result[key]["_permission"] = permission.name

            elif key.startswith("_meta"):
                continue
            else:
                permission, result[key] = recurse(value)
                result[key]["_type"] = "node"
                result[key]["_permission"] = permission.name
                highest_permission = max(permission, highest_permission)

        return highest_permission, result

    _, tree = recurse(tree)
    sum_counts(tree)
    return tree


def get_parent_uid(uid):
    if uid in _uid_index:
        return uid

    return _special_uid_mapping[uid]
