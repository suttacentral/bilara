import time
from typing import TypedDict

from arango_common import get_db


class ArangoDocument(TypedDict):
    _id: str
    _key: str
    _rev: str   
    

def add_task(task_id:str, task_type:str, task={}) -> ArangoDocument:
    '''
    Add a task.
    
    The task status will be set to 'pending'
    '''
    tasks = get_db().collection('tasks')
    return tasks.insert({
        'id': task_id,
        'type': task_type,
        'ctime': time.time(),
        'status': 'pending',
        'task': task
    })
    
def get_task(task_type:tuple[str, ...]) -> ArangoDocument:
    '''
    Get a pending task
    
    The returned task status will be changed to 'running'
    '''
    curr = get_db().aql.execute('''
        FOR task IN tasks
            FILTER task.status == 'pending'
            FILTER task.type IN @task_type
            SORT task.ctime
            LIMIT 1
            UPDATE task WITH {'status': 'running', 'mtime': DATE_NOW() / 1000 } IN tasks
            RETURN NEW                         
    ''', bind_vars={'task_type': task_type})
    if curr.empty():
        return None
    return curr.pop()
    
def all_tasks():
    '''
    Get all tasks
    '''
    
    curr = get_db().aql.execute('''
        FOR task IN tasks
            RETURN task                                
    ''')
    yield from curr

def update_task(doc: ArangoDocument) -> ArangoDocument:
    tasks = get_db().collection('tasks')
    return tasks.update(doc)

def update_task_status(doc: ArangoDocument, status:str='completed'):
    '''
    Update the task status
    
    Statuses can be:
    * pending
    * running
    * completed
    * failed
    '''
    doc = {**doc, 'status': 'completed'}
    return update_task(doc)