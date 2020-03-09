import { html } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { PageViewElement } from './page-view-element.js';

import './bilara-segment.js';
import './bilara-search.js';


// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

// This element is connected to the Redux store.

import { segmentData } from '../reducers/segment-data.js';
import { searchReducer } from '../reducers/search.js';

import { getChildMatchingKey } from '../util.js';
import { sortByKeyFn, storageLoad, storageSave, setEquality } from '../util.js';

store.addReducers({
  segmentData,
  search: searchReducer
});

class TranslationView extends connect(store)(PageViewElement) {
  render(){
    let fields = this._fields;
    console.log('Render, ', this._orderedFields);
    return html`
    ${SharedStyles}
    <style>
      :host {
        display: flex;
        justify-content: center
      }

      #container {
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        padding-bottom: 72px;
        padding-top: 24px
      }

      #field-headings {
        display: flex;
        justify-content: space-around;
        margin-bottom: 16px;
        position: sticky;
        top: 28px;
        z-index: 10
      }

      .field {
        flex-basis: 50%;
        padding: 12px 12px 4px 12px;
        margin: 0 16px 16px 16px;
        font-size: 80%;
        font-weight: 600;
        background-color: var(--bilara-secondary-color);
        border-radius: 8px 8px 0 0;
        cursor: grab;
        color: white;
        white-space: nowrap
      }
      .field:hover {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      }
      .field:active {
        cursor: grabbing;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      }
      .field:before {
        display: inline-block;
        content: " ";
        background-image: url(../images/drag_indicator-24px.svg);
        height: 12px;
        width: 16px;
        background-repeat: no-repeat;
        vertical-align: middle;
        opacity: 70%
      }

    </style>
    <div id="container">

      <section id="translation">
      <div id="segments">
        ${ this._segments.length == 0 || this._orderedFields.length == 0 ? 
          html`Fetching Data` :
          html`
            <div id="field-headings">
            ${Object.values(this._orderedFields).map(fieldName => {
              return html`<span class="field"
                                draggable="false"
                                title="Drag and drop columns in any order"
                                @drop="${this._dropHandler}"
                                @dragover="${this._dragoverHandler}"
                                @dragstart="${this._dragstartHandler}"
                                ondragenter="return false"

              >${fieldName}</span>`
            })}
            </div>
            ${Object.keys(this._segments).map(segmentId => {
              const segment = this._segments[segmentId],
                    rootString = segment[this._sourceField];

              return html`<bilara-segment ._isActive="${segmentId == this._activeSegmentId}"
                                          .segmentId="${segmentId}"
                                          ._segment="${segment}"
                                          ._fields="${this._fields}"
                                          ._sourceField="${this._sourceField}"
                                          ._targetField="${this._targetField}"
                                          ._orderedFields ="${this._orderedFields}"
                                          ._pushState="${this._pushState[segmentId]}">
                                          </bilara-segment>`}
          )}`
        }
        </div>
      </section>
  
    </div>
    
    `
  }

  static get properties() { 
    return {
      _segments: { type: Object },
      _fields: { type: Object},
      _activeSegmentId: { type: String },
      _fetching: { type: Boolean },
      _failure: { type: Boolean },
      _sourceField: { type: String },
      _targetField: { type: String },
      _suggestions: { type: Object },
      _orderedFields: { type: Array, reflect: true },
      _pushState: { type: Object }
    }
  }

  _getFieldOrder(fields){
    let savedFieldOrder = storageLoad('fieldOrder', [...fields].sort());
    if (savedFieldOrder) {
      console.log("Saved Order ", savedFieldOrder);
      if (setEquality(fields, savedFieldOrder).length == 0) {
        return savedFieldOrder;
      }
    }
    
    console.log('Sorting Fields')

    return sortByKeyFn(fields, field => {
      if (field == this._sourceField) return '\u0001' + field;
      if (field == this._targetField) return '\u0002' + field;
      return field;
    })
  }

  _saveFieldOrder(fields) {
    storageSave('fieldOrder', [...fields].sort(), fields);
  }

  stateChanged(state) {
    this._fetching = state.segmentData.isFetching;
    if (state.segmentData.data) {
      this._segments = state.segmentData.data.segments;
      this._fields = state.segmentData.data.fields;
      this._sourceField = state.segmentData.data.sourceField;
      this._targetField = state.segmentData.data.targetField;
      this._orderedFields = this._getFieldOrder(Object.keys(this._fields));
    } else {
      this._segments = {};
      this._fields = {};
    }

    this._pushState = state.segmentData.pushState || {};
    
    this._failure = state.segmentData.failure;
    this._activeSegmentId = state.segmentData.activeSegmentId;
  }

  _dropHandler(event) {
    let fromField = event.dataTransfer.getData("fromField");
    let toField = event.target.innerText;
    console.log(fromField, toField);
    let fields = [...this._orderedFields];
    let fromIndex = fields.indexOf(fromField),
        toIndex = fields.indexOf(toField);
    
    fields[fromIndex] = toField;
    fields[toIndex] = fromField;
    this._saveFieldOrder(fields);
    this._orderedFields = fields;
    let savedSegments = this._segments;
    this._segments = {};
    setTimeout(()=> this._segments = savedSegments, 1);
  }

  _dragoverHandler(event){
    event.preventDefault();
  }

  _dragstartHandler(event) {
    event.dataTransfer.setData("fromField", event.target.innerText);
  }

  _swapFields(event) {

  }
}

window.customElements.define('translation-view', TranslationView);