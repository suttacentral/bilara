#!/bin/bash

set -e

. /venv/bin/activate

python -c "import arango_common; arango_common.run_migrations()"

exec gunicorn --bind 0.0.0.0:5000 --forwarded-allow-ips='*' wsgi:app
