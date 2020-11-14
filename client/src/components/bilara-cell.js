import { LitElement, html, css } from 'lit-element';


import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { contentEditableValue, selectText } from '../util.js';

import { BilaraUpdatable } from './bilara-updatable.js';

export class BilaraCell extends connect(store)(BilaraUpdatable){
  static get styles() {
    return css`
    div,
span.string
{
    position: relative;

    display: inline-flex;

    width: 100%;
}

[contenteditable]
{
    height: 100%;;
    padding: 4px 8px;

    outline: 0 solid transparent;
}

.string.editable
{
  font-family: var(--bilara-serif)
}

.string.editable:focus
{
    box-shadow: 0 0 0 1px var(--bilara-red);
}

.string.empty:after
{
    content: '[ ]';

    opacity: .6;
}

.status
{
    font-size: 12px;
    line-height: 16px;

    position: absolute;
    top: 8px;
    right: -20px;

    display: none;;

    width: 16px;
    height: 16px;

    text-align: center;

    color: white;
    border-radius: 50%;
}

:focus + .status.modified
{
    display: none;
}

.status.pending
{
    display: inline-block;

    background-color: rgb(125, 125, 125);
    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);
}

.status.committed
{
    display: inline-block;

    background-color: green;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);
}

.status.modified
{
    display: inline-block;

    background-color: var(--bilara-magenta);
    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);
}

.status.error
{
    display: inline-block;

    background-color: var(--bilara-red);
    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);
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
    this._updateStatusValue(value, this.segmentId, this.field);
  }

  _keydown(e){
   
  }

  _matchValue(value) {
    this._setValue(value, true);
    this.focus();
  }

 _emitNavigationEvent(steps) {
   if (steps === undefined) steps = 1;
   let event = new CustomEvent('navigation-event', {
      detail: { field: this.field, steps: steps },
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


    if (e.ctrlKey) {
      if (e.key == 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        this._emitNavigationEvent(1);
      } else if (e.key == 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        this._emitNavigationEvent(-1);
      }
      
    }

    
  }

  

  _inputEvent(e) {
    const value = e.target.innerText;
    console.log(value);
    this._updateStatusValue(value, this.segmentId, this.field);
  }
}


window.customElements.define('bilara-cell', BilaraCell);