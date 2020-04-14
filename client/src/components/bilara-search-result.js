import {
    store
} from '../store.js';
import {
    connect
} from 'pwa-helpers/connect-mixin.js';
import {
    html,
    css
} from 'lit-element';
import {
    repeat
} from 'lit-html/directives/repeat';

import { formStyles } from './shared-styles';

import { highlightMatch } from '../util.js'

import { contentEditableValue } from '../util.js';

import { BilaraUpdatable } from './bilara-updatable.js';

export class BilaraSearchResult extends connect(store)(BilaraUpdatable) {
    static get styles(){
      return [
        formStyles,
        css`
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

        button {
          height: 24px;
          width: 10em;
        }
        .revert-button {
          color: var(--bilara-red);
          border: 1px solid var(--bilara-red);
          background-color: var(--bilara-primary-background-color);
        }
        .revert-button:hover {
          background-color: var(--bilara-red);
          color: var(--bilara-secondary-background-color);
        }
        .replace-button {
          color: var(--bilara-magenta);
          border: 1px solid var(--bilara-magenta);
          background-color: var(--bilara-primary-background-color);
        }
        .replace-button:hover {
          background-color: var(--bilara-magenta);
          color: var(--bilara-secondary-background-color);
        }
        .submit-button {
          color: var(--bilara-green);
          border: 1px solid var(--bilara-magenta);
          background-color: var(--bilara-primary-background-color);
        }
        .submit-button:hover {
          background-color: var(--bilara-green);
          color: var(--bilara-secondary-background-color);
        }
        `
      ]
    }
    static get properties() {
      /*
      source: {
        field: 'root-pli-ms',
        string: 'whatever',
        highlight: 'what',
        original: 'whatever'
      },
      target: {}
      */
        return {
            _segmentId: String,
            _target: Object,
            _source: Object,
            _replaced: Boolean,
            _mode: String
        }
    }

    getStatus(){
      return {
        error: html`<span class="status error" title="${this._error}">❌</span>`,
        modified: html`<span class="status modified" title="String not committed">⚠</span>`,
        pending: html`<span class="status pending" title="Pending">✓</span>`,
        committed: html`<span class="status committed" title="Committed">✓</span>`,
      }[this._status] || html`<span class="status"></span>`;
    }

    render() {
        const uid = /(.*):/.exec(this._segmentId)[1];
        return html `
            <form class="result" id="${this._segmentId}" @submit="${this._submitResult}">
            <div class="result-location">
            <a href="/translation/${uid}_${this._targetField}#${this._segmentId}" title="Go to ${this._segmentId}">${this._segmentId}.</a>
            ${{
              replace: html`<button type="button" class="replace-button" @click=${this._replace} title="Replace this term">Replace</button>`,
              revert: html`<button type="button" class="revert-button" @click=${this._revert} title="Revert this replace">Revert</button>`,
              submit: html`<button type="button" class="submit-button" @click=${this._submit} title="Submit this string">Submit</button>`
            }[this._mode]
            }
            
            </div>
            
            <div class="result-translation-text" contenteditable="${contentEditableValue}" @input=${this._input}></div>
            <div class="result-root-text"></div>
        </form>`
    }

    get translation() {
      return this.shadowRoot.querySelector('.result-translation-text');
    }

    get root() {
      return this.shadowRoot.querySelector('.result-root-text');
    }

    firstUpdated(){
      const target = this.translation,
            source = this.root;
      
      target.innerHTML = highlightMatch(this._target.string, this._target.highlight);
      source.innerHTML = highlightMatch(this._source.string, this._source.highlight);

      this._mode = 'replace';
    }

    _input(e) {
      const el = e.target;
      const text = el.innerText;
      if (text == this._originalString) {
        this._mode = 'replace';
      } else {
        this._mode = 'submit';
      }
    }

    _replace(e) {
      e.preventDefault();
      const el = this.shadowRoot.querySelector('.result-translation-text'),
            string = el.innerText;

      console.log(el, string);
      
      el.innerHTML = string.replace(RegExp(this._target.highlight, 'i'), `<mark>${this._target.replacement}</mark>`);
      this._mode = 'submit';
    }

    _submit(e) {
      console.log(e);
      e.preventDefault();
      this._mode = 'revert';

      const user = store.getState().app.user;   

      let data = {
        segmentId: this._segmentId,
        field: this._target.field,
        oldValue: this._target.original,
        value: this.translation.innerText,
        user: user.username
      }
    }

    _revert(e) {
      console.log(e);
      e.preventDefault();
      const el = this.shadowRoot.querySelector('.result-translation-text');
      el.innerHTML = this._target.original;
      this._mode = 'submit';
    }
}


window.customElements.define('bilara-search-result', BilaraSearchResult);