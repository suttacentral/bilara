import { html, css } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { PageViewElement } from './page-view-element.js';

import '@lion/dialog/lion-dialog.js';

import './bilara-dialog.js';

import './bilara-segment.js';
import './bilara-search.js';

import './bilara-spinning-hourglass.js';



// These are the shared styles needed by this element.
import { sharedStyles } from './shared-styles.js';
import { ColumnStyles } from '../styles/columns.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

// This element is connected to the Redux store.

import { segmentData } from '../reducers/segment-data.js';
import { searchReducer } from '../reducers/search.js';

import { updateOrdering, updateTertiary } from '../actions/app.js';

import { getChildMatchingKey } from '../util.js';
import { sortByKeyFn, storageLoad, storageSave, setEquality } from '../util.js';

import { featureFlags } from '../util.js';

store.addReducers({
  segmentData,
  search: searchReducer
});


class TranslationView extends connect(store)(PageViewElement) {
  static get styles(){
    return [
      sharedStyles,
      css`
      :host
{
    display: flex;

    justify-content: center;
}

#translation
{
    margin-bottom: 72px;
}

#container
{
    display: flex;
    flex-direction: row;

    box-sizing: border-box;
    padding-top: 24px;
}

#field-headings
{
    position: sticky;
    z-index: 10;;
    top: 34px;

    display: flex;

    margin-bottom: 16px;

    justify-content: space-around;
}

.field
{
    font-size: 80%;
    font-weight: 600;

    height: 20px;
    margin: 8px 16px 16px 16px;
    padding: 8px 12px 4px 12px;

    white-space: nowrap;

    color: white;
    background-color: var(--bilara-secondary-color);
}

.field
{
    cursor: grab;

    flex-basis: 50%;
}

.field:hover
{
    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);
}

.field:active
{
    cursor: grabbing;

    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);
}

.field:before
{
    display: inline-block;

    width: 16px;
    height: 12px;

    content: ' ';
    vertical-align: middle;

    opacity: 70%;;
    background-image: url(../images/drag_indicator-24px.svg);
    background-repeat: no-repeat;
}

lion-dialog
{
    position: relative;
    z-index: inherit;
}

.adder
{
    font-size: 20px;
    font-weight: 600;
    line-height: 24px;

    position: absolute;
    top: 8px;
    right: -12px;

    width: 24px;
    height: 24px;
    margin: 4px 16px 16px 16px;
    padding: 0;

    cursor: pointer;
    text-align: center;
    white-space: nowrap;

    color: var(--bilara-primary-background-color);
    border-radius: 50%;
    background-color: var(--bilara-magenta);
}

.adder:hover
{
    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);
}

.adder:active
{
    cursor: pointer;

    box-shadow: 0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24);
}

.adder:before
{
    position: absolute;
    z-index: -1;
    top: -6px;
    right: -8px;

    display: inline-block;

    width: 36px;
    height: 36px;

    content: ' ';

    border-radius: 50%;
    background-color: var(--bilara-primary-background-color);
}

.ripple:after
{
    position: absolute;
    top: 0;
    left: 0;

    display: block;

    width: 100%;
    height: 100%;

    content: '';
    transition: transform .5s, opacity 1s;
    transform: scale(10, 10);
    pointer-events: none;

    opacity: 0;
    background-image: radial-gradient(circle, var(--bilara-primary-background-color) 10%, transparent 10.01%);
    background-repeat: no-repeat;
    background-position: 50%;
}

.ripple:active:after
{
    transition: 0s;
    transform: scale(0, 0);

    opacity: .2;
}

.permission
{
    padding: 0 0.5em;
    margin-left: 1em;

    border-radius: 50%;

    cursor: help;
}

.view .permission
{
    background-color: var(--bilara-red);
}

.suggest .permission
{
    background-color: var(--bilara-yellow);
}

.edit .permission
{
    background-color: var(--bilara-green);
}

.secondary .permission
{
    display: inline;
}


    `
    ]
  }
  render(){
    let fields = this._fields,
        segmentIds = this._segments ? Object.keys(this._segments) : null;
    console.log('Render, ', this._orderedFields);
    return html`
    ${ColumnStyles}
    <div id="container">

      <section id="translation">
      <div id="segments">
        ${ !this._segments ? 
          html`<bilara-spinning-hourglass></bilara-spinning-hourglass>` :
          html`
            <div id="field-headings">
            ${repeat(Object.values(this._orderedFields), fieldName => {
              const primary = fieldName == this._targetField,
                    permission = this._fields[fieldName].permission.toLowerCase();
              return html`<span class="field${primary ? ' primary' : ' secondary' } ${permission}"
                                field="${fieldName}"
                                draggable="true"
                                title="Drag and drop columns in any order"
                                @drop="${this._dropHandler}"
                                @dragover="${this._dragoverHandler}"
                                @dragstart="${this._dragstartHandler}"
                                ondragenter="return false"
              >
              <span class="name">${fieldName}</span>
              <span class="permission" title="You may ${permission}.">${permission}</span>
              </span>`
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

      ${ this._segments && featureFlags.search
          ? html`<bilara-search ._sourceField="${this._sourceField}"
                                ._targetField="${this._targetField}"
                                ._extraFindFields="${this._orderedFields.filter(
                                  field => field != this._sourceField 
                                           && field != this._targetField )}">
                 </bilara-search>` 
          : html`` }
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

  updated(changedProperties) {
    console.log(changedProperties.get('_segments'));
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
      this._segments = null;
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