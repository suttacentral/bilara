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
    return this._root.length == 0 ? html`...` : html`
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
          ${repeat(Object.keys(this._root.segments), (key) => key, (segmentId, index) => {
            const root = this._root.segments[segmentId];
            const target = this._target.segments[segmentId] || '';
            let suggestions = segmentId == this._activeSegmentId ? this._suggestions[this._suggestionKey(root)] : '';
            return html`<bilara-segment ._segmentId="${segmentId}"
                                        ._rootString="${root}"
                                        ._targetString="${target}"
                                        ._rootFilepath="${this._root.path}"
                                        ._targetFilepath="${this._target.path}"
                                        ._suggestions="${suggestions}"
                                        ._rootLang="${this._root.language.uid}"
                                        ._targetLang="${this._target.language.uid}"
                                        </bilara-segment>`       
        })}`
      }
    </section>`
  }

  _suggestionKey(string) {
    return [string, this._root.language.uid, this._target.language.uid].join('_');
  }

  static get properties() { 
    return {
      _segmentData: { type: Object },
      _activeSegmentId: { type: String },
      _fetching: { type: Boolean },
      _failure: { type: Boolean },
      _root: { type: Object },
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
      this._root = state.segmentData.data.root;
      this._target = state.segmentData.data.translation;
    } else {
      this._root = {};
      this._target = {};
    }
    
    this._failure = state.segmentData.failure;
    this._activeSegmentId = state.segmentData.activeSegmentId;
    this._suggestions = state.search.suggestions;
  }
}

window.customElements.define('translation-view', TranslationView);