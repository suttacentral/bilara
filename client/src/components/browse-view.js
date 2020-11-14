import { html, css, LitElement } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { PageViewElement } from './page-view-element.js';

import {navigate} from '../actions/app.js';

import { BilaraSegment } from './bilara-segment.js';

// These are the shared styles needed by this element.
import { sharedStyles } from './shared-styles.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

import { featureFlags } from '../util.js';

import '@lion/dialog/lion-dialog.js';

import './bilara-dialog-publish.js';

// This element is connected to the Redux store.

import { browse } from '../reducers/browse.js';

store.addReducers({
  browse
});

import { getBrowseData } from '../actions/browse.js';
import { getProblems } from '../actions/app.js';


class NavItem extends LitElement {
  static get styles(){
    return [
      sharedStyles,
      css`
      :host
{
    position: relative;;

    display: block;
    overflow: visible;

    margin: 0 0 0 1rem;

    white-space: nowrap;
}

:host:before
{
    font-size: .75em;

    position: absolute;
    top: 10px;
    left: 8px;

    display: inline-block;

    content: '▶';

    color: var(--bilara-green);
}

[open='']:before
{
    top: 10px;
    left: 8px;

    transform: rotate(90deg);

    color: var(--bilara-magenta);
}

.division
{
    display: block;

    margin: 2px 0;
    padding: 2px 0;

    cursor: pointer;
}

.navigable
{
    font-weight: 500;

    display: inline-block;

    padding: 4px 24px 4px 24px;

    border-radius: 4px;
}

.navigable:hover
{
    background-color: var(--bilara-secondary-background-color);
}

.edit .navigable
{
    font-weight: 900;
}

.more:after
{
    content: '▶';
}

a
{
    text-decoration: none;
}

a:hover
{
    text-decoration: underline;
}

.publish {
   position: absolute;
    right: 7em;
}

.publish button{
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
.publish button:hover{
color: var(--bilara-secondary-background-color);
    background-color: var(--bilara-secondary-color);
    cursor:pointer;
}

.progress-track
{
    position: relative;
    right: 1rem;

    display: inline-block;
    float: right;

    width: 5em;
    height: 12px;
    margin: 6px 0;

    border-radius: 4px;
    background-color: var(--bilara-tertiary-background-color);
}

.progress-bar:before
{
    font-size: .55em;
    font-weight: 800;

    position: absolute;
    z-index: 1;
    top: -1px;
    left: 4px;

    display: inline-block;

    content: attr(data-progress) '%';
    vertical-align: middle;

    color: white;
    text-shadow: 0 0 1px var(--bilara-black);
}

.progress-bar
{
    position: absolute;

    display: inline-block;
    float: right;

    height: 100%;

    border-radius: 4px;
    background-color: var(--bilara-green);
}
      `
    ]
  }


  render(){
    const translated = this._tree._translated || this._tree._translated_count,
          root = this._tree._root || this._tree._root_count,
          isFile = this._tree._type == 'document',
          filename = this._name,
          lang = 'en',
          progressPercent = this._calculateProgressPercent(translated, root),
          publishState = this._publishState();

    
    
    return html`
      <div class="${isFile ? 'document' : 'division'}  ${(this._tree._permission || '').toLowerCase()}">
      ${ isFile ? html`<a href="/translation/${filename}" @click="${this._navigate}" class="navigable">${this._name}</a>` 
                 : html`<span class="navigable">${ this._name }</span>` }
        ${ featureFlags.publish ? html`<span class="publish">${ publishState ? html`<button @click=${this._publish} title="${publishState}" class="${publishState}">
          ${{MODIFIED: 'Update', UNPUBLISHED: 'Publish', PULL_REQUEST: 'Pull Request'}[publishState]}</button>`: html``}</span>` : html``}

        
        ${ translated ? html`<span title="${translated} / ${root}" class="progress-track">
                                <span class="progress-bar" style="width: ${progressPercent}%" data-progress="${progressPercent}"></span>
                            </span>` : null}
        
        <div class="children" style="${this.open ? 'display: block' : 'display: none'}">
          ${this.open ? repeat(Object.keys(this._tree || []), (key)=>key, (name, index) => {
            if (name.match(/^_/)) {
              return null
            }
            return html`<nav-item ._name="${name}" ._tree="${this._tree[name]}" ._path="${(this._path || []).concat(name)}" ?open=${false} @click="${this._onClick}"></nav-item>`
          }) : html``}
        </div>
      </div>`
  }

  _publishState() {
    const publishState = this._tree._publish_state;
    if (!publishState) return false
    if (typeof(publishState) == "string" && publishState != 'PUBLISHED') return publishState;
    if (publishState.state) {
      return publishState.state;
    }
    if (publishState['UNPUBLISHED'] > 0) {
      return 'UNPUBLISHED';
    } else if (publishState['MODIFIED'] > 0) {
      return 'MODIFIED';
    }
  }

  firstUpdated() {
    this._hasChildren = Object.keys(this._tree).some((k) => {return !/^_/.exec(k)})
  }
  _onClick(e) {
    e.stopPropagation();
    if (!e.currentTarget._hasChildren) return    
    e.currentTarget.open = !e.currentTarget.open;
    
  }

  _publish(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const path = ['translation'].concat(this._path).join('/'),
          PRUrl = this._tree._publish_state.url;
    console.log(this, path);

    let event = new CustomEvent('publish', {
      detail: {
        path,
        PRUrl
      },
      bubbles: true,
      composed: true
    })

    this.dispatchEvent(event);
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
      _hasChildren: {type: Boolean},
      _path: {type: Array},
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
  static get styles() {
    return [
      sharedStyles,
      css`
     .browse
{
    min-width: 600px;
    height: fit-content;
    margin: 144px 0;
    padding: 108px;

    border: 3px solid var(--bilara-tertiary-background-color);
    border-radius: 600px;
}

h2
{
    font-family: var(--bilara-serif);
    font-size: 1em;
    font-weight: 500;
    font-style: italic;

    margin: 0 0 1em 0;

    text-align: center;
}

.problems
{
    font-size: .8em;
    max-width: 800px;
    margin: auto;
}

.problems .dontpanic:after {
  content: "DON'T PANIC";
  position: absolute;
  font-size: 600%;
  opacity: 0.1;
  vertical-align: top;
  
}


.total:before
{
    content: '';
}

.error
{
    margin: .25em;
    padding: .5em;

    border: 1px solid var(--bilara-red);
    border-radius: 3px;
}

.file
{
    font-family: mono;
    font-size: .8em;
}

.link
{
    text-decoration: none;

    color: var(--bilara-blue);
}

.link svg
{
    width: 1em;
    height: 1em;
}

.link::after
{
    content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAVklEQVR4Xn3PgQkAMQhDUXfqTu7kTtkpd5RA8AInfArtQ2iRXFWT2QedAfttj2FsPIOE1eCOlEuoWWjgzYaB/IkeGOrxXhqB+uA9Bfcm0lAZuh+YIeAD+cAqSz4kCMUAAAAASUVORK5CYII=);
}

.msg
{
    display: block;

    background-color: var(--bilara-secondary-background-color);
}

.heart
{
    color: var(--bilara-red);
}

      `
    ]

  }
  render(){
    return html`
    <div class="wrap">
    <section class="browse">
    <h2>Translate your little <span class="heart">💚</span> out, ${this._username}!</h2>
      ${ this._dataTree ? html`
        <nav-item _name="Total" ._tree="${this._dataTree}" ?open="${true}" class="total"></nav-item>
      ` : html`Loading...`}
    </section>

    <lion-dialog .config=${{ hidesOnEsc: true}}>
    <span slot="invoker" id="invoker">+</span>
    <!--<div class="foo" slot="content"><h1>This is a title</h1><p>And this is not</p></div>-->
    <bilara-dialog-publish slot="content" _path=${this._publishPath} _PRUrl=${this._PRUrl}></bilara-dialog-publish>

  </lion-dialog>
    
    ${this._renderProblems()}
    </div>
    `
  }

  _renderProblems(){
    if (!this._problems || this._problems.length == 0) return html``

    return html`
    
    <section class="problems">
    <hr>
    <p><span class="dontpanic"></span> Some errors occured while attempting to load the data and require human intervention. You can likely use
    Bilara without issue, except in relation to the files where errors occurred. These errors will almost always be caused by manual edits of JSON files.</p>
    <p>Every user of Bilara will see these errors and it is very likely that you did not introduce the 
    errors, that they will not effect your work, and you may disregard them and carry on with your work.</p>
    
    
    <div class="errors">
    ${repeat(this._problems, (entry) => {
        return html`<div class="error"><span class="file">${entry.file} <a class="link" href="${entry.href_root}${entry.file}"></a></span>  <span class="msg">${entry.msg}</span></div>`
      })
    }
    </div>
    </section>
    ` 
  }

  static get properties() { 
    return {
      _dataTree: {type: Object},
      _problems: {type: Array},
      _username: {type: String},
      _publishPath: String,
      _PRUrl: String
    }
  }

  firstUpdated() {
    store.dispatch(getBrowseData());
    store.dispatch(getProblems());
    this._invoker = this.shadowRoot.querySelector('#invoker');

    this.addEventListener('publish', this._handlePublish);
  }

  _handlePublish(e) {
    console.log(e, e.detail.path);
    e.stopPropagation();
    this._publishPath = e.detail.path;
    this._PRUrl = e.detail.PRUrl;
    this._invoker.click();
  }

  stateChanged(state) {
    this._dataTree = state.browse.tree;
    this._problems = state.app.problems;
    this._username = state.app.user.username;
  }
}

window.customElements.define('browse-view', BrowseView);