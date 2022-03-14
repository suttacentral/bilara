import { fetchSegmentData } from './segment-data.js';

/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import('../components/browse-view.js');
import('../components/translation-view.js');

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const UPDATE_OFFLINE = 'UPDATE_OFFLINE';
export const UPDATE_DRAWER_STATE = 'UPDATE_DRAWER_STATE';
export const UPDATE_PROBLEMS = 'UPDATE_PROBLEMS';
export const SET_USER_AUTH_TOKEN = 'SET_USER_AUTH_TOKEN';

export const UPDATE_PREF = 'UPDATE_PREF';
export const UPDATE_ORDERING_PREF = 'UPDATE_ORDERING_PREF';
export const UPDATE_TERTIARY_PREF = 'UPDATE_TERTIARY_PREF';
export const UPDATE_THEME = 'UPDATE_THEME';

export const SET_TRANSLATE_MODE = 'SET_TRANSLATE_MODE';

export const navigate = (path) => (dispatch) => {
  // Extract the page name from path.
  const pageArray = path.split('/');
  const subpath = pageArray.slice(2);
  const view = path === '/' ? 'browse' : pageArray[1];

  // Any other info you might want to extract from the path (like page type),
  // you can do here
  dispatch(loadPage(view, subpath));

  // Close the drawer - in case the *path* change came from a link in the drawer.
  dispatch(updateDrawerState(false));
};

function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

const loadPage = (view, subpath) => (dispatch, getState) => {
  let queryParams = parseQuery(location.search);
  console.log(view, subpath, queryParams);
  switch(view) {
    case 'auth':
      dispatch(setAuthToken(queryParams.token, queryParams.login, queryParams.avatar_url));
      history.replaceState(null, null, '/browse');
      view = 'browse';
    case 'browse': 
      
      break;
    case 'translation':
      if (subpath.length === 0) {
        subpath = ['dn1_translation-en-sujato']
      }
      let key = subpath[0].split('_')[1],
          tertiary = (getState().app.pref.tertiary[key] || []).join(',');
      dispatch(fetchSegmentData(subpath[0], queryParams.root, tertiary));

      break;
    case 'logout':
      console.log('Logging out');
      dispatch(setAuthToken(null, null, null));
      history.replaceState(null, null, '/');
      view = 'browse';
    case 'login':
    case 'import':
    case 'export':
      return
    default:
      view = 'view404';
      import('../components/my-view404.js');
  }

  dispatch(updatePage(view, subpath));
}

const setAuthToken = (authToken, username, avatarUrl) => (dispatch, getState) => {
    if (authToken) {
        localStorage.setItem('state.user', JSON.stringify({authToken, username, avatarUrl}));
    } else {
        localStorage.removeItem('state.user');
    }
    dispatch({type: SET_USER_AUTH_TOKEN, authToken, username, avatarUrl});
}

const updatePage = (view, subpath) => async (dispatch, getState) => {
  dispatch({
    type: UPDATE_PAGE,
    view,
    subpath
  })
}

export const updateOffline = (offline) => (dispatch, getState) => {
  dispatch({
    type: UPDATE_OFFLINE,
    offline
  })
}

export const updateDrawerState = (opened) => {
  return {
    type: UPDATE_DRAWER_STATE,
    opened
  }
}

export const getProblems = () => (dispatch) => {
  return fetch('/api/problems/')
  .then(res => res.json())
  .then(data => {
      dispatch( {
        type: UPDATE_PROBLEMS,
        problems: data
      } );
  }).catch( (e) => {console.log(e);})
}

export const updatePref = (key, value) => (dispatch) => {
  return dispatch({
    type: UPDATE_PREF,
    key,
    value
  })
}

export const updateOrdering = (key, value) => (dispatch) => {
  return dispatch({
    type: UPDATE_ORDERING_PREF,
    key,
    value
  });
}

export const updateTertiary = (key, value) => (dispatch) => {
  dispatch({
    type: UPDATE_TERTIARY_PREF,
    key,
    value
  });
}

export const updateTheme = (theme) => (dispatch) => {
  dispatch({
    type: UPDATE_THEME,
    theme
  })
}

export const setTranslateMode = (mode) => (dispatch) => {
  dispatch({
    type: SET_TRANSLATE_MODE,
    mode
  })
}