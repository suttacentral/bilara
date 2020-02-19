import os
import json
import pathlib
import logging
from logging.handlers import RotatingFileHandler


def create_logger(file, format):
    if isinstance(file, str):
        file = pathlib.Path(file)
    if not file.parent.exists():
        file.parent.mkdir()
    
    logger = logging.getLogger(file.name)
    logger.setLevel(logging.DEBUG)

    handler = RotatingFileHandler(file, maxBytes=10*1000*1000, backupCount=10)

    logger.addHandler(handler)

    formatter = logging.Formatter(format, style='{')
    handler.setFormatter(formatter)

    return logger

segments_logger = create_logger('log/segments.log', '{message}')


class ProblemLogger:
    def __init__(self, filename, reset_on_restart=True):
        self.reset_on_restart = reset_on_restart
        self.file = pathlib.Path('log/') / filename
        if reset_on_restart:
            self.clear()
            
        self.href_root = 'https://github.com/suttacentral/bilara-data/blob/master/'
    
    def clear(self):
        if self.file.exists():
            self.file.unlink()
        
    def add(self, entry=None, **kwargs):
        entries = self.load()
        if entry:
            entries.append(entry)
        elif kwargs:
            kwargs['href_root'] = self.href_root
            entries.append(kwargs)
        else:
            raise ValueError('No Problem : entry should be a string, or some kwargs defined')

        with self.file.open('w') as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
    
    def load(self):
        if self.file.exists():
            try:
                with self.file.open('r') as f:
                    return json.load(f)
            except json.decoder.JSONDecodeError:
                pass
        return []
        
problemsLog = ProblemLogger('problems.json')