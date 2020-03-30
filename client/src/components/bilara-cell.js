import { LitElement, html } from 'lit-element';


import { store } from '../store.js';

export class BilaraCell extends LitElement{
  render() {
    return html`<style>
    div{
display: flex;
flex-direction: column
    }
    div,
    span.string {
      width: 100%;
      position: relative
    }
    [contenteditable] {
      outline: 0px solid transparent;
      padding: 4px 8px;
      height: 100%
    }

    .string[contenteditable="plaintext-only"] {
      font-family: "source serif variable";
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
   fieldset{
      font-size: 12px;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--bilara-secondary-color);
      padding: 8px
    }
    .suggestion{
font-family: "source serif variable", serif;
font-size: 16px;
    }
    .message{
      font-style: italic;
      color: var(--bilara-secondary-text-color)
    }
    .radio-buttons{
      margin-bottom: 8px
    }
    input[type='radio']{
      cursor: pointer;
    }

    label{
           font-size: 12px;
      font-style: normal
    }
    input[type='text']{
      width: 100%;
      background-color: var(--bilara-primary-background-color);
      border: 1px solid var(--bilara-tertiary-background-color);
      border-radius: 4px
    }

   button {
      color: var(--bilara-secondary-color);
      font-family: inherit;
      font-weight: 600;
      font-size: 0.8rem;
      padding: 2px 8px;
      margin: 16px 0 0 0;
      border: 1px solid var(--bilara-secondary-text-color);
      border-radius: 8px;
      display: inline-block;
      font-variant-caps: all-small-caps;
      letter-spacing: .05em;
      background-color: inherit;
      cursor: pointer;
    }
    button:hover {
      background-color: var(--bilara-secondary-color);
      color: var(--bilara-secondary-background-color);
    }
    @supports(-webkit-appearance: none) or (-moz-appearance: none) {
  input[type='radio'] {
    -webkit-appearance: none;
    -moz-appearance: none;
    --active: var(--bilara-green);
    --active-inner: #fff;
    --focus: 2px rgba(39, 94, 254, .25);
    --border: #BBC1E1;
    --border-hover: #275EFE;
    --background: var(--bilara-secondary-background-color);
    --disabled: #F6F8FF;
    --disabled-inner: #E1E6F9;
    height: 16px;
    width: 16px;
    outline: none;
    display: inline-block;
    vertical-align: top;
    position: relative;
    margin: 0 2px 0 0;
    cursor: pointer;
    border: 1px solid var(--bc, var(--border));
    background: var(--b, var(--background));
    -webkit-transition: background .3s, border-color .3s, box-shadow .2s;
    transition: background .3s, border-color .3s, box-shadow .2s;
    border-radius: 50%;
      display: inline-block;
      vertical-align: middle;

  }
}


input[type='radio']:checked {
  --b: var(--active);
  --bc: var(--active);
}


/* Apply another border color on hover if not checked & not disabled */
input[type='radio']:not(:checked):not(:disabled):hover {
  --bc: var(--border-hover);
}

input[type='radio'] {
outline: none;
  transition: box-shadow .2s;
}

input[type='radio']:focus {
  box-shadow: 0 0 0 var(--focus);
}

input[type='radio'] + label {
  font-size: 12px;
  font-weight: 600;
      display: inline-block;
       vertical-align: middle;
       font-family: inherit;
       opacity: 0.6;

}

input[type='radio']:checked + label{
  opacity: 1

}
input[type='radio']:disabled + label {
    cursor: not-allowed;
}
label + input{
        margin-left: 16px!important
}?* I don't know why the important is needed.*/
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
    <form class="suggest">
      <fieldset>
    <legend>Suggestion by NitPicker</legend>
    <span class="suggestion" title="Suggested revision for translation">Thus have I heard.</span>

  <span class="radio-buttons"><input type="radio" id="accept" name="edit" value="accept" checked>
      <label for="commit" title="Accept suggested change to translation">Accept</label>
      <input type="radio" id="reject" name="edit" value="reject">
      <label for="suggest" title="Reject suggested change to translation">Reject</label>
      <input type="radio" id="leave" name="edit" value="leave">
        <label for="suggest" title="Leave suggested change to translation for further consideration">Leave</label></span>
     <span class="message" title="Message on translation or clarification of suggestion">Perhaps this could be improved by making it good.</span>
<input type="text" id="message" name="message" title="Leave a message if you wish" /">
<button type="submit" title="Submit form content and shift focus to translation text field">Submit</button>
</fieldset>
</form>
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

  _matchValue(value) {
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
      this._matches = null;
  
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