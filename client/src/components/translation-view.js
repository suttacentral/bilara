import { html } from '@polymer/lit-element';
import { when } from 'lit-html/directives/when';
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

store.addReducers({
  segmentData,
  search: searchReducer
});

import { fetchSuggestions } from '../actions/search.js';

class TranslationView extends connect(store)(PageViewElement) {
  render(){
    return html`
    ${SharedStyles}
    <style>
      :host {
        max-width: 70em;
        margin: auto;
      }
    </style>
    <section>
      <h2>Translation</h2>
      ${ when(this._fetching, 
        () => html`Fetching Data`, 
        () => html`       
          ${repeat(Object.keys(this._source), (key) => key, (segmentId, index) => {
          const source = this._source[segmentId];
          const target = this._target[segmentId] || '';
          if (segmentId == '_meta') {
            return html``
          }
          let suggestions = segmentId == this._activeSegmentId ? this._suggestions[this._suggestionKey(source)] : '';
          return html`<bilara-segment ._segmentId="${segmentId}"
                                      ._sourceString="${source}"
                                      ._targetString="${target}"
                                      ._sourceFilepath="${this._source._meta.filepath}"
                                      ._targetFilepath="${this._target._meta.filepath}"
                                      ._suggestions="${suggestions}"
                                      </bilara-segment>
                  
                     `
                   
        })}
          <pre><code>${JSON.stringify(this._segmentData, null, 2)}</code></pre>`
      )}
    </section>`
  }

  _suggestionKey(string) {
    return [string, this._source._meta.language, this._target._meta.language].join('_');
  }

  updated(changedProperties) {
    if (changedProperties.has('_activeSegmentId')) {
      store.dispatch(fetchSuggestions(this._source[this._activeSegmentId], this._source._meta.language, this._target._meta.language, this._activeSegmentId))
    }
  }

  static get properties() { 
    return {
      _segmentData: { type: Object },
      _activeSegmentId: { type: String },
      _fetching: { type: Boolean },
      _failure: { type: Boolean },
      _source: { type: Object },
      _target: { type: Object },
      _suggestions: { type: Object }
    }
  }

  //firstUpdated() {
//    store.dispatch(fetchSegmentData());
//  }

  stateChanged(state) {
    this._fetching = state.segmentData.isFetching;
    if (state.segmentData.data) {
      this._source = state.segmentData.data.source;
      this._target = state.segmentData.data.target;
    } else {
      this._source = {};
      this._target = {};
    }
    
    this._failure = state.segmentData.failure;
    this._activeSegmentId = state.segmentData.activeSegmentId;
    this._suggestions = state.search.suggestions;
  }
}

window.customElements.define('translation-view', TranslationView);