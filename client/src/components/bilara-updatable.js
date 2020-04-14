import { LitElement, html } from 'lit-element';

import { store } from '../store.js';

import { updateSegment } from '../actions/segment.js';

export class BilaraUpdatable extends LitElement{

  static get properties(){
    return {
      _status: String,
      _currentValue: String,
      _committedValue: String,
      _pendingValue: String,
      _error: String
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

  _commitValue(value, segmentId, field) {
    const state = store.getState(),
          user = state.app.user;   

    let data = {
      segmentId: segmentId,
      field: field,
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
              const segment = state.segmentData.data.segments[segmentId];
              if (segment && segment[field]) {
                this.dispatchEvent(updateSegment(segmentId, field, value));

                
              }
            }            
            this._pendingValue = null;
        }).catch( (e) => {
            this._error = 'fetch error';
            this._status = 'error';
            this._pendingValue = null;
        });
 }
}