import logging
from flask import Flask, redirect, url_for, session, request, jsonify, render_template_string, Response, stream_with_context, send_from_directory
from flask_oauthlib.client import OAuth, OAuthException
from flask_cors import CORS

from flask import jsonify

from github import Github

from config import config

import json

from requests import get

import pathlib


app = Flask(__name__)
cors = CORS(app)
app.config['JSON_AS_ASCII'] = False
app.config['JSON_SORT_KEYS'] = False
app.debug = True
app.secret_key = 'development'

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

@app.route('/api/tm/')
def tm_get():
    import tm
    string = request.args.get('string')
    source_lang = request.args.get('source_lang')
    target_lang = request.args.get('target_lang')
    return jsonify(tm.get_related_strings(string, source_lang, target_lang))

try:
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

    # @app.route('/')
    # def index():
    #     if 'github_token' in session:
    #         data = github_auth.get('user').data
    #         return jsonify(call_github())
    #     return render_template_string('<a href="{{ url_for("login") }}">Login</a>')

    @app.route('/auth/login')
    def login():
        return github_auth.authorize(callback='https://bilara.suttacentral.net/auth/authorized')


    @app.route('/auth/logout')
    def logout():
        session.pop('github_token', None)
        return redirect('/')


    @app.route('/auth/authorized')
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
        return redirect('/')
        #return jsonify(me.data)


    @github_auth.tokengetter
    def get_github_oauth_token():
        return session.get('github_token')

    @app.route('/auth/user')
    def call_github():
        github = Github(session.get('github_token')[0])
        result = []
        for repo in github.get_user().get_repos():
            result.append(repo.name)
        return jsonify(result)

    @app.route('/webhook', methods=['POST'])
    def webhook():
        data = request.get_json()
        return 'Okay', 200
except Exception as e:
    logging.error(f'An error occured while setting up OAuth app {str(e)}')

@app.route('/user')
def user():
    try:
        user_data = github_auth.get('user').data
        return jsonify({'login': user_data['login'], 'avatar_url': user_data['avatar_url']})
    except OAuthException:
        return jsonify({'login': None, 'avatar_url': None})


build_path = None#pathlib.Path('../client/build/esm-bundled').resolve()
#if not build_path.exists():
#    build_path = None

@app.route('/')
@app.route('/<path:path>')
def proxy(path=''):
    print(f'Proxying Path {path}')
    if build_path:
        if (not path or path.endswith('/')):
            path = 'index.html'
        if '.' in path and not path.split('.')[-1].isalpha():
            path = 'index.html'
        print(build_path, path)
        return send_from_directory(str(build_path), path)
    
    if path.split('/')[-1].isalpha():
        path = 'index.html'

    r = get(f'http://localhost:8081/{path}')
    resp = Response(r.content, content_type=r.headers['content-type'])
    

    
    return resp

if __name__ == '__main__':
    import fs
    app.run()


