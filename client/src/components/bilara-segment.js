import { LitElement, html } from '@polymer/lit-element';

import {updateSegment} from '../actions/segment.js';
import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

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
        data-type="source"
        class="string"
      >${this._sourceString}</span>
    <span contenteditable="true"
        data-type="target"
        class="string"
        @blur="${this._inputEvent}"
        @keypress=${this._keypressEvent}"
    >${this._targetString}</span></div>` 
  }

  static get properties(){
    return {
      _segmentId: String,
      _sourceString: String,
      _targetString: String,
      _sourceFilepath: String,
      _targetFilepath: String
    }
  }

  setFocus(dataType) {
    let e = this.shadowRoot.querySelector(`[data-type=${dataType}]`);
    e.focus();
  }

  _inputEvent(e){
    const segmentId = this._segmentId,
          value = e.currentTarget.textContent,
          dataType = e.currentTarget.dataset.type,
          filepath = dataType == 'source' ? this._sourceFilePath : this._targetFilepath,
          hasChanged = dataType == 'source' ? this._sourceString != value : this._targetString != value;
    
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