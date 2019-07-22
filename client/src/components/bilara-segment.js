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
      }

      .string {
        display: inline-flex;
        flex: 1;
        padding: 0 8px;
        hyphens: auto;
      }
      .string[contenteditable="true"]{
        font-family:"source serif pro"
      }

    </style>
    
    <div id="${this._segmentId}">
    <span contenteditable="false"
        data-type="root"
        class="string"
        lang="${this._rootLang}"
      >${this._rootString}</span>
    <span contenteditable="true"
        data-type="target"
        class="string"
        lang="${this._targetLang}"
        @blur="${this._inputEvent}"
        @keypress="${this._keypressEvent}"
        @focus="${this._focusEvent}"
    >${this._targetString}</span>
    
   
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
      _targetLang: String
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
      this._targetString = e.detail.string;
      this.setFocus('target');
    });
    
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
    const segmentId = this._segmentId,
          value = e.currentTarget.textContent,
          dataType = e.currentTarget.dataset.type,
          filepath = dataType == 'root' ? this._rootFilePath : this._targetFilepath,
          hasChanged = dataType == 'root' ? this._rootString != value : this._targetString != value;
    
    if (hasChanged) {
      store.dispatch(updateSegment(filepath, segmentId, dataType, value));
    }
  }

  _keypressEvent(e) {
    if (e.key == 'Enter') {
      e.preventDefault();
      this.blur();
      let nextSegment = this.nextElementSibling;
      if (nextSegment) {
        nextSegment.setFocus(e.path[0].getAttribute('data-type'));
      }
    }
  }
}

window.customElements.define('bilara-segment', BilaraSegment);