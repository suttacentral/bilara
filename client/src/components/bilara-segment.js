import { LitElement, html } from 'lit-element';


import {updateSegment, focusSegment} from '../actions/segment.js';
import { fetchSuggestions } from '../actions/search.js';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { BilaraSuggestions } from './bilara-suggestions.js';

import { BilaraCell } from './bilara-cell.js';

function createRange(node, chars, range) {
  if (!range) {
      range = document.createRange()
      range.selectNode(node);
      range.setStart(node, 0);
  }

  if (chars.count === 0) {
      range.setEnd(node, chars.count);
  } else if (node && chars.count >0) {
      if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.length < chars.count) {
              chars.count -= node.textContent.length;
          } else {
               range.setEnd(node, chars.count);
               chars.count = 0;
          }
      } else {
          for (let lp = 0; lp < node.childNodes.length; lp++) {
              range = createRange(node.childNodes[lp], chars, range);

              if (chars.count === 0) {
                 break;
              }
          }
      }
 } 

 return range;
};



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
    ${ this._segmentId ? 
      html`<div class="row" id="${this._segmentId}">
      ${this._sortedFields.map(field => {
          const fieldData = this._fields[field],
                language = fieldData['language'];
          return html`
            <bilara-cell class="string"
              lang="${language ? language['uid'] : undefined}"
              _segmentId="${this._segmentId}"
              _field="${field}"
              _editable="${fieldData['editable']}"
              _value="${this._segment[field] || ''}"
              @focus="${this._focusEvent}"
            ></bilara-cell>`
        })
      }
      
      ${this.getPushState()}
      </div>
      ${ this._suggestions ? html`<bilara-suggestions ._suggestions=${this._suggestions}></bilara-suggestions>` : ''}
    ` : html `<div class="row" id="fields">${this._sortedFields.map(field => {
      return html`<span class="field-title">${field}</span>`
    })
  }</div>` }
    `
  }

  
  /*

    <span contenteditable="false"
        data-type="root"
        class="string${this._rootString === false ? ' empty' : ''}"
        lang="${this._rootLang}"
      ></span>
    ${this._tertiaryString ? html`
    <span contenteditable="false"
      data-type="tertiary"
      class="string"
      lang="${this._tertiaryLang}">${this._tertiaryString}</span>
    `: html``}
    <span contenteditable="plaintext-only"
        data-type="translation"
        class="string"
        lang="${this._translationLang}"
        @blur="${this._blurEvent}"
        @keypress="${this._keypressEvent}"
        @focus="${this._focusEvent}"
    ></span>
  */

  static get properties(){
    return {
      _isActive: Boolean,
      _segmentId: String,
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

  getPushState() {
    if (this._dirty) return html`<span class="status modified" title="Not Committed">⚠</span>`;
    switch(this._pushState) {
      case 'pending':
        return html`<span class="status pending" title="Pending">✓</span>`;
      case 'finalized':
        return html`<span class="status finalized" title="Finalized">✓</span>`;        
    }
    return html`<span class="status unmodified"></span>`;
  }

  setFocus(dataType) {
    let el = this.shadowRoot.querySelector(`[data-type=${dataType}]`);
    el.focus();
    setTimeout(()=>{   
      for (let node of Array.from(el.childNodes).reverse()) {
        if (node.type == 3) {
          let sel = el.getRootNode().getSelection();
          sel.collapse(node, 10);
      }
    }
    }, 20)
  }

  constructor() {
    super()
    this.addEventListener('suggest', (e) => {
      let translation = this.shadowRoot.querySelector('[data-type=translation]');
      translation.innerText = e.detail.string;
      this._dirty = false;
      this._suggestedString = e.detail.string;
      this.setFocus('translation');
    });
  }

  updated(changedProperties) {
    if (changedProperties.get('_pushState')) {
      this._dirty = false;
    }
  }

  _focusEvent(e) {
    const segmentId = this._segmentId;
    store.dispatch(focusSegment(segmentId));

    this.fetchSuggestions();
    let nextSibling = this.nextElementSibling;
    if (nextSibling) {
      nextSibling.fetchSuggestions();
    }
  }

  fetchSuggestions(){
    const sourceString = this._segment[this._sourceField],
          targetString = this._segment[this._targetField],
          rootLang = this._fields[this._sourceField].language.uid,
          targetLang = this._fields[this._targetField].language.uid,
          segmentId = this._segmentId;

    store.dispatch(fetchSuggestions(sourceString, rootLang, targetString, targetLang, segmentId));
  }

}

window.customElements.define('bilara-segment', BilaraSegment);