/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import {
  UPDATE_PAGE,
  UPDATE_OFFLINE,
  UPDATE_DRAWER_STATE,
  UPDATE_PROBLEMS,
  SET_USER_AUTH_TOKEN,

} from '../actions/app.js';

const INITIAL_USER_STATE = {
    username: null,
    avatarUrl: null,
    authToken: null,
}

function getInitialUserState(){
    let user = INITIAL_USER_STATE;
    try {
        user = JSON.parse(localStorage.getItem('state.user'));
    } catch (err) {
        console.log(err.message);
        localStorage.removeItem('state.user');
    }
    return user
}


const INITIAL_STATE = {
  page: {
    view: 'browse',
    subpath: []
  },
  user: getInitialUserState(),
  offline: false,
  problems: null,
  drawerOpened: false,
};

const app = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_PAGE:
      return {
        ...state,
        page: {
          view: action.view,
          subpath: action.subpath
        }
      };
    case UPDATE_OFFLINE:
      return {
        ...state,
        offline: action.offline
      };
    case UPDATE_PROBLEMS:
      return {
        ...state,
        problems: action.problems
      };
    case UPDATE_DRAWER_STATE:
      return {
        ...state,
        drawerOpened: action.opened
      };
    case SET_USER_AUTH_TOKEN:
    return {
        ...state,
        user: {
            authToken: action.authToken,
            username: action.username,
            avatarUrl: action.avatarUrl
        }
    };

    default:
      return state;
  }
};

export default app;
