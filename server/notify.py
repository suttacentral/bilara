import pushover
from config import config

def get_client_for_admin():
    if not config.get('PUSHOVER_TOKEN'):
        return None
    
    client = pushover.Client(config['PUSHOVER_ADMIN_KEY'], api_token=config['PUSHOVER_TOKEN'])
    return client

def _fallback_notify(message):
    print(f'PUSHOVER NOT ENABLED: {message}')

def send_message_to_admin(message, title=None):
    client = get_client_for_admin()
    if not client:
        _fallback_notify(message)
      
    client.send_message(message, title=title)
