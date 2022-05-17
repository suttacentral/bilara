import { html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { contentEditableValue, selectText } from '../util.js';

import { BilaraUpdatable } from './bilara-updatable.js';

export class BilaraCell extends connect(store)(BilaraUpdatable){
  static get styles() {
    return css`
    div,
span.string, span.string-html
{
    position: relative;

    width: 100%;

    display: inline-block;
}

.root .string {
  display: None;
}

.root .string-html {
  display: inline-block
}

.root.show-html .string {
  display: inline-block;
}

.root.show-html .string-html {
  display: None;
}

div
{
    height: 100%;;
    padding: 4px 8px;

    outline: 0 solid transparent;
}

.string.editable
{
  font-family: var(--bilara-serif);

  display: block;
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



supplied
  {color: var(--bilara-orange);
}

    `
  }
  render() {
    const editable = this._editable == true || this._suggestMode == true;
    return html`
    <div class="${classMap({'root': this._root, 'show-html': this._showHtml})}">
    <span class="${classMap({'string': true, 'editable': editable})}" tabindex="${editable ? 0 : -1}"
                  contenteditable="${ editable ? contentEditableValue : 'false'}"
                  @keydown="${this._keydownEvent}"
                  @focus="${this._focusEvent}"
                  @input="${this._inputEvent}"
                  @blur="${this._blur}"
                  @mousedown="${this._click}"
                ></span>
    <span class="string-html" @mousedown="${this._click}"></span>
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
      _root: Boolean,
      _showHtml: Boolean,
      _suggestMode: Boolean,
    }
  }

  stateChanged(state) {
    this._showHtml = state.app.pref.showHtml;
    this._suggestMode = state.app.translateMode == 'suggest';
  }

  firstUpdated() {
    this._root = !!this.field.match(/root-/);

    this._setValue(this._value);
    if (this._root) {
      this.shadowRoot.querySelector('span.string-html').innerHTML = this._value;
    }
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

  _click(e){
    if (!e.ctrlKey) return
    if (!this._editable) {
      const target = e.path[0];
      let result;
      if (target.tagName == 'SPAN') {
        result = target.innerHTML;
      } else {
        result = target.outerHTML;
      }
      let active = document.activeElement;
      let shadowRoot;
      while (true) {
        if (active.classList.contains('editable')) {
          break
        }
        shadowRoot = active.shadowRoot
        if (!shadowRoot) return
        active = shadowRoot.activeElement;
        if (!active) return
      }
      e.preventDefault();
      e.stopPropagation();

      let sel = shadowRoot.getSelection();

      let range = sel.getRangeAt(0);
      let fragment = document.createTextNode(result);
      range.insertNode(fragment)

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
