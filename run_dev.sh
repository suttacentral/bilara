#!/bin/bash
trap "exit" INT TERM
trap "kill 0" EXIT

docker start sc-elasticsearch

cd server
python app.py &

cd ../client

npm run serve

