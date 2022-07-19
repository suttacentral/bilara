#!/usr/bin/env bash

PORT=8081
PROXY_PORT=9096

docker start sc-elasticsearch

(cd client; npm install)

(cd server; pip install -r requirements.txt)

(trap 'kill 0' SIGINT; ( cd server; poetry flask run --port $PROXY_PORT ) & (cd client; node server.js --port $PORT --proxy-port $PROXY_PORT) )
