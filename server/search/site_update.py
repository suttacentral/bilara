import json
import logging
import pathlib
from util import json_load, json_save, bilarasortkey
from arango_common import get_db
from config import WORKING_DIR, CHECKOUTS_DIR
from projects import get_projects


import git_fs
from tempfile import TemporaryDirectory
import subprocess

def clone_repo(branch_or_tag='master', reference=None):

    temp_dir = TemporaryDirectory()

    cmd = ['git', 'clone', '-b', branch_or_tag, '--depth', '1', 'https://github.com/suttacentral/suttacentral.git']

    if reference:
        cmd.extend(['--reference', reference])

    cp = subprocess.run(cmd, cwd=temp_dir.name, capture_output=True, encoding='utf8')
    if cp.returncode != 0:
        logging.error(cp.stderr)
    return temp_dir 



def add_old_sc_locale_to_history(repo_dir):
    """
    
    Historically SuttaCentral contained both roots and translations for the site localization

    """

    db = get_db()

    source_dir = pathlib.Path(repo_dir) / 'suttacentral/client/localization/elements/'

    docs = {}

    for folder in source_dir.glob('*'):
        if not folder.is_dir():
            continue
        for file in folder.glob('*.json'):
            lang = file.stem
            data = json_load(file)
            entries = data[lang]

            for k, v in entries.items():
                context = f'{folder.name}_{k}'

                if context in docs:
                    doc = docs[context]
                else:
                    doc = {
                        '_key': f'sc_old_{context}',
                        'context': context,
                        'origin': 'sc_old',
                        'strings': {}
                    }
                    docs[context] = doc
                doc['strings'][lang] = v

    errors = db['historic'].import_bulk(docs.values(), on_duplicate='replace', halt_on_error=False)
    return errors


def add_sc_locale_to_history(repo_dir):

    db = get_db()

    source_dir = pathlib.Path(repo_dir) / 'suttacentral/client/localization/elements/'

    docs = {}
    files = list(source_dir.glob('*.json'))
    lang = 'en'
    for file in files:
        entries = json_load(file)

        for k, v in entries.items():
            context = f'{file.name.split("_")[0]}_{k}'

            if context in docs:
                doc = docs[context]
            else:
                doc = {
                    '_key': f'sc_latest_{context}',
                    'context': context,
                    'origin': 'sc_latest',
                    'strings': {}
                }
                docs[context] = doc
            doc['strings'][lang] = v

    errors = db['historic'].import_bulk(docs.values(), on_duplicate='replace', halt_on_error=False)
    
    return files, errors

def add_site_to_history():
    db = get_db()
    site_dirs = [WORKING_DIR / 'root/en/site'] + list(WORKING_DIR.glob('**/translation/*/site'))

    docs = {}

    for folder in site_dirs:
        lang = folder.parts[-2]
        for file in folder.glob('**/*.json'):
            file_uid = file.stem.split('_')[0]
            
            with file.open() as f:
                entries = json.load(f)
            
            for k,v in entries.items():
                context = f'{file_uid}_{k}'

                if context in docs:
                    doc = docs[context]
                else:
                    doc = {
                        '_key': f'bilara_{context}',
                        'context': context,
                        'origin': 'bilara',
                        'strings': {}
                    }
                    docs[context] = doc
                doc['strings'][lang] = v
            
    errors = db['historic'].import_bulk(docs.values(), on_duplicate='replace', halt_on_error=False)
    return errors, docs

EXACT_QUERY = """
FOR doc IN historic_ngram_view
    SEARCH doc.strings.en == @string
    AND doc.origin == @origin
    SORT NGRAM_POSITIONAL_SIMILARITY(@context, doc.context, 4) DESC
    LIMIT 1
    RETURN doc.strings
"""

STALL_QUERY = """
FOR doc IN historic_ngram_view
    SEARCH doc.strings.en == 'foo' OPTIONS { waitForSync: true }
    RETURN doc
"""

def restore_site_from_history(root_files):
  try:
    langs_seen = set()
    db = get_db()
    translation_mapping = {}
    for project_id, entry in get_projects().items():
        root_path = entry['root_path']
        if root_path != 'root/en/site':
            continue
        translation_path = entry['translation_path']
        translation_muids = entry['translation_muids']
        lang = translation_muids.split('-')[1]
        langs_seen.add(lang)
        parent_dir = pathlib.Path(translation_path)
        
        for file in sorted(root_files.keys(), key=lambda f: bilarasortkey(str(f))):
            
            uid, _ = file.stem.split('_') 
            translation_stem = f'{uid}_{translation_muids}'
            translation_file = parent_dir / (translation_stem + '.json')
            if file not in translation_mapping:
                translation_mapping[file] = {}
            translation_mapping[file][lang] = translation_file
    
    rv = {}
    for root_file, translation_files in translation_mapping.items():
        root_data = root_files[root_file]
        translation_data = {}
        for segment_id, string in root_data.items():
            if not string:
                print(f'Empty string: {segment_id}')
                continue
            cursor = db.aql.execute(EXACT_QUERY, bind_vars={'string': string, 'context': segment_id, 'origin': 'bilara'}, batch_size=1)
            if not cursor.batch():
                cursor = db.aql.execute(EXACT_QUERY, bind_vars={'string': string, 'context': segment_id, 'origin': 'sc_old'}, batch_size=1)
                if not cursor.batch():
                    continue
                else:
                    print(f'Found value for "{segment_id}:{string}" in fallback')
            for lang, string in cursor.pop().items():
                if lang not in translation_data:
                    translation_data[lang] = {}
                translation_data[lang][segment_id] = string
        for lang, translation_file in translation_files.items():
            if lang in translation_data:
                rv[translation_file] = translation_data[lang]
    return rv

  except Exception as e:
    logging.exception(e)
    globals().update(locals())
    raise
    

def rewrite_site_projects(files_and_data):
    parents_seen = set()
    files_seen = set()

    for file in files_and_data.keys():
        parent_dir = pathlib.Path(*file.parts[:3])
        if parent_dir not in parents_seen:
            for file in (WORKING_DIR / parent_dir).glob('*.json'):
                files_seen.add(file.relative_to(WORKING_DIR))
            parents_seen.add(parent_dir)
    
    for file, data in files_and_data.items():
        json_save(data, WORKING_DIR / file)
    
    files_to_delete = files_seen.difference(files_and_data)
    print(f'{len(files_to_delete)} files to be deleted')
    print('Committing updated projects')
    git_fs.update_localization(list(files_and_data), list(files_to_delete))
    print('Creating PR')
    git_fs.publish_localization(list(files_and_data), list(files_to_delete))

def update_site(reference=None):
    db = get_db()
    db.collection('historic').truncate()
    temp_dir_old = clone_repo(branch_or_tag='prelocale', reference=reference)
    add_old_sc_locale_to_history(temp_dir_old.name)

    temp_dir_latest = clone_repo('master', reference=reference)
    files, _ = add_sc_locale_to_history(temp_dir_latest.name)

    add_site_to_history()

    # A mapping of pathlib.Path to the data contained within the file
    root_files_and_data = {}
    for file in files:
        stem = file.stem.split('_')[0]
        new_name = f'{stem}_root-en-site.json'
        new_file = pathlib.Path('root/en/site') / new_name
        data = json_load(file)
        root_files_and_data[new_file] = data


    temp_dir_old.cleanup()
    temp_dir_latest.cleanup()

    print("Waiting for ArangoDB to complete view update")
    db.aql.execute(STALL_QUERY)

    print('Restoring site projects from history')
    files_and_data = restore_site_from_history(root_files_and_data)
    files_and_data.update(root_files_and_data)
    rewrite_site_projects(files_and_data)







