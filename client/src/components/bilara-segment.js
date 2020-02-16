import { LitElement, html } from 'lit-element';


import {updateSegment, focusSegment} from '../actions/segment.js';
import { fetchSuggestions } from '../actions/search.js';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { BilaraSuggestions } from './bilara-suggestions.js';

import { BilaraCell } from './bilara-cell.js';

export class BilaraSegment extends connect(store)(LitElement){
  render() {
    return html`
    <style>

      div {
        display: flex;
        margin-bottom: 5px;
        border-radius: 4px
      }
div:focus-within{
  background-color: var(--bilara-secondary-background-color);
  color: var(--bilara-empasized-text-color);
}
      .string {
        display: inline-flex;
        flex: 1;
        padding: 0 8px;
        hyphens: auto;
        white-space: prewrap;
      }
    
      .string[contenteditable="plaintext-only"]{
        font-family:"source serif pro"
      }

      .string.empty:after {
        content: "[ ]";
        opacity: 0.6;
      }

      .field-title {
        padding: 0.5em;
        font-size: 80%;
      }

    </style>
    ${ this.segmentId ? 
      html`<div class="row" id="${this.segmentId}">
      ${this._sortedFields.map(field => {
          const fieldData = this._fields[field],
                language = fieldData['language'];
          return html`
            <bilara-cell class="string"
              lang="${language ? language['uid'] : undefined}"
              segmentId="${this.segmentId}"
              field="${field}"
              ._editable="${fieldData['editable']}"
              ._value="${this._segment[field] || ''}"
              @focus="${this._focusEvent}"
            ></bilara-cell>`
        })
      }
      
      </div>
      ${ (this._isActive && this._suggestions) ? html`<bilara-suggestions ._suggestions=${this._suggestions}></bilara-suggestions>` : ''}
    ` : html `<div class="row" id="fields">${this._sortedFields.map(field => {
      return html`<span class="field-title">${field}</span>`
    })
  }</div>` }
    `
  }

  static get properties(){
    return {
      _isActive: Boolean,
      segmentId: String,
      _segment: { type: Object },
      _fields: { type: Object },
      _sourceField: String,
      _targetField: String,
      _sortedFields: String,
      _suggestions: {type: Object},
      _rootLang: String,
      _translationLang: String,
      _tertiaryLang: String
    }
  }

  constructor() {
    super()

  }

  firstUpdated(changedProperties) {
    this.addEventListener('suggest', (e) => {
      const suggestedString = e.detail.string;
      let cell = this.shadowRoot.querySelector(`bilara-cell[field=${this._targetField}`);

      cell._suggestValue(suggestedString);

    });

    this.addEventListener('navigation-event', (e) => {
      this.navigate(e.detail.steps, e.detail.field)
    })

  }

  updated(changedProperties) {
    if (changedProperties.get('_pushState')) {
      this._dirty = false;
    }
  }

  navigate(steps, field) {
    let segment = this;
    while (steps > 0) {
      segment = segment.nextElementSibling;
      steps -= 1;
    }
    while (steps < 0) {
      segment = segment.previousElementSibling;
      steps += 1;
    }

    if (segment != this) {
      segment.setFocus(field);
    }

  }

  setFocus(field) {
    let cell = this.shadowRoot.querySelector(`[field=${field}]`);
    if (cell) {
      cell.focus();
    }
  }

  _focusEvent(e) {
    const segmentId = this.segmentId;
    store.dispatch(focusSegment(segmentId));

    this.fetchSuggestions();
    let nextSibling = this.nextElementSibling;
    if (nextSibling) {
      nextSibling.fetchSuggestions();
    }
  }



  fetchSuggestions(){
    if (this._suggestions)  return

    const sourceString = this._segment[this._sourceField],
          rootLang = this._fields[this._sourceField].language.uid,
          targetLang = this._fields[this._targetField].language.uid,
          segmentId = this.segmentId;
      
      let request = fetch(`/api/tm/?string=${sourceString}&root_lang=${rootLang}&translation_lang=${targetLang}&exclude_uid=${segmentId}`, {mode: 'cors'})
          .then(res => res.json())
          .then(data => {
              this._suggestions = data;
          }).catch( (e) => {console.log(e)});
  }

}

window.customElements.define('bilara-segment', BilaraSegment);