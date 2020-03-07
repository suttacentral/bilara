import { LitElement, html } from 'lit-element';


import { store } from '../store.js';

export class BilaraCell extends LitElement{
  render() {
    return html`<style>
    div,
    span.string {
      display: inline-flex;
      width: 100%;
    }
    [contenteditable] {
      outline: 0px solid transparent;
      padding: 4px 8px;
      height: 100%
    }

    .string[contenteditable="plaintext-only"] {
      font-family: "source serif pro";
    }
    .string[contenteditable="plaintext-only"]:focus {
      border-radius: 8px;
      box-shadow: 0 0 0 1px var(--bilara-red);
    }

    .string.empty:after {
      content: "[ ]";
      opacity: 0.6;
    }

    .status {
      font-size: 12px;
      color: white;
      height: 1.2em;
      line-height: 1.2em;
      width: 1.2em;
      text-align: center;
      border-radius: 50%;
    }
    .status.pending {
      background-color: rgb(125, 125, 125);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    }
    .status.committed {
      background-color: green;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    }
    .status.modified {
      background-color: var(--bilara-red);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    }
    </style>
    <div>
    <span   class="string" tabindex="${this._editable == 'true' ? 0 : -1}"
                  contenteditable="${this._editable == true ? 'plaintext-only' : 'false'}"
                  @keydown="${this._keydownEvent}"
                  @focus="${this._focusEvent}"
                  @input="${this._inputEvent}"
                  @blur="${this._blur}"
                ></span>
    ${this.getStatus()}
                </div>`
  }

  static get properties(){
    return {
      segmentId: String,
      field: String,
      _editable: Boolean,
      _value: String,
      _pendingValue: String,
      _committedValue: String,
      _error: String,
      _status: String
    }
  }
  getStatus(){
    return {
      error: html`<span class="status error" title="${this._error}">❌</span>`,
      modified: html`<span class="status modified" title="String not committed">⚠</span>`,
      pending: html`<span class="status pending" title="Pending">✓</span>`,
      committed: html`<span class="status committed" title="Committed">✓</span>`,
    }[this._status] || html`<span class="status"></span>`;

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



  _setValue(value) {
    this.shadowRoot.querySelector('.string').innerText = value || '';
  }

  _suggestValue(value) {
    this._setValue(value);
    this.focus();
  }

  _updateValue(value) {
    const user = store.getState().app.user;   

    let data = {
      segmentId: this.segmentId,
      field: this.field,
      oldValue: this._committedValue,
      value: value,
      user: user.username
    }

    this._pendingValue = value;

    this._status = 'pending';
    
    let request = fetch(`/api/segment/`, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                "Content-Type": "application/json",
                "X-Bilara-Auth-Token": user.authToken,
                "X-Bilara-Username": user.username,
            },
            body: JSON.stringify(data)
        }).then( (res) => {
          return res.json()
        })
        .then( (data) => {
            if (data.error) {
              this._error = data.error;
              this._status = 'error';
            } else {
              this._status = 'committed';
              this._error = false;
              this._committedValue = data.value;
            }            
            this._pendingValue = null;
        }).catch( (e) => {
            this._error = 'fetch error';
            this._status = 'error';
            this._pendingValue = null;
        })
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
      this._suggestions = null;
  
      const value = e.currentTarget.textContent;
      
      if (value != this._pendingValue && value != this._committedValue) {
          this._updateValue(value);
      }

      this._emitNavigationEvent();
    } else {
      this._status = null;
    }
  }

  

  _inputEvent(e) {
    console.log(e);
  }
}


window.customElements.define('bilara-cell', BilaraCell);