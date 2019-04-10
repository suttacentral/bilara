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

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const UPDATE_OFFLINE = 'UPDATE_OFFLINE';
export const UPDATE_DRAWER_STATE = 'UPDATE_DRAWER_STATE';
export const UPDATE_USER = 'UPDATE_USER';
export const USER_MUST_REVALIDATE = 'USER_MUST_REVALIDATE';


export const getApiUrl = (getState) => {
  const state = getState();
  return state.app.apiUrl;
}

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

const loadPage = (view, subpath) => (dispatch) => {
  switch(view) {
    case 'browse': 
      import('../components/browse-view.js');
      break;
    case 'translation':
      if (subpath.length === 0) {
        subpath = ['dn1', 'en']
      }
      dispatch(fetchSegmentData(subpath[0], subpath[1]));
      import('../components/translation-view.js');
      break;
    case 'redux':
      import('../components/redux-view.js');
      break;
    case 'login':
    case 'logout':
      //dispatch({type: USER_MUST_REVALIDATE})
      console.log('Bypassing routing')
      return
    default:
      view = 'view404';
      import('../components/my-view404.js');
  }

  dispatch(updatePage(view, subpath));
}

const updatePage = (view, subpath) => (dispatch, getState) => {
  let state = getState();
  if (state.app.user.revalidate) {
    fetch('/user').then(res => res.json())
    .then(data => {
      dispatch(updateUser(data.login, data.avatar_url))
      dispatch({
        type: UPDATE_PAGE,
        view,
        subpath
      })
    })
  }
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

export const updateUser = (username, avatarUrl) => {
  return {
    type: UPDATE_USER,
    username,
    avatarUrl
  }
}
