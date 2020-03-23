from gevent import monkey
monkey.patch_all()
from app import app

if __name__ == "__main__":
    app.run()
