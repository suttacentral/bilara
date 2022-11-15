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
} from 'lit-html/directives/repeat.js';

import { formStyles } from './shared-styles';

import { highlightMatch } from '../util.js'

import { contentEditableValue } from '../util.js';

import { BilaraUpdatable } from './bilara-updatable.js';

export class BilaraSearchResult extends BilaraUpdatable {
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

        .status-wrapper {
          position: relative;
        }
        
        .status {
          font-size: 12px;
          color: white;
          height: 16px;
          line-height: 16px;
          width: 16px;
          text-align: center;
          border-radius: 50%;
          position: absolute;
          right: -5px;
          bottom: 0;
          display: none
        }
        .status.pending {
          display: inline-block;
          background-color: rgb(125, 125, 125);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        }
        .status.committed {
          display: inline-block;
          background-color: green;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        }
        .status.modified {
          display: inline-block;
          background-color: var(--bilara-magenta);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        }
        :focus + .status.modified {
            display: none;
        }
        .status.error {
          display: inline-block;
          background-color: var(--bilara-red);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        }
        `
      ]
    }
    static get properties() {
        return {
            _segmentId: String,
            _target: Object,
            _source: Object,
            _segments: Object,
            _replacement: String,
            _replaced: Boolean,
            _mode: String
        }
    }


    render() {
        const uid = /(.*):/.exec(this._segmentId)[1];
        return html `
            <form class="result" id="${this._segmentId}" @submit="${this._submitResult}">
            <div class="result-location">
            <a href="/translation/${uid}_${this._target.field}#${this._segmentId}" title="Go to ${this._segmentId}">${this._segmentId}.</a>
            ${{
              replace: html`<button type="button" class="replace-button" @click=${this._replace} title="Replace this term">Replace</button>`,
              revert: html`<button type="button" class="revert-button" @click=${this._revert} title="Revert this replace">Revert</button>`,
              submit: html`<button type="button" class="submit-button" @click=${this._submit} title="Submit this string">Submit</button>`,
              noReplace: html``
            }[this._mode]
            }
            </div>
            <div class="status-wrapper">
            <div class="result-translation-text" contenteditable="${contentEditableValue}" @input=${this._input} @keydown=${this._keydownEvent}></div>
            ${this.renderStatus()}
            </div>
            <div class="result-root-text"></div>
            ${repeat(Object.keys(this._segments), (field, i) => {
              const segment = this._segments[field];
              if (field != this._target.field && field != this._source.field) {
                return html`<div class="result-tertiary-text">${segment.string}</div>`
              }
              return html``
            })}
            
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
      this._updateStatusValue(this._target.string);
    }

    stateChanged(state) {
      this._replaceValue = state.search.search.replaceValue;
      this._mode = typeof(this._replaceValue) == 'string' ? 'replace' : 'noReplace';
    }

    _input(e) {
      const el = e.target;
      const text = el.innerText;
      if (text == this._originalString) {
        this._mode = 'replace';
      } else {
        this._mode = 'submit';
      }
      this._updateStatusValue(text, this._segmentId);
    }

    _replace(e) {
      e.preventDefault();
      const el = this.shadowRoot.querySelector('.result-translation-text'),
            string = el.innerText,
            replacement = this._replaceValue,
            newString = string.replace(RegExp(this._target.highlight, 'i'), `<mark>${this._target.replacement}</mark>`);

      console.log(el, this._target.highlight, string, newString);
      
      el.innerHTML = newString;
      this._updateStatusValue(newString, this._segmentId);
      this._mode = 'submit';
    }

    _submit(e) {
      console.log(e);
      e.preventDefault();
      this._mode = 'revert';
      
      this._commitValue(this.translation.innerText, this._segmentId, this._target.field);
    }

    _revert(e) {
      console.log(e);
      e.preventDefault();
      const el = this.shadowRoot.querySelector('.result-translation-text');
      el.innerHTML = this._target.original;
      this._updateStatusValue(this._target.original, this._segmentId);
      this._mode = 'submit';
    }


    _keydownEvent(e) {
      if (e.key == 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this._submit(e);
    }
  }
}


window.customElements.define('bilara-search-result', BilaraSearchResult);