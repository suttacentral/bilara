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
        background: rgb(240,240,240);
        margin-bottom: 5px;
      }
      .string {
        display: inline-flex;
        flex: 1;
        padding: 0 0.2em 0 0.2em;
        
        box-shadow: 2px 2px 2px rgba(200,200,200);
      }

      div > span:focus {
        background: rgb(255,255,255);
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
    >${this._targetString}</span></div>` 
  }

  static get properties(){
    return {
      _segmentId: String,
      _sourceString: String,
      _targetString: String
    }
  }

  _inputEvent(e){
    const segmentId = this._segmentId,
          value = e.currentTarget.textContent,
          dataType = e.currentTarget.dataset.type;
    console.log(segmentId, dataType, value);
    store.dispatch(updateSegment(segmentId, dataType, value));
  }
}




window.customElements.define('bilara-segment', BilaraSegment);