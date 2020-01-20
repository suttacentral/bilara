import { html } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { PageViewElement } from './page-view-element.js';

import { BilaraSegment } from './bilara-segment.js';



// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

// This element is connected to the Redux store.

import { segmentData } from '../reducers/segment-data.js';
import { searchReducer } from '../reducers/search.js';

import { getChildMatchingKey } from '../util.js';
import { sortByKeyFn } from '../util.js';

store.addReducers({
  segmentData,
  search: searchReducer
});

class TranslationView extends connect(store)(PageViewElement) {
  render(){
    let fields = this._fields;
    
    return html`
    ${SharedStyles}
    <style>
      :host {
        max-width: 70em;
        margin: auto;
      }
    </style>
    <section>
      ${ this._segments.length == 0 ? 
        html`Fetching Data` :
        html`
          <bilara-segment ._sortedFields="${this._sortedFields}"></bilara-segment>
          ${Object.keys(this._segments).map(segmentId => {
            const segment = this._segments[segmentId],
                  rootString = segment[this._sourceField];

            return html`<bilara-segment ._isActive="${segmentId == this._activeSegmentId}"
                                        ._segmentId="${segmentId}"
                                        ._segment="${segment}"
                                        ._fields="${this._fields}"
                                        ._sourceField="${this._sourceField}"
                                        ._targetField="${this._targetField}"
                                        ._sortedFields ="${this._sortedFields}"
                                        ._pushState="${this._pushState[segmentId]}">
                                        </bilara-segment>`}
        )}`
      }
    </section>`
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
      _sortedFields: { type: String },
      _pushState: { type: Object }
    }
  }

  stateChanged(state) {
    this._fetching = state.segmentData.isFetching;
    if (state.segmentData.data) {
      this._segments = state.segmentData.data.segments;
      this._fields = state.segmentData.data.fields;
      this._sourceField = state.segmentData.data.sourceField;
      this._targetField = state.segmentData.data.targetField;
      this._sortedFields = sortByKeyFn(Object.keys(this._fields), field => {
        if (field == this._sourceField) return '\u0001' + field;
        if (field == this._targetField) return '\u0002' + field;
        return field;
      })
      
    } else {
      this._segments = {};
      this._fields = {};
    }

    this._pushState = state.segmentData.pushState || {};
    
    this._failure = state.segmentData.failure;
    this._activeSegmentId = state.segmentData.activeSegmentId;
  }
}

window.customElements.define('translation-view', TranslationView);