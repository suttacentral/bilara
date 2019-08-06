#bin/env bash

(cd client; npm install)

(cd server; pip install -r requirements.txt)

(trap 'kill 0' SIGINT; ( cd server; flask run) & (cd client; npm run dev) )
