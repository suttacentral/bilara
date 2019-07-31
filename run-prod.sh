#bin/env bash

PORT=8081
PROXY_PORT=9096

(trap 'kill 0' SIGINT; ( cd server; flask run --port $PROXY_PORT ) & (cd client; node server.js --port $PORT --proxy-port $PROXY_PORT) )
