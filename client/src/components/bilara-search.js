import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import { formStyles } from './shared-styles.js';

import { formToJSON } from '../form.js';

import { updateReplace } from '../actions/search.js';

import './bilara-search-result.js'

const DRAG_BORDER_SIZE = 4;
const SEARCH_MIN_WIDTH = 200;
const SEARCH_MAX_WIDTH = 400;


function addDragBorder(element) {

  let m_pos;

  function resize(e) {
    e.preventDefault();
    const dx = m_pos - e.x;
    m_pos = e.x;

    let newWidth = (parseInt(getComputedStyle(element, '').width)  + dx);
    console.log(newWidth);
    newWidth = Math.min(newWidth, SEARCH_MAX_WIDTH);
    newWidth = Math.max(newWidth, SEARCH_MIN_WIDTH);
    localStorage.setItem('search.savedWidth', newWidth);
    element.style.width = newWidth + "px";
    
  }

  element.addEventListener("mousedown", (e) => {
    if (e.offsetX < DRAG_BORDER_SIZE) {
      m_pos = e.x;
      document.addEventListener("mousemove", resize, false);
      document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", resize, false);
        console.log('Removed Event Listener');
      }, false);
    }
  })
}

export class BilaraSearch extends connect(store)(LitElement) {
  static get styles() {
    return [
      formStyles,
      css`
      #search {
        padding-left: ${DRAG_BORDER_SIZE}px;
      }

      #search:after {
        content: " ";
          position: absolute;
        left: 0;
        top: 0;
        width: ${DRAG_BORDER_SIZE}px;
        height: 100%;
        cursor: col-resize;        
      }

      #search {
        background-color: var(--bilara-secondary-background-color);
        min-width: ${SEARCH_MIN_WIDTH}px;
        max-width: ${SEARCH_MAX_WIDTH}px;
        margin: 0 0 0 8px;
        position: sticky;
        padding: 0 0 24px 0;
        align-self: flex-start;
        top: 44px;
        overflow-y: auto;
        height: 100vh;
        -webkit-overflow-scrolling: touch;
        -ms-overflow-style: -ms-autohiding-scrollbar;
        scrollbar-width: var(--scrollbar-width);
        scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
      }
      #search::-webkit-scrollbar {
        height: var(--scrollbar-size);
        width: var(--scrollbar-size);
      }
      #search::-webkit-scrollbar-track {
        background-color: var(--scrollbar-track-color);
      }
      #search::-webkit-scrollbar-thumb {
        background-color: var(--scrollbar-color);
        /* Add :hover, :active as needed */
      }
      #search::-webkit-scrollbar-thumb:vertical {  } 
        min-height: var(--scrollbar-minlength);
      }
      #search::-webkit-scrollbar-thumb:horizontal {
        min-width: var(--scrollbar-minlength);
      }

      #results {
        margin: 0;
        color: var(--bilara-emphasized-text-color)
      }

      .total {
        margin: 0px 16px;
        padding 16px 4px;
        text-align: center;
        background-color: var(--bilara-primary-background-color);
        border-radius: 5px;
      }
      
      details {
        padding: 4px 8px;
        margin-bottom: 16px;
        font-size: 12px;
        color: var(--bilara-emphasized-text-color);
        max-width: fit-content;
      }
      summary {
        font-weight: 600;
        color: var(--bilara-secondary-text-color);
      }
      dt {
        font-weight: 600;
        margin-top: 8px
      }
      dd{
      	margin: 0
      }
      kbd {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        padding: 4px 8px;
        border-radius: 4px;
        background-color: var(--bilara-secondary-text-color);
        color: var(--bilara-secondary-background-color);
        font-size: 9px
      }

      .find-button {
        color: var(--bilara-green);
        border: 1px solid var(--bilara-green);
        background-color: var(--bilara-primary-background-color);
      }
      .find-button:hover {
        background-color: var(--bilara-green);
        color: var(--bilara-secondary-background-color);
      }
      `]
  }
  
  static get properties(){
    return {
      _sourceField: String,
      _targetField: String,
      _extraFindFields: Array,
      _results: Array,
      _time: Number,
      _count: Number
    }
  }

  
  
  render(){
    return html`
      <section id ="search">
        ${this._renderDetails()}
        ${this._renderForm()}   
        ${this._renderResults()}     
        </section>
        </div>
    `
  }

  constructor() {
    super();
    this._results = null;
    
  }

  firstUpdated(changedProperties){
    const search = this.shadowRoot.querySelector('#search');
    const savedWidth = localStorage.getItem('search.savedWidth');
    addDragBorder(search);
    if (savedWidth) {
      search.style.width = savedWidth + 'px';
    }
  }

  _renderForm(){
    return html`
    <form @submit=${this._submit}>
      <input type="hidden" name="source-field" value="${this._sourceField}">
      <input type="hidden" name="target-field" value="${this._targetField}">
      ${ this._extraFindFields ? 
        html`<input type="hidden" name="extra-fields" value="${this._extraFindFields.join(',')}">`
        : null
      }
      
      <label class="check-label">
        <input type="radio" value="project" name="scope" checked disabled>
        This project
      </label>
      <label class="check-label">
        <input type="radio" value="all" name="scope" disabled>
        All
      </label>
      <label class="search-label">
        Find in ${this._targetField}
        <input type="search" data-field="${this._targetField}" placeholder="recited">
      </label>
      <label class="search-label" >Replacement
        <input type="search" name="replace" placeholder="shouted" @keyup=${this._updateReplaceValue}>
      </label>
      <label class="search-label">
        Find in ${this._sourceField}
        <input type="search" data-field="${this._sourceField}" placeholder="gāthāy">
      </label>
      ${repeat(this._extraFindFields, (field) => {
        return html`
        <label class="search-tertiary">
          Find in ${field}
          <input type="search" data-field="${field}">
        </label>        
        `
      })}

      <label class="search-label">
        UID filter
        <input type="search" name="uid-filter" placeholder="dn%">
      </label>
      <div class="button-row">
      <span>
      <button type="submit" class="find-button" title="search for the specified term">Find</button>
      </span>
      <span>
        <button type="button" class="undo-button" @click="${this._clear}" title="Clear the search fields">Clear</button>
      </span>
      </div>
      <label class="check-label" style="display: none">
        <input type="checkbox" name="flags" value="match-caps" disabled="disabled">
        Match caps
      </label>
      </form>
    `
  }

  _renderDetails(){
    return html`
  <details>
        <summary>How to use search</summary>
        <dl>
        <dt>Scope (WIP)</dt>
        <dd>You can search either in your own translation project, or across the whole of Bilara. However, you can only replace text in your own project.</dd>
        <dt>Find</dt>
        <dd>Returns exact string match first. If you have one or more spaces, it returns entries with all strings first. <br><kbd>↵ Enter</kbd></dd>
    <dt>Find in root</dt>
    <dd>If you search both translation and root, it will return segments that contain both. Does not alias diacriticals. You cannot replace in root. <br><kbd>↵ Enter</kbd></dd>
    <dt>Replace</dt>
    <dd>Replace the find term with the replace term in the chosen result. You cannot replace all. When you replace, the relevant item will disappear. <br><kbd>Ctrl</kbd> + <kbd>↵ Enter</kbd></dd>
    <dt>UID Filer</dt>
    <dd>Only return results where the text UID matches the filter. '%' will match anything and '_' will match a single character. <br>If no '%' is included in the filter matches exactly that Sutta UID.</dd>"
    <dt>Match caps (WIP)</dt>
    <dd>If the find term starts with a capital letter, so will the replace term. Uncheck to insert the exact replace term.</dd>
    <dt>Undo</dt>
    <dd>Undo replaced terms one at a time. The undone items will reappear.<br><kbd>Ctrl</kbd> + <kbd>Z</kbd></dd>
    </dl>
        </details>
        `
  }

  _updateReplaceValue(e) {
    console.log(e.target.value);
    store.dispatch(updateReplace(e.target.value));
  }

  async _submit(e) {
    e.preventDefault();
    const data = formToJSON(e.target),
          state = store.getState(),
          user = state.app.user;

    const response = await fetch('/api/search/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "X-Bilara-Auth-Token": user.authToken,
        "X-Bilara-Username": user.username
      },
      body: JSON.stringify(data)
    });

    const responseData = await response.json();

    this._results = {results: responseData.results, query: data}
    this._time = responseData.time
    this._total = responseData.total

    
    console.log(response);
    console.log(responseData);
  }

  get form() {
    return this.shadowRoot.querySelector('form');
  }

  _clear(e) {
    console.log(e);
    for (let ele of this.form) {
      if (ele.type != 'hidden') {
        ele.value = null;
      }
    }
    this._results = null;
  }

  _renderResults() {
    if (!this._results) {
      return html``
    }
    const results = this._results.results,
          query = this._results.query;
    return html`
      <section id="results">
      <div class="total">${this._total} results.</div>
      ${repeat(results, (r) => JSON.stringify(r), (result, i) => {
        const sourceField = this._sourceField,
              targetField = this._targetField,
              sourceString = result.segments[sourceField].string,
              targetString = result.segments[targetField].string,
              targetPermission = result.segments[targetField].permission;
        return html`<bilara-search-result
                      ._segmentId=${result.segment_id}
                      ._source=${ {
                        field: sourceField,
                        string: sourceString,
                        original: sourceString,
                        highlight: query[sourceField]
                      } }
                      ._target=${ {
                        field: targetField,
                        string: targetString,
                        replacement: query.replace,
                        original: targetString,
                        highlight: query[targetField],
                        permission: targetPermission
                      } }
                      ._segments=${result.segments}
                      >
          </bilara-search-result>`
      }
        
      )}
      </section>
      `
  }
}

window.customElements.define('bilara-search', BilaraSearch);
