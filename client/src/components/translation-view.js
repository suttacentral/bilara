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
  <style>
#translation {
  margin-bottom: 72px;
}
#search {
  background-color: var(--bilara-secondary-background-color);
  min-width: 200px;
  max-width: 400px;
  margin: 0 0 0 8px;
  position: sticky;
  padding: 0 0 24px 0;
  align-self: flex-start;
  top: 36px;
  overflow-y: auto;
  height: 100vh;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: -ms-autohiding-scrollbar;
  scrollbar-width: var(--scrollbar-width);
  scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
}
#search::-webkit-scrollbar {
  height: var(--scrollbar-size);
  width: var(--scrollbar-size);
}
#search::-webkit-scrollbar-track {
  background-color: var(--scrollbar-track-color);
}
#search::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-color);
  /* Add :hover, :active as needed */
}
#search::-webkit-scrollbar-thumb:vertical {
  min-height: var(--scrollbar-minlength);
}
#search::-webkit-scrollbar-thumb:horizontal {
  min-width: var(--scrollbar-minlength);
}
form {
  padding: 0 8px 16px;
  display: block
}
input[type="search"] {
  border: 1px solid var(--bilara-red);
  border-radius: 2px;
  width: 100%;
  padding: 4px 8px
}
label {
  font-size: 80%;
  margin-top: 8px;
  margin-right: 16px
}
input,
label {
  display: inline-block
}
[for="find-root"],
[for="find-translation"] {
  display: block
}
.button-row {
  display: flex;
  justify-content: space-between
}
button {
  display: inline-block;
  color: var(--bilara-secondary-color);
  font-weight: 600;
  font-size: 0.8rem;
  padding: 4px 8px;
  border: 1px solid var(--bilara-secondary-color);
  border-radius: 8px;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: .05em;
  background-color: var(--bilara-primary-background-color);
  white-space: nowrap;
  line-height: 1;
}
form button {
  margin: 16px 4px 0px 0px;
}
.find-button {
  color: var(--bilara-green);
  border: 1px solid var(--bilara-green);
  background-color: var(--bilara-primary-background-color);
}
.find-button:hover {
  background-color: var(--bilara-green);
  color: var(--bilara-secondary-background-color);
}
.undo-button {
  color: var(--bilara-red);
  border: 1px solid var(--bilara-red);
  background-color: var(--bilara-primary-background-color);
}
.undo-button:hover {
  background-color: var(--bilara-red);
  color: var(--bilara-secondary-background-color);
}
.replace-button {
  margin-left: 4px;
  height: 24px;
  color: var(--bilara-magenta);
  border: 1px solid var(--bilara-magenta);
  background-color: var(--bilara-primary-background-color);
}
.replace-button:hover {
  background-color: var(--bilara-magenta);
  color: var(--bilara-secondary-background-color);
}

#results {
  margin: 0;
  color: var(--bilara-emphasized-text-color)
}
.result {
  margin: 0;
  box-sizing: border-box
}
.result-location {
  line-height: 1;
  border-top: 2px solid var(--bilara-tertiary-background-color);
  padding: 4px 8px 4px;
  margin: 16px 0 8px;
  display: flex;
  justify-content: space-between
}
.result-location a {
  font-size: 80%;
  font-weight: 600;
  color: var(--bilara-secondary-text-color);
  text-decoration: none;
  margin-right: 4px;
}
.result-location a:hover {
  color: var(--bilara-red);
  text-decoration: underline;
  text-decoration-color: var(--bilara-red)
}
.result-translation-text {
  padding: 0 8px;
  font-size: 0.9em
}
.result-root-text {
  font-style: italic;
  padding: 0 8px;
    font-size: 0.9em
}
mark{
  background-color: var(--bilara-yellow);
  color: var(--bilara-empasized-text-color);
}
details {
  padding: 4px 8px;
  margin-bottom: 16px;
}
summary {
  font-weight: 600;
  font-size: 80%
}
dt {
  font-weight: 600
}
kbd {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--bilara-secondary-text-color);
  color: var(--bilara-secondary-background-color)
}
</style>
  <section id ="search">
    <details>
    <summary>How to use search</summary>
    <dl>
    <dt>Scope</dt>
    <dd>You can search either in your own translation project, or across the whole of Bilara. However, you can only replace text in your own project.</dd>
    <dt>Find</dt>
    <dd>Returns exact string match first. If you have one or more spaces, it returns entries with all strings first. <br><kbd>↵ Enter</kbd></dd>
<dt>Find in root</dt>
<dd>If you search both translation and root, it will return segments that contain both. Does not alias diacriticals. You cannot replace in root. <br><kbd>↵ Enter</kbd></dd>
<dt>Replace</dt>
<dd>Replace the find term with the replace term in the chosen result. You cannot replace all. When you replace, the relevant item will disappear. <br><kbd>Ctrl</kbd> + <kbd>↵ Enter</kbd></dd>
<dt>Match caps</dt>
<dd>If the find term starts with a capital letter, so will the replace term. Uncheck to insert the exact replace term.</dd>
<dt>Undo</dt>
<dd>Undo replaced terms one at a time. The undone items will reappear.<br><kbd>Ctrl</kbd> + <kbd>Z</kbd></dd>
</dl>
    </details>
    <form>
        
  <input type="radio" id="radio-thisproject" name="scope" checked>
  <label for="radio-thisproject">This project</label>
            
  <input type="radio" id="radio-all" name="scope">
  <label for="radio-all">All</label>

    <label for="find-translation">Find in translation</label>
  <input type="search" id="find-translation" name="find-translation" placeholder="recited">
        <label for="find-root">Find in root</label>
  <input type="search" id="find-root" name="find-root" placeholder="gāthāy">
      <label for="replace">Replace in translation</label>
  <input type="search" id="replace" name="replace" placeholder="shouted">
  <div class="button-row">
  <span>
  <button type="button" class="find-button" title="search for the specified term">Find</button>
  </span>
  <span>
  <button type="button" class="undo-button" title="Undo the last replace">Undo</button>
    <button type="button" class="undo-button" title="Clear the search fields">Clear</button>
  </span>
  </div>
  <input type="checkbox" id="match-caps" name="match-caps" checked>
    <label for="match-caps">Match caps</label>
  </form>
  <section id="results">
  <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button" title="Replace this term and dismiss this result">Replace</button></div>
      
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
    <section class="result">
     <div class="result-location"><a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a><button type="button" class="replace-button">Replace</button></div>
  <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
  <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
  </section>
  </section>
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