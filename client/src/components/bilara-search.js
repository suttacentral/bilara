import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { LitElement, html, css } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';

import './bilara-search-result.js'
export class BilaraSearch extends connect(store)(LitElement) {

  static get properties(){
    return {
      _sourceField: String,
      _targetField: String,
      _results: Array
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
    this._results = [{
      segmentId: 'mn23:43.1',
      replaced: null
    }];
  }

  _renderForm(){
    return html`
    <form>
      <label class="check-label" for="radio-thisproject">
        <input type="radio" id="radio-thisproject" name="scope" checked>
        This project
      </label>
      <label class="check-label" for="radio-all">
        <input type="radio" id="radio-all" name="scope">
        All
      </label>
      <label class="search-label" for="find-translation">Find in translation
        <input type="search" id="find-translation" name="find-translation" placeholder="recited">
      </label>
      <label class="search-label" for="find-root">Find in root
        <input type="search" id="find-root" name="find-root" placeholder="gāthāy">
        </label>
      <label class="search-label" for="replace">Replace in translation
        <input type="search" id="replace" name="replace" placeholder="shouted">
      </label>
      <label class="search-label" for="uid-filter">UID filter
        <input type="search" id="uid-filter" name="uid-filter" placeholder="dn*">
      </label>
      <div class="button-row">
      <span>
      <button type="button" class="find-button" title="search for the specified term">Find</button>
      </span>
      <span>
        <button type="button" class="undo-button" title="Clear the search fields">Clear</button>
      </span>
      </div>
      <input type="checkbox" id="match-caps" name="match-caps" checked>
        <label class="check-label" for="match-caps">Match caps</label>
      </form>
    `
  }

  _renderDetails(){
    return html`
  <details>
        <summary>How to use search</summary>
        <dl>
        <dt>Scope</dt>
        <dd>You can search either in your own translation project, or across the whole of Bilara. However, you can only replace text in your own project.</dd>
        <dt>Find</dt>
        <dd>Returns exact string match first. If you have one or more spaces, it returns entries with all strings first. <br><kbd>↵ Enter</kbd></dd>
    <dt>Find in root</dt>
    <dd>If you search both translation and root, it will return segments that contain both. Does not alias diacriticals. You cannot replace in root. <br><kbd>↵ Enter</kbd></dd>
    <dt>Replace</dt>
    <dd>Replace the find term with the replace term in the chosen result. You cannot replace all. When you replace, the relevant item will disappear. <br><kbd>Ctrl</kbd> + <kbd>↵ Enter</kbd></dd>
    <dt>Match caps</dt>
    <dd>If the find term starts with a capital letter, so will the replace term. Uncheck to insert the exact replace term.</dd>
    <dt>Undo</dt>
    <dd>Undo replaced terms one at a time. The undone items will reappear.<br><kbd>Ctrl</kbd> + <kbd>Z</kbd></dd>
    </dl>
        </details>
        `
  }

  _submitResult(e) {
    console.log(e);
    console.log(e.target);
    e.preventDefault();

    e.target.classList.add("replaced");
  }

  _renderResults() {
    return html`
      <section id="results">
      ${repeat(this._results, (r) => JSON.stringify([r.segmentId, r.replaced]), (result, i) => 
        html`<bilara-search-result></bilara-search-result>`
      )}
      </section>
      `
  }

  static get styles() {
    return css`
      #translation {
        margin-bottom: 72px;
      }
      #search {
        background-color: var(--bilara-secondary-background-color);
        min-width: 200px;
        max-width: 400px;
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
      form {
        padding: 0 8px 16px;
        display: block
      }

      .replace-button, .undo-button {
        display: none;
      }

      form.replaced .undo-button {
        display: inline-block;
      }

      form:not(.replaced) .replace-button {
        display: inline-block;
      }
      input[type="search"] {
        border: 1px solid var(--bilara-red);
        border-radius: 2px;
        padding: 4px 8px;
        width: 100%;

      }
      input::placeholder {
        opacity: 0.5;
      }
      input:focus::placeholder {
        opacity: 0;
      }
      label {
        font-size: 80%;
        margin-top: 8px;
        margin-right: 16px;
        display: inline-block;
       
      }
      .search-label{
      	display: block;
      	 width: 100%;
      }
      .button-row {
        display: flex;
        justify-content: space-between
      }
      button {
        display: inline-block;
        color: var(--bilara-secondary-color);
        font-weight: 600;
        font-size: 0.8rem;
        padding: 4px 8px;
        border: 1px solid var(--bilara-secondary-color);
        border-radius: 8px;
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: .05em;
        background-color: var(--bilara-primary-background-color);
        white-space: nowrap;
        line-height: 1;
      }
      form button {
        margin: 16px 4px 0px 0px;
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
      .undo-button {
        color: var(--bilara-red);
        border: 1px solid var(--bilara-red);
        background-color: var(--bilara-primary-background-color);
      }
      .undo-button:hover {
        background-color: var(--bilara-red);
        color: var(--bilara-secondary-background-color);
      }
      .replace-button {
        margin-left: 4px;
        height: 24px;
        color: var(--bilara-magenta);
        border: 1px solid var(--bilara-magenta);
        background-color: var(--bilara-primary-background-color);
      }
      .replace-button:hover {
        background-color: var(--bilara-magenta);
        color: var(--bilara-secondary-background-color);
      }
      
      #results {
        margin: 0;
        color: var(--bilara-emphasized-text-color)
      }
      .result {
        margin: 0;
        box-sizing: border-box
      }
      .result-location {
        line-height: 1;
        border-top: 2px solid var(--bilara-tertiary-background-color);
        padding: 4px 8px 4px;
        margin: 16px 0 8px;
        display: flex;
        justify-content: space-between
      }
      .result-location a {
        font-size: 80%;
        font-weight: 600;
        color: var(--bilara-secondary-text-color);
        text-decoration: none;
        margin-right: 4px;
      }
      .result-location a:hover {
        color: var(--bilara-red);
        text-decoration: underline;
        text-decoration-color: var(--bilara-red)
      }
      .result-translation-text {
        padding: 0 8px;
        font-size: 0.9em
      }
      .result-root-text {
        font-style: italic;
        padding: 0 8px;
          font-size: 0.9em
      }
      mark{
        background-color: var(--bilara-yellow);
        color: var(--bilara-empasized-text-color);
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
      `
  }
}

window.customElements.define('bilara-search', BilaraSearch);
