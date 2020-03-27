import { html, LitElement } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { PageViewElement } from './page-view-element.js';

import {navigate} from '../actions/app.js';

import { BilaraSegment } from './bilara-segment.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

// This element is connected to the Redux store.

import { browse } from '../reducers/browse.js';

store.addReducers({
  browse
});

import { getBrowseData } from '../actions/browse.js';
import { getProblems } from '../actions/app.js';


class NavItem extends LitElement {
  render(){
    const translated = this._tree._translated || this._tree._translated_count,
          root = this._tree._root || this._tree._root_count,
          isFile = this._tree._type == 'document',
          filename = this._name,
          lang = 'en',
          progressPercent = this._calculateProgressPercent(translated, root);

    
    
    return html`
      ${SharedStyles}
      <style>
      :host {
        margin: 0 0 0 1rem;
        display: block;
         white-space: nowrap;
         overflow: visible;
         position: relative
      }
      :host:before{
        content: "▶";
        display: inline-block;
        position: absolute;
        font-size: 0.75em;
    top: 10px;
    left: 8px;
    color: var(--bilara-green);
      }
      [open=""]:before{
transform: rotate(90deg);
    top: 10px;
    left: 8px;
     color: var(--bilara-magenta)
      }

      .division {
        display: block;
        margin: 2px 0;
        padding: 2px 0;
        cursor: pointer;
      }

      .navigable{
        padding: 4px 24px 4px 24px;
           font-weight: 600;
           display: inline-block;
           border-radius: 4px
      }
      .navigable:hover{
        background-color: var(--bilara-secondary-background-color)
      }

      .more:after {
        content: '▶';
      }

      a{
        text-decoration: none;
      }
      a:hover{
      text-decoration: underline
    }
      
      .progress-track {
          position: relative;
          display: inline-block;
          width: 5em;
          height:12px;
          margin: 6px 0;
          background-color: var(--bilara-tertiary-background-color);
          border-radius: 4px;
          float: right;
          right: 1rem;
      }
      .progress-track:before{
        content: "${progressPercent}%";
        position: absolute;
        display: inline-block;
        color: white;
        font-size: 0.55em;
        z-index: 1;
        vertical-align: middle;
        font-weight: 600;
        top: -1px;
        left: 4px;
        text-shadow: 0px 0px 1px var(--bilara-black);
        font-weight: 800
      }

      .progress-bar {
          position: absolute;
          display: inline-block;
          height: 100%;
          background-color: var(--bilara-green);
          border-radius: 4px;
           float: right;
      }


      </style>

      <div class="${isFile ? "document" : "division"}">${ 
          isFile ? html`<a href="/translation/${filename}" @click="${this._navigate}" class="navigable">${this._name}</a>` 
                 : html`<span class="navigable">${ this._name }</span>` }
        ${ translated ? html`<span title="${translated} / ${root}" class="progress-track"><span class="progress-bar" style="width: ${progressPercent}%"></span></span>` : null}
        <div class="children" style="${this.open ? 'display: block' : 'display: none'}">
          ${this.open ? repeat(Object.keys(this._tree || []), (key)=>key, (name, index) => {
            if (name.match(/^_/)) {
              return null
            }
            return html`<nav-item ._name="${name}" ._tree="${this._tree[name]}" ?open=${false} @click="${this._onClick}"></nav-item>`
          }) : html``}
        </div>
      </div>`
  }

  _onClick(e) {
    e.currentTarget.open = !e.currentTarget.open;
    e.stopPropagation();
  }

  _navigate(e) {
    const url = e.currentTarget.href;
    e.preventDefault();
    e.stopPropagation();
    history.pushState({page: url}, "Translate " + url, url);
    store.dispatch(navigate(decodeURIComponent(location.pathname)))
  }

  static get properties(){
    return {
      _name: {type: String},
      _tree: {type: Object},
      open: {type: Boolean, reflect: true}
    }
  }

  _calculateProgressPercent(a, b) {
      let result = 100 * a / b;
      if (result > 0 && result < 1) {
          return 1;
      }
      return Math.floor(result);
  }
}

window.customElements.define('nav-item', NavItem);

class BrowseView extends connect(store)(PageViewElement) {
  render(){
    return html`
    ${SharedStyles}
    <style>

         .browse{
      border: 3px solid var(--bilara-tertiary-background-color);
       padding: 108px;
       min-width: 600px;
       height: fit-content;
       margin: 144px 0;
       border-radius: 600px
      }
      h2{
        text-align: center;
        font-weight:600;
        margin: 0 0 16px 0
      }

      .problems {
        font-size: 0.8em;
      }
.total:before{
content: ""
}
      .error {
        padding: 0.5em;
        border: 1px solid var(--bilara-red);
        border-radius: 3px;
        margin: 0.25em;
      }

      .file {
        font-family: mono;
        font-size: 0.8em;
      }

      .link {
        text-decoration: none;
        color: var(--bilara-blue);
      }

      .link svg {
        width: 1em;
        height: 1em;
      }

      .link::after {
        content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAVklEQVR4Xn3PgQkAMQhDUXfqTu7kTtkpd5RA8AInfArtQ2iRXFWT2QedAfttj2FsPIOE1eCOlEuoWWjgzYaB/IkeGOrxXhqB+uA9Bfcm0lAZuh+YIeAD+cAqSz4kCMUAAAAASUVORK5CYII=);    
   }

      .msg {
        display: block;
        background-color: var(--bilara-secondary-background-color);
      }
      .heart{
        color: var(--bilara-red)
      }
    </style>
    <section class="browse">
    <h2>Translate your little <span class="heart">💚</span> out, ${this._username}!</h2>
      ${ this._dataTree ? html`
        <nav-item _name="Total" ._tree="${this._dataTree}" ?open="${true}" class="total"></nav-item>
      ` : html`Loading...`}
    </section>
    
    ${this._renderProblems()}
    `
  }

  _renderProblems(){
    if (!this._problems || this._problems.length == 0) return html``

    return html`
    <section class="problems">
    <hr>
    <p>Some errors occured while attempting to load the data and require human intervention. You can likely use
    Bilara without issue, except in relation to the files where errors occurred.</p>
    <div class="errors">
    ${repeat(this._problems, (entry) => {
        return html`<div class="error"><span class="file">${entry.file} <a class="link" href="${entry.href_root}${entry.file}"></a></span>  <span class="msg">${entry.msg}</span></div>`
      })
    }
    </div>
    </section>` 
  }

  static get properties() { 
    return {
      _dataTree: {type: Object},
      _problems: {type: Array},
      _username: {type: String}
    }
  }

  firstUpdated() {
    store.dispatch(getBrowseData());
    store.dispatch(getProblems());
  }

  stateChanged(state) {
    this._dataTree = state.browse.tree;
    this._problems = state.app.problems;
    this._username = state.app.user.username;
  }
}

window.customElements.define('browse-view', BrowseView);