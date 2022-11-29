import signal
import time
import atexit
import socket
import threading
import segment_updates
import git_fs
import tasks
import logging

exit_event = threading.Event()

class AlreadyRunningException(BaseException):
    pass

class TaskRunner(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        # Attempt to bind to a socket, acting as a stale-proof lock
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            self.sock.bind((socket.gethostname(), 65400))
        except OSError:
            raise AlreadyRunningException('Task Runner already started')
    
    def run(self):
        last_30s_periodic = time.time()

        while not exit_event.is_set():
            try:
                time.sleep(0.2)
                self.update()
                if time.time() - last_30s_periodic > 30:
                    time.sleep(0.1)
                    self.periodic_30()
                    last_30s_periodic = time.time()
            except KeyboardInterrupt:
                exit_event.set()
            except Exception as e:
                logging.exception('An exception occured in Task Runner')
        else:
            print('Shutting down Task Runner')
    
    
    def update(self):
        task = tasks.get_task(('segment-update', 'githook'))
        if not task:
            return
        if task['type'] == 'segment-update':
            self.segment_update(task)
        elif task['type'] == 'githook':
            self.githook_update(task)
    
    def segment_update(self, task):
        print(f'Updating segment: {task["id"]}')
        try:
            result = segment_updates.update_segment(task['task']['segment'], task['task']['user'])
            if result.get('success') is True:
                tasks.update_task_status(task, 'completed')
            elif result['error']:
                tasks.update_task({**task, 'status': 'failed', 'error': result['error']})
        except Exception as e:
            logging.exception()
            tasks.update_task({**task, 'status': 'failed', 'error': e.msg})
    
    def githook_update(self, task):
        print('Githook')
        try:
            git_fs.githook(task['task'])
            tasks.update_task_status(task, 'completed')
        except Exception as e:
            logging.exception('Error processing githook')
            tasks.update_task({**task, 'status': 'failed', 'error': e.msg})
    
    def periodic_30(self):
        print('Pushing and pulling')
        git_fs.unpublished.sync_remote()
        time.sleep(0.2)

def close_task_runner(tr):
    exit_event.set()
    tr.join()

if __name__ == '__main__':
    tr = TaskRunner()
    atexit.register(close_task_runner, tr)
    tr.start()
    tr.join()