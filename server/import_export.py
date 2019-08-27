import fs
from util import bilarasortkey
import io
import pyexcel

from flask import Blueprint
from flask import send_file, request

from tempfile import TemporaryDirectory



force_sort_order = {1: "root", 2: "translation"}


def sort_key(s):
    for val, string in force_sort_order.items():
        if string in s:
            return (val, s)
    return (float("inf"), s)



def iter_child_uids(uid, tree=None, yielding=False):
    tree = tree or fs._tree_index['root']
    for key in tree.keys():
        if key.startswith('_'):
            continue
        if '_' in key:
            if yielding:
                child_uid, _ = fs.get_uid_and_muids(key)
                yield child_uid
            
            continue
        
        yield from iter_child_uids(uid, tree=tree[key], yielding=yielding or key==uid)
        
        
        


def json_load(uid, suffix):
    try:
        file = fs.get_file(fs._file_index[f'{uid}_{suffix}']["path"])
    except KeyError:
        raise FileNotFoundError(f'{uid}_{suffix}.json')
    return fs.json_load(file)

def json_save(segment_data, uid, suffix):
    file = fs.get_file(fs._file_index[uid + '_' + suffix]["path"])
    fs.json_save(segment_data, file)

def get_data_for_uid(uid, suffixes=None):
    uids = list(iter_child_uids(uid))
    if not uids:
        uids = [uid]

    if not suffixes:
        suffixes = set()
        for uid in uids:
            for file in fs.get_matching_entries(uid, None):
                uid, muids = file.split('_')
                suffixes.add(muids)
    
    fields = sorted(suffixes, key=sort_key)
    yield ['segment'] + fields
    
    for i, uid in enumerate(uids):
        data = {}
        for suffix in suffixes:
            filestem = f'{uid}_{suffix}'
            if filestem in fs._file_index:
                data[suffix] = json_load(uid, suffix)
            else:
                data[suffix] = {}

        segment_ids = sorted(
            set.union(*(set(d.keys()) for d in data.values())), key=bilarasortkey
        )

        for segment_id in segment_ids:
            row = [segment_id]
            for field in fields:
                cell_value = data[field].get(segment_id, "")
                if isinstance(cell_value, list):
                    cell_value = str(cell_value)
                row.append(cell_value)
            yield row
        if len(uids) > i + 1:
            yield ["" for i in range(0, len(fields) + 1)]


def export_spreadsheet(uid, suffixes=None, format="ods"):

    data = list(get_data_for_uid(uid, suffixes))

    sheet = pyexcel.Sheet(data)

    stream = io.BytesIO()
    sheet.save_to_memory(file_type=format, stream=stream)

    return stream


def commit_data(uid, data):
    for suffix, segment_data in data.items():
        if not segment_data:
            continue
        try:
            file_data = json_load(uid, suffix)
        except FileNotFoundError:
            print(f'File not found for {uid}_{suffix}, ignoring')
            continue
        # we compare with the existing data, if something is non-existing in the existing data
        # and empty in the new data we don't add it to the file.

        for k, v in list(segment_data.items()):
            if not v and not file_data.get(k):
                segment_data.pop(k)
        
        json_save(segment_data, uid, suffix)
        

def load_sheet(filename):
    rows = pyexcel.iget_array(file_name=filename)

    current_data = {}
    current_uid = None
    fields = None
    for row in rows:
        if not row or not row[0]:
            continue
        if row[0] == 'segment':
            fields = row

            continue
        segment_id = row[0]
        if segment_id == '~':
            continue
        uid, _ = segment_id.split(':')

        if uid != current_uid:
            if current_uid:
                commit_data(current_uid, current_data)
            current_data = {field:{} for field in fields[1:]}
            current_uid = uid

        for i, field in enumerate(fields[1:], 1):
            try:
                current_data[field][segment_id] = row[i]
            except IndexError:
                continue
    
    commit_data(current_uid, current_data)



        
        


MIME_TYPES = {
    "csv": "text/csv",
    "ods": "application/vnd.oasis.opendocument.spreadsheet",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

import_export = Blueprint("import_export", "import_export")


@import_export.route("/import/", methods=["POST"])
def import_sheet():
    with TemporaryDirectory as tempdic:
        for file in request.files:
            filename = tempdic.name + '/' + file
            request.files[file].save(filename)

    return 'okay', 200


@import_export.route("/export/uid/<uid>", methods=["GET"])
def export_sheet(uid, format="ods"):
    suffixes = request.args.get("suffixes", None)
    if suffixes:
        suffixes = suffixes.split(",")

    result = export_spreadsheet(uid, suffixes, format)

    return send_file(
        result,
        mimetype=MIME_TYPES[format],
        as_attachment=True,
        attachment_filename=f"{uid}.{format}",
    )
