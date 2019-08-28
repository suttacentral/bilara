import os
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