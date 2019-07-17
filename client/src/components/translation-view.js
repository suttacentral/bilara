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

store.addReducers({
  segmentData,
  search: searchReducer
});

import { fetchSuggestions } from '../actions/search.js';

class TranslationView extends connect(store)(PageViewElement) {
  render(){
    return this._source.length == 0 ? html`...` : html`
    ${SharedStyles}
    <style>
      :host {
        max-width: 70em;
        margin: auto;
      }
    </style>
    <section>
      <h2>Translation</h2>
      ${ this._fetching ? 
        html`Fetching Data` :
        html`
          ${repeat(Object.keys(this._source.segments), (key) => key, (segmentId, index) => {
            const source = this._source.segments[segmentId];
            const target = this._target.segments[segmentId] || '';
            let suggestions = segmentId == this._activeSegmentId ? this._suggestions[this._suggestionKey(source)] : '';
            return html`<bilara-segment ._segmentId="${segmentId}"
                                        ._sourceString="${source}"
                                        ._targetString="${target}"
                                        ._sourceFilepath="${this._source.filepath}"
                                        ._targetFilepath="${this._target.filepath}"
                                        ._suggestions="${suggestions}"
                                        ._sourceLang="${this._source.language.uid}"
                                        ._targetLang="${this._target.language.uid}"
                                        </bilara-segment>`       
        })}`
      }
    </section>`
  }

  _suggestionKey(string) {
    return [string, this._source.language.uid, this._target.language.uid].join('_');
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
      this._source = state.segmentData.data.root;
      this._target = state.segmentData.data.translation;
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