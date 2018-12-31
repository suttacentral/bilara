#!/bin/bash

cd server
python app.py &

cd ../client

polymer serve

