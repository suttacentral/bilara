import { LitElement, html } from 'lit-element';


import { store } from '../store.js';

export class BilaraCell extends LitElement{
  render() {
    return html`<style>
    div, span.string {
      display: inline-flex;
      width: 100%;
    }

    .status{
      font-size: 12px;
      color: white;
      height: 1.2em;
      line-height: 1.2em;
      width: 1.2em;
      text-align: center;
      border-radius: 50%;
      
    }
    .status.pending{
      background-color: rgb(125,125,125);
      box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);        
    }
    .status.committed{
        background-color: green;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    }
    .status.modified{
      background-color:var(--bilara-red);
      box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    }

    </style>
    <div>
    <span   class="string"
                  contenteditable="${this._editable == 'true' ? 'plaintext-only' : 'false'}"
                  @keypress="${this._keypressEvent}"
                  @focus="${this._focusEvent}"
                ></span>
    ${this.getStatus()}
                </div>`
  }

  static get properties(){
    return {
      _segmentId: String,
      _field: String,
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
      error: html`<span class="status error" title="${this._error}">❌</error>`,
      modified: html`<span class="status modified">⚠</error>`,
      pending: html`<span class="status pending" title="Pending">✓</span>`,
      committed: html`<span class="status committed" title="Committed">✓</span>`,
    }[this._status] || html`<span class="status"></span>`;

  }
  firstUpdated() {
    this._setValue(this._value);
    this._committedString = this._value;
    this._pendingValue = null;
  }

  _setValue(value) {
    this.shadowRoot.querySelector('.string').innerText = value || '';
  }

  _updateValue(value) {
    const user = store.getState().app.user;   

    let data = {
      segmentId: this._segmentId,
      field: this._field,
      oldValue: this._committedString,
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
            console.log(this, data);
        }).catch( (e) => {
            this._error = 'fetch error';
            this._status = 'error';
            this._pendingValue = null;
        })
 }
  

  _keypressEvent(e) {
    this._status = 'modified';
    if (e.key == 'Enter') {
      this._dirty = false;
      e.preventDefault();
      e.stopPropagation();
      this._suggestions = null;
  
      const value = e.currentTarget.textContent;
      
      if (value != this._pendingValue) {
          this._updateValue(value);
      }
        
      // this.blur()
      // let nextSegment = this.nextElementSibling;
      // if (nextSegment) {
      //   nextSegment.setFocus(e.path[0].getAttribute('data-type'));
      // }
      
    }
  }
}


window.customElements.define('bilara-cell', BilaraCell);