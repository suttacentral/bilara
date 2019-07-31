import logging
from flask import Flask, redirect, url_for, session, request, jsonify, render_template_string, Response, stream_with_context, send_from_directory
from flask_session import Session
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
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

@app.route('/api/segments/<filename>', methods=['GET'])
def segments(filename):
    import fs
    result = fs.get_data(filename=filename)
    return jsonify(result)

@app.route('/api/segments/', methods=['POST'])
def update():
    import fs
    user = get_user_details()
    return jsonify(fs.update_segments(segments=request.get_json(), user=user))

@app.route('/api/nav/')
def nav():
    import fs
    return jsonify(fs.get_condensed_tree(['translation']))

@app.route('/api/tm/')
def tm_get():
    import tm
    get_user_details()
    string = request.args.get('string')
    root_lang = request.args.get('root_lang')
    target_lang = request.args.get('target_lang')
    return jsonify(tm.get_related_strings(string, root_lang, target_lang))

if config.GITHUB_AUTH_ENABLED:
    oauth = OAuth(app)

    github_auth = oauth.remote_app(
        'github',
        consumer_key=config.GIT_APP_KEY,
        consumer_secret=config.GIT_APP_SECRET,
        request_token_params={'scope': 'repo read:user user:email'},
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

    @app.route('/login')
    def login():
        return github_auth.authorize(callback='https://bilara.suttacentral.net/authorized')


    @app.route('/logout')
    def logout():
        session.pop('github_token', None)
        session.pop('user', None)
        return redirect('/')


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
        user = get_user_details()
        return redirect('/')


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
else:
    @app.route('/login')
    def login():
        return 'Auth not enabled', 500
    
    @app.route('/logout')
    def logout():
        return 'Auth not enabled', 500
    
    @app.route('/authorized')
    def authorized():
        return 'Auth not enabled', 500
    



def get_user_details():
    user = session.get('user')
    if user:
        return user
    elif not config.GITHUB_AUTH_ENABLED:
            user = {
                'login': config.LOCAL_LOGIN,
                'name': config.LOCAL_USERNAME,
                'email': config.LOCAL_EMAIL,
            }        
    else:
        try:
            user_data = github_auth.get('user').data
            email_data = github_auth.get('user/emails').data
            print(json.dumps(user_data, indent=2))
            print(json.dumps(email_data, indent=2))

            user = {
                'login': user_data['login'],
                'name': user_data['name'] or user_data['login'],
                'email': email_data[0]['email']
            }
            
        except OAuthException:
            user = None
    
    session['user'] = user
    return user

@app.route('/user')
def user():
    if config.GITHUB_AUTH_ENABLED:
        print(session.get('github_token'))
        try:
            user_data = github_auth.get('user').data
            return jsonify({'login': user_data['login'], 'avatar_url': user_data['avatar_url']})
        except OAuthException:
            return jsonify({'login': None, 'avatar_url': None})
    else:
        user = get_user_details()
        return jsonify({'login': user['login'], 'avatar_url': None})

# @app.route('/')
# @app.route('/<path:path>')
# def proxy(path=''):
#     print(f'Proxying Path {path}')
#     if build_path:
#         if (not path or path.endswith('/')):
#             path = 'index.html'
#         if '.' in path and not path.split('.')[-1].isalpha():
#             path = 'index.html'
#         print(build_path, path)
#         return send_from_directory(str(build_path), path)
    
#     if path.split('/')[-1].isalpha():
#         path = 'index.html'

#     r = get(f'http://localhost:8081/{path}')
#     resp = Response(r.content, content_type=r.headers['content-type'])
#     max_age = 1
#     if 'node_modules' in path:
#         max_age = 86400 * 7
#     elif path.endswith('.woff2') or path.endswith('.png') or path.endswith('service-worker.js'):
#         max_age = 86400 * 7

#     resp.cache_control.max_age = max_age

    
#     return resp

import fs

