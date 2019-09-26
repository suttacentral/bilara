import pickle
from hashlib import sha256
from base64 import urlsafe_b64encode, urlsafe_b64decode
from cryptography.fernet import Fernet

from config import config


def generate_key():
    secret = config['SECRET']
    if not isinstance(secret, bytes):
        secret = secret.encode()

    key = urlsafe_b64encode(sha256(secret).digest())
    return key

_f = Fernet(generate_key())

def encrypt(message):
    if not isinstance(message, bytes):
        message = b'__pickle__' + pickle.dumps(message, protocol=3)
    return urlsafe_b64encode(_f.encrypt(message))

def decrypt(secure_message):
    message = _f.decrypt(urlsafe_b64decode(secure_message))
    if message.startswith(b'__pickle__'):
        message = pickle.loads(message[10:])
    return message

