import { html, LitElement } from '@polymer/lit-element';
import { when } from 'lit-html/directives/when';
import { repeat } from 'lit-html/directives/repeat';
import { PageViewElement } from './page-view-element.js';

import {navigate} from '../actions/app.js';

import { BilaraSegment } from './bilara-segment.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

import '@polymer/paper-progress/paper-progress.js';

// This element is connected to the Redux store.

import { browse } from '../reducers/browse.js';

store.addReducers({
  browse
});

import { getBrowseData } from '../actions/browse.js';


class NavItem extends LitElement {
  render(){
    const _translated = this._tree._translated || this._tree._translated_count,
          _source = this._tree._source || this._tree._source_count,
          isFile = this._name.match(/\.json$/),
          uid = isFile ? this._name.match(/(.*)\.json$/)[1] : this._name,
          lang = 'en';
    
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
      </style>

      <div class="${isFile ? "file" : "division"}">${ 
          isFile ? html`<a href="/translation/${uid}/${lang}" @click="${this._navigate}">${this._name}</a>` 
                 : html`${ this._name }` }
        ${ _translated ? html`<paper-progress value="${_translated}" max="${_source}"></paper-progress>` : null}
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
    console.log(e.currentTarget,  url);
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
      <h2>Browse</h2>
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