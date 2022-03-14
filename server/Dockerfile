FROM python:3.9-slim-buster AS builder
WORKDIR /opt/bilara/server

RUN apt-get update \
  && apt-get install -y libxml2-dev libxslt-dev python-dev \
  && pip install poetry==1.1.12 \
  && poetry config virtualenvs.in-project true

COPY pyproject.toml poetry.lock /opt/bilara/server
RUN poetry install --no-ansi --no-interaction

# ---

FROM python:3.9-slim-buster
WORKDIR /opt/bilara/server
RUN apt-get update \
  && apt-get install -y git  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/bilara/server /opt/bilara/server
COPY ./server /opt/bilara/server

# change this to match your application
CMD [ ".venv/bin/python", "-m", "flask", "run", "--host=0.0.0.0"]
