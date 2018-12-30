from flask import Flask, redirect, url_for, session, request, jsonify, render_template_string
from flask_oauthlib.client import OAuth
from flask_cors import CORS

from flask import jsonify

from github import Github

from config import config

app = Flask(__name__)
cors = CORS(app)
app.config['JSON_AS_ASCII'] = False
app.config['JSON_SORT_KEYS'] = False
app.debug = True
app.secret_key = 'development'
oauth = OAuth(app)

github_auth = oauth.remote_app(
    'github',
    consumer_key=config.GIT_APP_KEY,
    consumer_secret=config.GIT_APP_SECRET,
    request_token_params={'scope': 'repo read:user'},
    base_url='https://api.github.com/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize'
)

@app.route('/api/segments/', methods=['GET'])
def segments():
    import fs
    uid = request.args.get('uid')
    to_lang = request.args.get('to_lang')

    result = fs.get_data(uid=uid, to_lang=to_lang)

    return jsonify(result)

@app.route('/api/segments/', methods=['POST'])
def update():
    import fs
    return jsonify(fs.update_segments(segments=request.get_json()))

@app.route('/api/nav/')
def nav():
    import fs
    return jsonify(fs.get_condensed_tree(['translation']))

@app.route('/')
def index():
    if 'github_token' in session:
        data = github_auth.get('user').data
        return jsonify(call_github())
    return render_template_string('<a href="{{ url_for("login") }}">Login</a>')



@app.route('/login')
def login():
    return github_auth.authorize(callback=url_for('authorized', _external=True))


@app.route('/logout')
def logout():
    session.pop('github_token', None)
    return redirect(url_for('index'))


@app.route('/authorized')
def authorized():
    resp = github_auth.authorized_response()
    if resp is None or resp.get('access_token') is None:
        return 'Access denied: reason=%s error=%s resp=%s' % (
            request.args['error'],
            request.args['error_description'],
            resp
        )
    session['github_token'] = (resp['access_token'], '')
    me = github_auth.get('user')
    return jsonify(me.data)


@github_auth.tokengetter
def get_github_oauth_token():
    return session.get('github_token')


def call_github():
    github = Github(session.get('github_token')[0])
    result = []
    for repo in github.get_user().get_repos():
        result.append(repo.name)
    return result

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.get_json()
    return 'Okay', 200

if __name__ == '__main__':
    app.run()
