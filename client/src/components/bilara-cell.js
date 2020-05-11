import { LitElement, html, css } from 'lit-element';


import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { contentEditableValue, selectText } from '../util.js';

import { BilaraUpdatable } from './bilara-updatable.js';

export class BilaraCell extends connect(store)(BilaraUpdatable){
  static get styles() {
    return css`
    div,
    span.string {
      display: inline-flex;
      width: 100%;
      position: relative
    }
    [contenteditable] {
      outline: 0px solid transparent;
      padding: 4px 8px;
      height: 100%
    }

    .string.editable {
      border-radius: 8px;
      background-color: var(--bilara-secondary-background-color);
    }
    .string.editable:focus {
      box-shadow: 0 0 0 1px var(--bilara-red);
    }

    .string.empty:after {
      content: "[ ]";
      opacity: 0.6;
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
      right: -20px;
      top: 8px;
      display: none
    }
    :focus + .status.modified {
        display: none;
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
    .status.error {
      display: inline-block;
      background-color: var(--bilara-red);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    }
    `
  }
  render() {
    return html`
    <div>
    <span   class="string${ this._editable ? ' editable' : ''}" tabindex="${this._editable == 'true' ? 0 : -1}"
                  contenteditable="${this._editable == true ? contentEditableValue : 'false'}"
                  @keydown="${this._keydownEvent}"
                  @focus="${this._focusEvent}"
                  @input="${this._inputEvent}"
                  @blur="${this._blur}"
                ></span>
    ${this.renderStatus()}
                </div>`
  }

  static get properties(){
    return {
      ...super.properties,
      segmentId: String,
      field: String,
      _editable: Boolean,
      _value: String,
    }
  }

  firstUpdated() {
    this._setValue(this._value);
    this._committedValue = this._value;
    this._pendingValue = null;
    if (!this._editable) {
      this.setAttribute('tabindex', -1);

    }
  }

  focus() {
    let el = this.shadowRoot.querySelector('.string');
    el.focus();
    setTimeout(function(){ 
      let sel = window.getSelection();
      if (el.lastChild) {
        sel.collapse(el.lastChild, el.lastChild.length);
      }
    }, 0);
  }

  _blur(e) {
    if (e.inputType != 'insertLinkBreak') {
      if (e.currentTarget.textContent != this._committedValue) {
        if (this._status != 'pending' && this._status != 'error') {
          this._status = 'modified';
        }
      }
    }
  }



  _setValue(value, undoable) {
    
    const cell = this.shadowRoot.querySelector('.string');
    if (undoable && document.execCommand) {
      cell.focus();
      selectText(cell);
      document.execCommand("insertText", false, value);
    } else {
      cell.innerText = value || '';
    }
    this._updateStatusValue(value);
  }

  _keydown(e){
   
  }

  _matchValue(value) {
    this._setValue(value, true);
    this.focus();
  }

 _emitNavigationEvent() {
   let event = new CustomEvent('navigation-event', {
      detail: { field: this.field, steps: 1 },
      bubbles: true,
      composed: true
     
   });

   this.dispatchEvent(event);
 }
  

  _keydownEvent(e) {
    if (e.key == 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      this._matches = null;
  
      const value = e.currentTarget.textContent;
      
      if (value != this._pendingValue && value != this._committedValue) {
          this._commitValue(value, this.segmentId, this.field);
      }

      this._emitNavigationEvent();
    } else {
      this._status = null;
    }
  }

  

  _inputEvent(e) {
    const value = e.target.innerText;
    console.log(value);
    this._updateStatusValue(value);
  }
}


window.customElements.define('bilara-cell', BilaraCell);