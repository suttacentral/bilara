/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { installOfflineWatcher } from 'pwa-helpers/network.js';
import { installRouter } from 'pwa-helpers/router.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';

import { repeat } from 'lit-html/directives/repeat.js';



// This element is connected to the Redux store.
import { store } from '../store.js';

// These are the actions needed by this element.
import {
  navigate,
  updateOffline,
  updateDrawerState,
  updateTheme
} from '../actions/app.js';

// These are the elements needed by this element.

import './login-view.js';
import './bilara-modal.js';

import { themes, defaultTheme } from '../styles/themes.js';

class BilaraApp extends connect(store)(LitElement) {
  static get styles() {
    return [
      css`
      header
{
    position: fixed;
    z-index: 1000;
    top: 0;

    display: flex;

    width: 100%;
    height: var(--bilara-header-height);

    color: var(--bilara-secondary-text-color);
    background-color: var(--bilara-black);
    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);

    justify-content: space-between;
}

header div
{
    display: flex;

    margin: 4px 16px;

    align-items: center;
}

[main-title]
{
    font-family: var(--bilara-serif);
    font-size: 1rem;
    font-weight: 900;

    margin: 0;
    padding: 2px 8px;

    letter-spacing: 2px;

    color: var(--bilara-secondary-color);

    font-variant-caps: all-small-caps;
}

[main-title]:hover
{
    color: var(--bilara-secondary-background-color);
    background-color: var(--bilara-secondary-color);
}

a
{
    text-decoration: none;
}

a.navigable:hover
{
    text-decoration: underline;
}

main
{
    display: flex;

    min-height: calc(100vh - var(--bilara-footer-height));

    background-color: var(--bilara-primary-background-color);

    justify-content: center;
}

.page
{
    display: none;
}

.page[active]
{
    display: flex;
}

footer
{
    display: flex;

    height: var(--bilara-footer-height);
    padding: 0 32px;;

    color: var(--bilara-emphasized-text-color);
    background-color: var(--bilara-tertiary-background-color);

    justify-content: center;
    align-items: center;
    justify-content: space-around;
}

footer a
{
    color: var(--bilara-secondary-color);
}

footer a:hover
{
    text-decoration: underline;
}

.disabled
{
    opacity: .7;
}

.app-log
{
    font-size: .8rem;
    font-weight: 600;

    display: inline-block;

    margin: 0 4px;
    padding: 2px 8px;

    letter-spacing: .05em;

    color: var(--bilara-secondary-color);
    border: 1px solid var(--bilara-secondary-text-color);
    border-radius: 8px;
    background-color: inherit;

    font-variant-caps: all-small-caps;
}

.app-log:hover
{
    color: var(--bilara-secondary-background-color);
    background-color: var(--bilara-secondary-color);
}

figure
{
    display: inline-flex;
    flex-direction: column;

    margin: 0 8px;
    margin-right: 16px;;

    align-items: center;
    justify-content: center;
}

figcaption.user-name
{
    font-size: 12px;
    font-weight: 600;
    font-style: italic;
    line-height: 1;

    margin-top: -6px;
    padding: 0 4px;

    white-space: nowrap;

    color: var(--bilara-cyan);
    text-shadow: 0 0 3px black;
}



.user-name::after
{
    content: '!';
}

img
{
    width: 28px;
    height: 28px;

    border-radius: 50%;
}

.user-name-link
{
    display: contents;
}

ul
{
    list-style: none; /* Remove default bullets */
}

select
{
    line-height: 1.3;

    box-sizing: border-box;
    width: 120px;
    margin: 0;
    padding: .6em 1.4em .5em .8em;

    color: var(--bilara-primary-text-color);
    border: 1px solid var(--bilara-primary-color);
    border-radius: 8px;
    background-color: var(--bilara-secondary-background-color);
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat, repeat;
    background-position: right .7em top 50%, 0 0;
    background-size: .65em auto, 100%;
    box-shadow: 0 1px 0 1px rgba(0,0,0,.04);

       -moz-appearance: none;
    -webkit-appearance: none;
            appearance: none;
}

select:hover
{
    border-color: var(--bilara-red);
}

select:focus
{
    color: var(--bilara-primary-text-color);
    border-color: #aaa;
    outline: none;
    box-shadow: 0 0 1px 3px var(--bilara-primary-color);
    box-shadow: 0 0 0 3px -moz-mac-focusring;
}

select option
{
    font-weight: normal;
}

details
{
    position: relative;;

    padding: 0 16px;
}

details div
{
    position: absolute;
    top: 29px;

    display: block;

    width: 480px;
    padding: 16px 16px 0;

    background-color: var(--bilara-black);
    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);
}

details ul
{
    margin-top: 0;
    padding-left: 16px;

    list-style-type: circle;
}

details ul ul
{
    list-style-type: none;
}

details ol
{
    margin-top: 0;;
    padding-left: 16px;
}

details a
{
    color: var(--bilara-primary-color);
}



`
    ]
  }

  render() {
    
    const translationUrl = this._page.subpath.length ? '/translation' + this._page.subpath.join('/') : null;

    // Anything that's related to rendering should be done in here.
    return html`

    <!-- Header -->
    <header class="app-header">
    <div class="app-header-left">
       <a href="/browse"><h1 main-title>${this.appTitle}</h1></a>
                   <details>
      <summary>How to</summary>
      <div>
      <p>Bilara is a Computer Assisted Translation (CAT) webapp built by SuttaCentral to help translate Buddhist scripture.</p>
      <p>Before you begin, read the <a href='https://github.com/suttacentral/bilara-data/wiki/SuttaCentral-translation-style-guide'>Translation Style Guide</a>.</p>
      <p><b>Basic usage</b>. For more details see the <a href='https://github.com/suttacentral/bilara-data/wiki/Guide-for-translators'>Guide For Translators</a>.</p>
      <ol>
      <li>Navigate to a text. (<b>Bold</b> items are the ones you can edit.)</li>
      <li>Click on the translation column.</li>
      <li> Write the translation for that segment.</li>
      <li>If the Translation Memory (TM) shows a match, you can click it and modify as needed.</li>
      <li>Press Enter.</li>
      <li>Repeat until finished!</li>
      </ol>
      <b>Some tips</b>
      <ul>   
            <li>Write plain text. Don’t input anything other than plain text.</li>
            <li>Your translations are securely saved at Github using git version control, which keeps a full record of every change made. In emergency, contact admins, and they will restore your text if possible.</li>
            <li>Github has a <a href="https://github.com/suttacentral/bilara-data/pulse" target="_blank">range of fancy stats</a>.</li>
            <li>You can use a limited range of markdown: <ul>
            <li><code>_underscore_</code> for quoting foreign words (esp. Pali) (= <code>&lt;i&gt;</code>).</li>
            <li><code>*asterisks*</code> to emphasize words (= <code>&lt;em&gt;</code>).</li>
            <li><code>**double asterisks**</code> for things that stand out, like numbers or headwords. You probably don't want to use this (= <code>&lt;b&gt;</code>).</li>
            </ul>
            </li>
            <li>The little icons on the right indicate whether a string is properly committed or not.</li>
            <li>You can drag and drop the columns in any order you like.</li>
            <li>You can add more columns by clicking the ⊕ icon.</li>
            </ul></div>
      </details>
       </div>
       <div class="app-header-right">

        ${
          this._username ? html`<a class="user-name-link" href="${this._avatarUrl ? 'https://github.com/' + this._username : 'https://www.youtube.com/watch?v=oHg5SJYRHA0'}"><figure>
  <img src="${this._avatarUrl || '../images/bob.jpg'}" alt="${this._username}">
  <figcaption class="user-name">${this._username}</figcaption>
</figure></a>
<a href="/logout" target="_top" class="app-log">Logout</a>` 
: html`<form action="/api/login" method="post"><button class="app-log">Login</button></form>` 
        }
        </div>
    </header>

      <bilara-modal></bilara-modal>
        
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

    <footer>


      <p>Computer Assisted Translation for SuttaCentral</p>


             <select id="theme" @change="${this._selectTheme}">
       ${repeat(Object.keys(themes), (name) => {
         return html`
          <option value="${name}" ?selected="${name == this._theme }">${name}</option>
          `
       })}
       </select>
      <ul>
      <li><a href="https://suttacentral.net">SuttaCentral</a></li>
      <li><a href="https://github.com/suttacentral/bilara">Github</a></li>
      <li><a href="https://discourse.suttacentral.net/">Forum</a></li>
      </ul>
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
      _activeSegmentId: { type: String },
      _theme: { type: String }
    }
  }

  firstUpdated() {
    installRouter((location) => store.dispatch(navigate(decodeURIComponent(location.pathname))));
    installOfflineWatcher((offline) => store.dispatch(updateOffline(offline)));
    installMediaQueryWatcher(`(min-width: 460px)`,
        () => store.dispatch(updateDrawerState(false)));
  }

  updated(changedProps) {
    if (changedProps.has('_page') || changedProps.has('_activeSegmentId')) {
      
      const pageTitle = this._activeSegmentId ? this._activeSegmentId : this.appTitle;
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

  _selectTheme(e) {
    console.log(e.target.value);
    store.dispatch(updateTheme(e.target.value));
  }

  stateChanged(state) {
    this._page = state.app.page;
    this._offline = state.app.offline;
    this._drawerOpened = state.app.drawerOpened;
    this._username = state.app.user.username;
    this._avatarUrl = state.app.user.avatarUrl;
    this._userMustRevalidate = state.app.user.revalidate;
    this._activeSegmentId = state.segmentData ? state.segmentData.activeSegmentId : '';
    this._theme = state.app.pref.theme || defaultTheme;
  }
}

window.customElements.define('bilara-app', BilaraApp);
