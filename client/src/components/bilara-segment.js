import { LitElement, html } from 'lit-element';


import {updateSegment, focusSegment} from '../actions/segment.js';
import { fetchSuggestions } from '../actions/search.js';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { BilaraSuggestions } from './bilara-suggestions.js';


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

      .status{
        font-size: 12px;
        color: white;
        height: 1.2em;
        line-height: 1.2em;
        width: 1.2em;
        margin-right: -1.2em;
        text-align: center;
        border-radius: 50%;
        
      }
     .status.pending{
        background-color: rgb(125,125,125);
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);        
      }
      .status.finalized{
          background-color: green;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
      }
      .status.modified{
        background-color:var(--bilara-red);
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
      }

    </style>
    
    <div id="${this._segmentId}">
    <span contenteditable="false"
        data-type="root"
        class="string"
        lang="${this._rootLang}"
      >${this._rootString}</span>
    <span contenteditable="plaintext-only"
        data-type="translation"
        class="string"
        lang="${this._translationLang}"
        @blur="${this._inputEvent}"
        @keypress="${this._keypressEvent}"
        @focus="${this._focusEvent}"
    >${this._translationString}</span>
    ${this.getPushState()}
    </div>
    ${ this._suggestions ? html`<bilara-suggestions ._suggestions=${this._suggestions}></bilara-suggestions>` : ''}
    
    `
  }

  static get properties(){
    return {
      _isActive: Boolean,
      _segmentId: String,
      _rootString: String,
      _translationString: String,
      _rootFilepath: String,
      _translationFilepath: String,
      _suggestions: {type: Object},
      _rootLang: String,
      _translationLang: String,
      _suggestedString: String,
      _committedString: String,
      _pushState: {type: String},
      _dirty: {type: Boolean}
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

  firstUpdated() {
    this._committedString = this._translationString;
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
    store.dispatch(fetchSuggestions(this._rootString, this._rootLang, this._translationLang, this._segmentId))
  }

  _inputEvent(e){
    if (this._translationString != e.currentTarget.textContent) {
      this._dirty = true;
    }
  }

  _keypressEvent(e) {
    if (e.key == 'Enter') {
      this._dirty = false;
      e.preventDefault();
      e.stopPropagation();

      const segmentId = this._segmentId,
      value = e.currentTarget.textContent,
      dataType = e.currentTarget.dataset.type,
      filepath = dataType == 'root' ? this._rootFilePath : this._translationFilepath,
      hasChanged = dataType == 'root' ? this._rootString != value : (this._translationString != value || this._suggestedString);
      
      if (hasChanged) {
        this._committedString = value;
        this._translationString = value;
        store.dispatch(updateSegment(filepath, segmentId, dataType, value));
      } else {

      }

      this.blur();
      let nextSegment = this.nextElementSibling;
      if (nextSegment) {
        nextSegment.setFocus(e.path[0].getAttribute('data-type'));
      }
    }
  }
}

window.customElements.define('bilara-segment', BilaraSegment);