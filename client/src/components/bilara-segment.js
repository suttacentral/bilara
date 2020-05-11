import { LitElement, html } from 'lit-element';
import { focusSegment } from '../actions/segment.js';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { ColumnStyles } from '../styles/columns.js';
import './bilara-cell.js';
import './bilara-matches.js';

export class BilaraSegment extends connect(store)(LitElement){
  render() {
    return html`
    ${ColumnStyles}
    <style>
div.row {
  display: flex;
  justify-content: space-around;
  border-radius: 2px;
}
div:focus-within {
  background-color: var(--bilara-secondary-background-color);
  color: var(--bilara-emphasized-text-color);
  font-weight: 450
}
/* For some reason, the outline appears on empty segments unless this is included.*/
bilara-cell {
  outline: 0px solid transparent;
}
bilara-cell.string {
  padding: 0 8px;
  max-width: 40rem;
  margin: 0 16px;
}

    </style>
    
    ${ this.segmentId ? 
      html`<div class="row" id="${this.segmentId}">
      ${this._orderedFields.map(field => {
          const fieldData = this._fields[field],
                language = fieldData['language'],
                editable = fieldData.permission == 'EDIT';
          return html`
            <bilara-cell class="string"
              lang="${language ? language['uid'] : undefined}"
              segmentId="${this.segmentId}"
              field="${field}"
              ._editable="${ editable }"
              ._value="${this._segment[field] || ''}"
              @focus="${this._focusEvent}"
            ></bilara-cell>`
        })
      }

      </div>
      ${this.renderMatches()}
      
    ` : html `<div class="row" id="fields">${this._orderedFields.map(field => {
      return html`<span class="field-title">${field}</span>`
    })
  }</div>` }
    `
  }

  renderMatches() {
    return (this._isActive && this._matches) ? html`<bilara-matches ._matches=${this._matches}></bilara-matches>` : '';
  }

  static get properties(){
    return {
      _isActive: Boolean,
      segmentId: String,
      _segment: { type: Object },
      _fields: { type: Object },
      _sourceField: String,
      _targetField: String,
      _orderedFields: {type: Array, hasChanged (newVal, oldVal) {return true} },
      _matches: {type: Object},
      _rootLang: String,
      _translationLang: String,
      _tertiaryLang: String
    }
  }

  constructor() {
    super()

  }

  firstUpdated(changedProperties) {
    this.addEventListener('match', (e) => {
      const matchedString = e.detail.string;
      let cell = this.shadowRoot.querySelector(`bilara-cell[field=${this._targetField}`);

      cell._matchValue(matchedString);

    });

    this.addEventListener('navigation-event', (e) => {
      this.navigate(e.detail.steps, e.detail.field)
    })

  }

  updated(changedProperties) {

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

    if (segment && segment != this) {
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

    this.fetchmatches();
    let nextSibling = this.nextElementSibling;
    if (nextSibling) {
      nextSibling.fetchmatches();
    }
  }



  fetchmatches(){
    if (this._matches)  return

    const sourceString = this._segment[this._sourceField],
          rootLang = this._fields[this._sourceField].language.uid,
          targetLang = this._fields[this._targetField].language.uid,
          segmentId = this.segmentId;
      
      let request = fetch(`/api/tm/?string=${sourceString}&root_lang=${rootLang}&translation_lang=${targetLang}&exclude_uid=${segmentId}`, {mode: 'cors'})
          .then(res => res.json())
          .then(data => {
              this._matches = data;
          }).catch( (e) => {console.log(e)});
  }

}

window.customElements.define('bilara-segment', BilaraSegment);