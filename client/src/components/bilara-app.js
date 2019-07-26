/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html } from 'lit-element';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { installOfflineWatcher } from 'pwa-helpers/network.js';
import { installRouter } from 'pwa-helpers/router.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';

// This element is connected to the Redux store.
import { store } from '../store.js';

// These are the actions needed by this element.
import {
  navigate,
  updateOffline,
  updateDrawerState
} from '../actions/app.js';

// These are the elements needed by this element.
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import { menuIcon } from './my-icons.js';

import './login-view.js';

class BilaraApp extends connect(store)(LitElement) {
  render() {
    
    const translationUrl = this._page.subpath.length ? '/translation' + this._page.subpath.join('/') : null;


    // Anything that's related to rendering should be done in here.
    return html`
    <style>
      :host {
        --app-drawer-width: 256px;
        display: block;

        --app-primary-color: #E91E63;
        --app-secondary-color: #293237;
        --app-dark-text-color: var(--app-secondary-color);
        --app-light-text-color: white;
        --app-section-even-color: #f7f7f7;
        --app-section-odd-color: white;

        --app-header-background-color: white;
        --app-header-text-color: var(--app-dark-text-color);
        --app-header-selected-color: var(--app-primary-color);

        --app-drawer-background-color: var(--app-secondary-color);
        --app-drawer-text-color: var(--app-light-text-color);
        --app-drawer-selected-color: #78909C;

        --sc-primary-background-color: rgb(255, 248, 231);
        --sc-secondary-background-color: rgba(255,255,255,0.5);
        --sc-secondary-text-color: rgb(116, 115, 114);
      }

      app-header {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        text-align: center;
        background-color: var(--sc-primary-background-color);
        color: var(--app-header-text-color);
        border-bottom: 1px solid #eee;
      }

      .toolbar-top {
        background-color: var(--sc-primary-background-color);
      }

      [main-title] {
        font-family: 'Pacifico';
        font-weight: normal;
        text-transform: lowercase;
        font-size: 30px;
        /* In the narrow layout, the toolbar is offset by the width of the
        drawer button, and the text looks not centered. Add a padding to
        match that button */
        padding-right: 44px;
      }

      .toolbar-list {
        display: none;
      }

      .toolbar-list > a {
        display: inline-block;
        color: var(--app-header-text-color);
        text-decoration: none;
        line-height: 30px;
        padding: 4px 24px;
      }

      .toolbar-list > a[selected] {
        color: var(--app-header-selected-color);
        border-bottom: 4px solid var(--app-header-selected-color);
      }

      .menu-btn {
        background: none;
        border: none;
        fill: var(--app-header-text-color);
        cursor: pointer;
        height: 44px;
        width: 44px;
      }

      .drawer-list {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: 24px;
        background: var(--app-drawer-background-color);
        position: relative;
      }

      .drawer-list > a {
        display: block;
        text-decoration: none;
        color: var(--app-drawer-text-color);
        line-height: 40px;
        padding: 0 24px;
      }

      .drawer-list > a[selected] {
        color: var(--app-drawer-selected-color);
      }

      /* Workaround for IE11 displaying <main> as inline */
      main {
        display: block;
      }

      .main-content {
        padding-top: 64px;
        min-height: 100vh;
        background-color: var(--sc-primary-background-color);
      }

      .page {
        display: none;
      }

      .page[active] {
        display: block;
      }

      footer {
        padding: 24px;
        background: var(--app-drawer-background-color);
        color: var(--app-drawer-text-color);
        text-align: center;
      }

      /* Wide layout: when the viewport width is bigger than 460px, layout
      changes to a wide layout. */
      @media (min-width: 460px) {
        .toolbar-list {
          display: block;
        }

        .menu-btn {
          display: none;
        }

        .main-content {
          padding-top: 107px;
        }

        /* The drawer button isn't shown in the wide layout, so we don't
        need to offset the title */
        [main-title] {
          padding-right: 0px;
        }

        .disabled {
          opacity: 0.7;
        }
      }
      .app-log{
        color:var(--app-header-selected-color);
        font-weight:600;
        font-size: 0.8rem;
        text-decoration: none;
        padding:4px 8px;
         margin: 0 4px;
        border: 1px solid #ccc;
        border-radius: 8px;
        display:inline-block;
        text-transform: uppercase
      }
      .app-log:hover{
        background-color: var(--sc-secondary-background-color)
      }
      .user-name{
      display:inline-block;
      font-size: 0.8rem;
      font-style:italic;
      padding:4px 8px;
      margin: 0 4px
    }
    .user-name::before{
      content: "user: "
    }
        .user-name::after{
      content: "!"
    }
    </style>

    <!-- Header -->
    <app-header condenses reveals effects="waterfall">
      <app-toolbar class="toolbar-top">
        <button class="menu-btn" title="Menu" @click="${this._menuButtonClicked}">${menuIcon}</button>
        <h1 main-title>${this.appTitle}</h1>
        ${
          this._username ? html`<span class="user-name">${this._username}</span> <a href="/logout" target="_top" class="app-log">Logout</a>` : html`<a href="/login"  target="_top" class="app-log">Login</a>` 
        }
      </app-toolbar>

      <!-- This gets hidden on a small screen-->
      <nav class="toolbar-list">
        <a ?selected="${this._page.view === 'browse'}" href="/browse">Browse</a>
        ${ translationUrl ? 
        html`<a ?selected="${this._page.view === 'translation'}" href=${translationUrl}>Translate</a>`
        : html`<span class="disabled">Translate</span>` }
      </nav>
    </app-header>

    <!-- Drawer content -->
    <app-drawer .opened="${this._drawerOpened}"
        @opened-changed="${this._drawerOpenedChanged}">
      <nav class="drawer-list">
        <a ?selected="${this._page.view === 'browse'}" href="/browse">Browse</a>
        ${ translationUrl ? 
          html`<a ?selected="${this._page.view === 'translation'}" href=${translationUrl}>Translate</a>`
          : html`<span class="disabled">Translate</span>` }
      </nav>
    </app-drawer>
      
        
      <!-- Main content -->
      <main role="main" class="main-content">
        ${ this._userMustRevalidate ? '' : html`
          ${
            this._username ? html`
              <browse-view class="page" ?active="${this._page.view === 'browse'}"></browse-view>
              <translation-view class="page" ?active="${this._page.view === 'translation'}"></translation-view>
              <my-view404 class="page" ?active="${this._page.view === 'view404'}"></my-view404>`
            : html`<login-view></login-view>`
          }
      `}
      </main>

    }

    <footer>
      <p>Computer Aided Translation for SuttaCentral</p>
    </footer>`
  }

  static get properties() {
    return {
      appTitle: { type: String },
      _page: { type: Object },
      _drawerOpened: { type: Boolean },
      _offline: { type: Boolean },
      _username: { type: String },
      _avatarUrl: { type: String },
      _userMustRevalidate: { type: Boolean }
    }
  }

  constructor() {
    super();
    // To force all event listeners for gestures to be passive.
    // See https://www.polymer-project.org/3.0/docs/devguide/settings#setting-passive-touch-gestures
    setPassiveTouchGestures(true);
  }

  firstUpdated() {
    installRouter((location) => store.dispatch(navigate(decodeURIComponent(location.pathname))));
    installOfflineWatcher((offline) => store.dispatch(updateOffline(offline)));
    installMediaQueryWatcher(`(min-width: 460px)`,
        () => store.dispatch(updateDrawerState(false)));
  }

  updated(changedProps) {
    if (changedProps.has('_page')) {
      const pageTitle = this.appTitle + ' - ' + this._page;
      updateMetadata({
        title: pageTitle,
        description: pageTitle
        // This object also takes an image property, that points to an img src.
      });
    }
  }

  _menuButtonClicked() {
    store.dispatch(updateDrawerState(true));
  }

  _drawerOpenedChanged(e) {
    store.dispatch(updateDrawerState(e.target.opened));
  }

  stateChanged(state) {
    this._page = state.app.page;
    this._offline = state.app.offline;
    this._drawerOpened = state.app.drawerOpened;
    this._username = state.app.user.username;
    this._avatarUrl = state.app.user.avatarUrl;
    this._userMustRevalidate = state.app.user.revalidate;
  }
}

window.customElements.define('bilara-app', BilaraApp);
