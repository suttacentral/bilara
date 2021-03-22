import logging

from urllib.parse import urlencode
from flask import (
    Flask,
    redirect,
    session,
    request,
    jsonify,
)
from flask_session import Session
from flask_oauthlib.client import OAuth
from flask_cors import CORS
from github import Github, BadCredentialsException
from config import config
import import_export

import auth
from log import segments_logger, problemsLog
import git_fs
import git_pr
import fs
import permissions
from segment_updates import update_segment
from search import search

app = Flask(__name__)

app.register_blueprint(import_export.import_export)

cors = CORS(app)
app.config["JSON_AS_ASCII"] = False
app.config["JSON_SORT_KEYS"] = False
app.debug = True
app.secret_key = "development"
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


@app.route("/api/segments/<long_id>", methods=["GET"])
def segments(long_id):
    user = get_user_details()
    print(user)
    root = request.args.get("root")
    tertiary = request.args.get("tertiary")
    result = fs.get_data(long_id, user=user, root=root, tertiary=tertiary)
    return jsonify(result)


@app.route("/api/segment/", methods=["POST"])
def update():
    segment = request.get_json()
    segments_logger.debug(segment)
    user = get_user_details()
    return jsonify(update_segment(segment=segment, user=user))


@app.route("/api/nav/")
def nav():
    user = get_user_details()
    return jsonify(fs.get_condensed_tree(["translation"], user=user))


@app.route("/api/problems/")
def problems():
    return jsonify(problemsLog.load())


@app.route("/api/tm/")
def tm_get():

    string = request.args.get("string")
    root_muids = request.args.get("root_muids")
    translation_muids = request.args.get("translation_muids")
    exclude_id = request.args.get("exclude_uid")
    return jsonify(
        search.tm_query(string, root_muids, translation_muids, exclude_id=exclude_id)
    )


@app.route("/api/search/", methods=["POST"])
def general_search():
    data = request.get_json()

    query = []
    source_field = data['source-field']
    if source_field:
        query.append({
          "muids": source_field,
          "query": data.get(source_field),  # can be None,
          "mandatory": True
        })
    target_field = data['target-field']
    if target_field:
        query.append({
          "muids": target_field,
          "query": data.get(target_field),
          "mandatory": True
        })

    query.extend({
        "muids": field,
        "query": data.get(field),
        "mandatory": bool(data.get(field))
        } for field in data.get('extra-fields', '').split(','))

    user = get_user_details()
    filter = data.get('uid-filter')

    result = search.search_query(query, 0, 50, segment_id_filter=filter, user=user)

    return jsonify(result)


@app.route("/api/publish", methods=["POST"])
def publish_request():
    data = request.get_json()
    path = data['path']
    user = get_user_details()
    result = git_fs.create_publish_request(path, user)
    return jsonify(result)

@app.route("/api/webhook", methods=["POST"])
def webhook():
    data = request.get_json()
    if 'pusher' in data:
        git_fs.githook(data)
    if 'action' in data:
        git_pr.perform_housekeeping()
    return "Okay", 200


if config.GITHUB_AUTH_ENABLED:
    oauth = OAuth(app)

    github_auth = oauth.remote_app(
        "github",
        consumer_key=config.GIT_APP_KEY,
        consumer_secret=config.GIT_APP_SECRET,
        request_token_params={"scope": "repo read:user user:email"},
        base_url="https://api.github.com/",
        request_token_url=None,
        access_token_method="POST",
        access_token_url="https://github.com/login/oauth/access_token",
        authorize_url="https://github.com/login/oauth/authorize",
    )

    @app.route("/api/login", methods=['POST'])
    def login():
        return github_auth.authorize(
            callback="https://bilara.suttacentral.net/api/authorized"
        )

    @app.route("/api/authorized")
    def authorized():
        resp = github_auth.authorized_response()
        if resp is None or not resp.get("access_token"):
            return "Access denied: reason=%s error=%s resp=%s" % (
                request.args["error"],
                request.args["error_description"],
                resp,
            )
        github_token = resp["access_token"]
        print(github_token)
        auth_token = auth.encrypt(github_token).decode()
        user = get_user_details(
            github_token=github_token, auth_token=auth_token, bypass_cache=True
        )
        params = {
            "token": auth_token,
            "login": user["login"],
            "avatar_url": user["avatar_url"],
        }

        response = redirect(f"https://bilara.suttacentral.net/auth?{urlencode(params)}")
        return response

    @github_auth.tokengetter
    def get_github_oauth_token():
        return session.get("github_token")


else:

    @app.route("/api/login", methods=['POST'])
    def login():
        return redirect("/api/authorized")

    @app.route("/api/authorized")
    def authorized():
        user = get_user_details()
        params = {
            "token": "__DEVELOPMENT__",
            "login": user["login"],
            "avatar_url": user["avatar_url"],
        }
        response = redirect(f"http://localhost:3003/auth?{urlencode(params)}")
        return response


def get_user_details(github_token=None, auth_token=None, bypass_cache=False, _cache={}):

    """ auth_token is simply github_token encrypted """

    if not config.GITHUB_AUTH_ENABLED:
        return {
            "login": config.LOCAL_LOGIN,
            "name": config.LOCAL_USERNAME,
            "email": config.LOCAL_EMAIL,
            "avatar_url": "",
        }

    if auth_token and auth_token in _cache:
        return _cache[auth_token]

    if not github_token:
        if not auth_token:
            auth_token = request.headers.get("x-bilara-auth-token")
            print(auth_token)

        github_token = auth.decrypt(auth_token)

    if github_token:
        try:
            gh = Github(github_token)
            gh_user = gh.get_user()
            user = {
                "login": gh_user.login,
                "name": gh_user.name or gh_user.login,
                "avatar_url": gh_user.avatar_url,
            }
        except BadCredentialsException as e:
            logging.exception(e)
            raise

        try:
            gh_emails = gh_user.get_emails()
            if gh_emails:
                user["email"] = gh_emails[0]["email"]

        except BadCredentialsException as e:
            logging.exception(e)
            user["email"] = ""
    else:
        raise ValueError("No github token but GITHUB_AUTH_ENABLED is True")

    if auth_token:
        _cache[auth_token] = user
    return user


def init():
    problemsLog.clear()
    permissions.get_rules(rebuild=True)
    fs.make_file_index()


init()
