import { html } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { PageViewElement } from './page-view-element.js';

import '@lion/checkbox-group/lion-checkbox-group.js';
import '@lion/checkbox-group/lion-checkbox.js';
import '@lion/dialog/lion-dialog.js';

import './bilara-dialog.js';

import './bilara-segment.js';
import './bilara-search.js';

import './bilara-spinning-hourglass.js';



// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import { ColumnStyles } from '../styles/columns.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

// This element is connected to the Redux store.

import { segmentData } from '../reducers/segment-data.js';
import { searchReducer } from '../reducers/search.js';

import { updateOrdering, updateTertiary } from '../actions/app.js';

import { getChildMatchingKey } from '../util.js';
import { sortByKeyFn, storageLoad, storageSave, setEquality } from '../util.js';

store.addReducers({
  segmentData,
  search: searchReducer
});

class TranslationView extends connect(store)(PageViewElement) {
  render(){
    let fields = this._fields,
        segmentIds = Object.keys(this._segments);
    console.log('Render, ', this._orderedFields);
    return html`
    ${SharedStyles}
    <style>
      
      :host {
        display: flex;
        justify-content: center;
      }

      #container {
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
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

      .field{
        padding: 8px 12px 4px 12px;
        margin: 8px 16px 16px 16px;
        height: 20px;
        font-size: 80%;
        font-weight: 600;
        background-color: var(--bilara-secondary-color);
        color: white;
        white-space: nowrap;

      }

      .field {
        flex-basis: 50%;
        cursor: grab;
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
      lion-dialog{
      	position: relative;
    z-index: inherit;
}
            .adder {
      	padding: 0;
        margin: 4px 16px 16px 16px;
    width: 24px;
    height: 24px;
     right: -12px;
    top: 8px;
     font-size: 20px;
    line-height: 24px;
        text-align: center;
        font-weight: 600;
        background-color: var(--bilara-magenta);
        color: var(--bilara-primary-background-color);
        white-space: nowrap;
        position: absolute;
        cursor: pointer;

        border-radius: 50%;
      }
            .adder:hover {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      }
      .adder:active {
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      }
      .adder:before{
      	content: " ";
      	background-color: var(--bilara-primary-background-color);
      	border-radius: 50%;
    width: 36px;
    height: 36px;
    right: -8px;
    top: -6px;
   display: inline-block;
    position: absolute;
    z-index: -1;
      }
.ripple:after {
  content: "";
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, var(--bilara-primary-background-color) 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform .5s, opacity 1s;
}
.ripple:active:after {
  transform: scale(0, 0);
  opacity: .2;
  transition: 0s;
}
    </style>
    ${ColumnStyles}
    <div id="container">

      <section id="translation">
      <div id="segments">
        ${ this._segments.length == 0 || this._orderedFields.length == 0 ? 
          html`<bilara-spinning-hourglass></bilara-spinning-hourglass>` :
          html`
            <div id="field-headings">
            ${repeat(Object.values(this._orderedFields), fieldName => {
              return html`<span class="field"
                                field="${fieldName}"
                                draggable="true"
                                title="Drag and drop columns in any order"
                                @drop="${this._dropHandler}"
                                @dragover="${this._dragoverHandler}"
                                @dragstart="${this._dragstartHandler}"
                                ondragenter="return false"

              >${fieldName}</span>`
            })}
            <lion-dialog .config=${{ hidesOnEsc: true}}>
              <span slot="invoker" class="adder ripple">+</span>
              <bilara-columns-dialog slot="content"
                ._existingFields="${this._orderedFields}"
                ._fieldNames="${[...new Set([this._sourceField, this._targetField, ...this._potentialFields])]}"
                ._lockedFields="${[this._sourceField, this._targetField]}"
                ._keyValue="${this._targetField}"
                ></bilara-columns-dialog>

            </lion-dialog>
            </div>

            ${repeat(segmentIds, 
                     segmentId => JSON.stringify(this._orderedFields) + segmentId, 
                     segmentId => {
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

      ${ this._segments.length  == 0 ? html`` : html`<bilara-search ._sourceField="${this._sourceField}"
                     ._targetField="${this._targetField}">
      </bilara-search>`}
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
      _potentialFields: { type: Array },
      _pushState: { type: Object }
    }
  }

  _fieldsKey(fields) {
    return JSON.stringify([...fields].sort())
  }
  _getFieldOrder(fields, ordering){
    const key = this._fieldsKey(fields);
    if (!(key in ordering)) {
      return sortByKeyFn(fields, field => {
        if (field == this._sourceField) return '\u0001' + field;
        if (field == this._targetField) return '\u0002' + field;
        return field;
      })
    }

    return ordering[key];
  }

  _saveFieldOrder(fields) {
    const key = this._fieldsKey(fields);
    console.log('Calling Update Ordering');
    //debugger
    store.dispatch(updateOrdering(key, fields));
  }

  stateChanged(state) {
    this._fetching = state.segmentData.isFetching;
    if (state.segmentData.data) {
      this._segments = state.segmentData.data.segments;
      this._fields = state.segmentData.data.fields;
      this._sourceField = state.segmentData.data.sourceField;
      this._targetField = state.segmentData.data.targetField;
      this._orderedFields = this._getFieldOrder(Object.keys(this._fields), state.app.pref.ordering);
      this._potentialFields = state.segmentData.data.potential;
    } else {
      this._segments = {};
      this._fields = {};
      this._orderedFields = [];
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
    // this._segments = {};
    // setTimeout(()=> this._segments = savedSegments, 1);
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