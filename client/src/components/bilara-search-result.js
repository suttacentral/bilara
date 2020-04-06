import {
    store
} from '../store.js';
import {
    connect
} from 'pwa-helpers/connect-mixin.js';
import {
    LitElement,
    html,
    css
} from 'lit-element';
import {
    repeat
} from 'lit-html/directives/repeat';

import { formStyles } from './shared-styles';


export class BilaraSearchResult extends connect(store)(LitElement) {
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
        `
      ]
    }
    static get properties() {
        return {
            _segmentId: String,
            _sourceField: String,
            _targetField: String,
            _sourceString: String,
            _replacementString: String,
            _originalString: String,
            _replaced: Boolean
        }
    }

    render() {
        return html `
            <form class="result" id="${this._segmentId}" @submit="${this._submitResult}">
            <div class="result-location">
            <a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a>
            ${this._replaced ? 
              html`<button type="button" class="revert-button" @click=${this._revert} title="Revert this replace">Revert</button>` :
              html`<button type="submit" class="replace-button" title="Replace this term">Replace</button>`
            }
            
            </div>
            
            <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
            <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
        </form>`
    }

    _submitResult(e) {
      console.log(e);
      e.preventDefault();
      this._replaced = true;
    }

    _revert(e) {
      console.log(e);
      e.preventDefault();
      this._replaced = false;
    }
}


window.customElements.define('bilara-search-result', BilaraSearchResult);