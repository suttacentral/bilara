import { LitElement, html, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

import { updateSegment } from '../actions/segment.js';

export class BilaraUpdatable extends connect(store)(LitElement){
  static get properties(){
    return {
      _status: String,
      _currentValue: String,
      _committedValue: String,
      _pendingValue: String,
      _error: String
    }
  }

  renderStatus(){
    return {
      error: html`<span class="status error" title="${this._error}">❌</span>`,
      modified: html`<span class="status modified" title="Changes not committed">⚠</span>`,
      pending: html`<span class="status pending" title="Pending">✓</span>`,
      committed: html`<span class="status committed" title="Committed">✓</span>`,
    }[this._status] || html`<span class="status"></span>`;
  }

  _updateStatusValue(value){
    
    if (this._committedValue == null) {
      this._committedValue = value;
      this._currentValue = value;
    } else {
      this._currentValue = value;
      if (value != this._committedValue) {
        this._status = 'modified';
      } else {
        this._status = null;
      }
    }
  }

  _commitValue(value, segmentId, field) {
    const state = store.getState(),
          user = state.app.user;
    
    if (value == this._committedValue) {
      return
    }

    const requestData = {
      segmentId: segmentId,
      field: field,
      oldValue: this._committedValue,
      value: value,
      user: user.username
    }

    this._pendingValue = value;

    this._status = 'pending';
    
    const request = fetch(`/api/segment/`, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                "Content-Type": "application/json",
                "X-Bilara-Auth-Token": user.authToken,
                "X-Bilara-Username": user.username,
            },
            body: JSON.stringify(requestData)
        }).then( (res) => {
          return res.json()
        })
        .then( (data) => {
          console.log(data);
            if (data.error) {
              this._error = data.error;
              this._status = 'error';
            } else {
              this._status = 'committed';
              this._error = false;
              this._committedValue = value;
              const segment = state.segmentData.data.segments[segmentId];
              if (segment && segment[field]) {
                store.dispatch(updateSegment(segmentId, field, value));
              }
            }            
            this._pendingValue = null;
        }).catch( (e) => {
            console.error(e);
            this._error = 'network or server error';
            this._status = 'error';
            this._pendingValue = null;
        });
 }
}