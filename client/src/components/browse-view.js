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


class NavItem extends LitElement {
  render(){
    const translated = this._tree._translated || this._tree._translated_count,
          root = this._tree._source || this._tree._source_count,
          isFile = this._tree._type == 'document',
          filename = this._name,
          lang = 'en',
          progressPercent = this._calculateProgressPercent(translated, root);

    
    
    return html`
      ${SharedStyles}
      <style>
      :host {
        margin-left: 1em;
        display: block;
      }
      .division {
        cursor: pointer;
      }
      .more:after {
        content: '▶';
      }
      paper-progress {
        display: inline-block;
        -paper-progress-secondary-color: rgb(200,100,100);
      }
      a{
        text-decoration: none
      }
      
      .progress-track {
          position: relative;
          display: inline-block;
          width: 5em;
          height: 0.7em;
          margin-top: 0.1em;
          background-color: #cccccc;
          border-radius: 4px;
      }

      .progress-bar {
          position: absolute;
          display: inline-block;
          height: 100%;
          background-color: green;
          border-radius: 4px;
          
      }

      .percent {
          font-size: 0.75em;
          vertical-align: middle;
          margin-left: 0.5em;
      }

      </style>

      <div class="${isFile ? "document" : "division"}">${ 
          isFile ? html`<a href="/translation/${filename}" @click="${this._navigate}">${this._name}</a>` 
                 : html`${ this._name }` }
        ${ translated ? html`<span title="${translated} / ${root}" class="progress-track"><span class="progress-bar" style="width: ${progressPercent}%"></span></span><span class="percent">${progressPercent}%</span>` : null}
        <div class="children" style="${this.open ? 'display: block' : 'display: none'}">
          ${this.open ? repeat(Object.keys(this._tree), (key)=>key, (name, index) => {
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
      :host {
        max-width: 70em;
        margin: auto;
      }
    </style>
    <section>
      ${ this._dataTree ? html`
        <nav-item _name="Browse" ._tree="${this._dataTree}" ?open="${true}"></nav-item>
      ` : html`Loading...`}
    </section>`
  }

  static get properties() { 
    return {
      _dataTree: {type: Object}
    }
  }

  firstUpdated() {
    store.dispatch(getBrowseData());
  }

  stateChanged(state) {
    this._dataTree = state.browse.tree
  }
}

window.customElements.define('browse-view', BrowseView);