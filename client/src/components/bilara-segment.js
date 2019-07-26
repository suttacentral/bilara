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
div:hover{
  background-color: var(--sc-secondary-background-color)
}
div:focus-within{
  background-color: var(--sc-secondary-background-color);
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

    </style>
    
    <div id="${this._segmentId}">
    <span contenteditable="false"
        data-type="root"
        class="string"
        lang="${this._rootLang}"
      >${this._rootString}</span>
    <span contenteditable="plaintext-only"
        data-type="target"
        class="string ${this._dirtyState}"
        lang="${this._targetLang}"
        @blur="${this._inputEvent}"
        @keypress="${this._keypressEvent}"
        @focus="${this._focusEvent}"
    >${this._targetString}</span>
    ${this.getDirtyState()}
    </div>
    ${ this._suggestions ? html`<bilara-suggestions ._suggestions=${this._suggestions}></bilara-suggestions>` : ''}
    
    `
  }

  static get properties(){
    return {
      _isActive: Boolean,
      _segmentId: String,
      _rootString: String,
      _targetString: String,
      _rootFilepath: String,
      _targetFilepath: String,
      _suggestions: {type: Object},
      _rootLang: String,
      _targetLang: String,
      _suggestedString: String,
      _dirtyState: String,
      _committedString: String,
    }
  }

  getDirtyState() {
    switch(this._dirtyState) {
      case 'unmodified': 
      return html`<span class="status unmodified"></span>`;
    case 'modified':
      return html`<span class="status modified" title="Not Committed">⚠</span>`;
    case 'committed':
      return html`<span class="status committed" title="Committed">✓</span>`;
    default:
      return ''
    }
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
      let target = this.shadowRoot.querySelector('[data-type=target]');
      target.innerText = e.detail.string;
      this._dirtyState = 'modified';
      this._suggestedString = e.detail.string;
      this.setFocus('target');
    });
  }

  firstUpdated() {
    this._dirtyState = 'unmodified';
    this._committedString = this._targetString;
  }

  updated(changedProperties) {
    if (!this._isActive) return

    console.log('Changed Properties: ', changedProperties)

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
    store.dispatch(fetchSuggestions(this._rootString, this._rootLang, this._targetLang, this._segmentId))
  }

  _inputEvent(e){
    console.log(this, this.commitedString, e.currentTarget.textContent);
    if (this._committedString != e.currentTarget.textContent) {
      this._dirtyState = 'modified';
    }
 
  }

  _keypressEvent(e) {
    if (e.key == 'Enter') {
      console.log('Submitting')
      e.preventDefault();
      e.stopPropagation();

      const segmentId = this._segmentId,
      value = e.currentTarget.textContent,
      dataType = e.currentTarget.dataset.type,
      filepath = dataType == 'root' ? this._rootFilePath : this._targetFilepath,
      hasChanged = dataType == 'root' ? this._rootString != value : (this._targetString != value || this._suggestedString);

      if (hasChanged) {
        this._dirtyState = 'committed';
        this._committedString = value;
        store.dispatch(updateSegment(filepath, segmentId, dataType, value));
      } else {
        console.log('No change');
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