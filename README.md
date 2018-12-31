# \<bilara\>


## Development Installation

In development Bilara uses polymer serve for the client content and flask to serve the API.

Prequisites:

### Clone the repo

I assume that bilara is cloned to ~/bilara
```
git clone git@github.com:suttacentral/bilara.git
```

### Setup Node environment

polymer-cli should be installed. I recommend installing nvm: https://github.com/creationix/nvm to use a modern version of node which should result in no problems. Once nvm is installed (remember to open a new terminal), run something like:
```
nvm install node
npm install -g polymer-cli
cd ~/bilara/client
npm install
```

### Setup python environment
The API server uses python3.6+, I reccomend installing pyenv: https://github.com/pyenv/pyenv

Once pyenv is installed (remember to open a new terminal), run something like:
```
pyenv install 3.7.2
cd ~/bilara/server
pyenv local 3.7.2
pip install -r requirements.txt
```

### Clone the data repository

Note that in development mode bilara does not automatically perform git actions so you must manage the repository yourself

```
cd ~/bilara
git clone git@github.com:suttacentral/bilara-data.git repo
```

## Running development

The quick way:
```
cd ~/bilara
./run_dev.sh
```

Otherwise if you wish to get seperate debug feedback from the client and server code, run in seperate terminals:

```
cd ~/bilara/server
python app.py
```

```
cd ~/bilara/client
polymer serve
```
