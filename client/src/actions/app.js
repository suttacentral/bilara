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

export const navigate = (path) => (dispatch) => {
  // Extract the page name from path.
  const pageArray = path.split('/');
  const page = path === '/' ? 'view1' : pageArray[1];
  const lefts = pageArray.slice(2);

  console.log('Navigating to ' + path);
  // Any other info you might want to extract from the path (like page type),
  // you can do here
  dispatch(loadPage(page, lefts));

  // Close the drawer - in case the *path* change came from a link in the drawer.
  dispatch(updateDrawerState(false));
};

const loadPage = (page, lefts) => (dispatch) => {
  switch(page) {
    case 'browse': 
      import('../components/browse-view.js');
      break;
    case 'translation':
      import('../components/translation-view.js');
      break;
    case 'redux':
      import('../components/redux-view.js');
      break;
    default:
      page = 'view404';
      import('../components/my-view404.js');
  }

  dispatch(updatePage(page, lefts));
};

const updatePage = (page, lefts) => {
  return {
    type: UPDATE_PAGE,
    page,
    lefts
  };
};

export const updateOffline = (offline) => (dispatch, getState) => {
  dispatch({
    type: UPDATE_OFFLINE,
    offline
  });
};

export const updateDrawerState = (opened) => {
  return {
    type: UPDATE_DRAWER_STATE,
    opened
  };
};
