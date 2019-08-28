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

import import_export

from log import segments_logger


app = Flask(__name__)

app.register_blueprint(import_export.import_export)

cors = CORS(app)
app.config['JSON_AS_ASCII'] = False
app.config['JSON_SORT_KEYS'] = False
app.debug = True
app.secret_key = 'development'
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

@app.route('/api/segments/<filename>', methods=['GET'])
def segments(filename):
    result = fs.get_data(filename=filename)
    return jsonify(result)

@app.route('/api/segments/', methods=['POST'])
def update():
    segments = request.get_json()
    segments_logger.debug(segments)
    user = get_user_details()
    return jsonify(fs.update_segments(segments=segments, user=user))

@app.route('/api/nav/')
def nav():
    return jsonify(fs.get_condensed_tree(['translation']))

@app.route('/api/tm/')
def tm_get():
    import tm
    get_user_details()
    string = request.args.get('string')
    root_lang = request.args.get('root_lang')
    target_lang = request.args.get('target_lang')
    return jsonify(tm.get_related_strings(string, root_lang, target_lang))

@app.route('/api/user')
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
        if resp is None or not resp.get('access_token'):
            return 'Access denied: reason=%s error=%s resp=%s' % (
                request.args['error'],
                request.args['error_description'],
                resp
            )
        session['github_token'] = (resp['access_token'], '')
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
        fs.git_fs.pull_if_needed(data)
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
                'avatar_url': ''
            }
    else:
        
        try:
            user_data = github_auth.get('user').data
            print(json.dumps(user_data, indent=2))
            user = {
                'login': user_data['login'],
                'name': user_data['name'] or user_data['login'],
                'avatar_url': user_data['avatar_url']
            }
        except OAuthException as e:
            logging.exception(e)
            session.pop('github_token', None)
            session.pop('user', None)
            raise
        
        try:
            email_data = github_auth.get('user/emails').data
            print(json.dumps(email_data, indent=2))
            user['email'] = email_data[0]['email']
            
        except OAuthException as e:
            logging.exception(e)
            user['email'] = ''
    
    session['user'] = user
    return user

import fs

