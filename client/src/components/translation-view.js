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
      ${ this._root.length == 0 || !this._root.segments ? 
        html`Fetching Data ${JSON.stringify(this._root)}` :
        html`
          ${Object.keys(this._root.segments).map(segmentId => {
            const root = this._root.segments[segmentId];
            const translation = this._translation.segments[segmentId] || '';
            let suggestions = segmentId == this._activeSegmentId ? this._suggestions[this._suggestionKey(root)] : '';
            return html`<bilara-segment ._segmentId="${segmentId}"
                                        ._rootString="${root}"
                                        ._translationString="${translation}"
                                        ._rootFilepath="${this._root.path}"
                                        ._translationFilepath="${this._translation.path}"
                                        ._suggestions="${suggestions}"
                                        ._rootLang="${this._root.language.uid}"
                                        ._translationLang="${this._translation.language.uid}"
                                        ._pushState="${this._pushState[segmentId]}">
                                        </bilara-segment>`
        })}`
      }
    </section>`
  }

  _suggestionKey(string) {
    return [string, this._root.language.uid, this._translation.language.uid].join('_');
  }

  static get properties() { 
    return {
      _segmentData: { type: Object },
      _activeSegmentId: { type: String },
      _fetching: { type: Boolean },
      _failure: { type: Boolean },
      _root: { type: Object },
      _translation: { type: Object },
      _suggestions: { type: Object },
      _pushState: { type: Object }
    }
  }

  stateChanged(state) {
    this._fetching = state.segmentData.isFetching;
    if (state.segmentData.data) {
      this._root = state.segmentData.data.root;
      this._translation = state.segmentData.data.translation;
    } else {
      this._root = {};
      this._translation = {};
    }

    this._pushState = state.segmentData.pushState || {};
    
    this._failure = state.segmentData.failure;
    this._activeSegmentId = state.segmentData.activeSegmentId;
    this._suggestions = state.search.suggestions;
  }
}

window.customElements.define('translation-view', TranslationView);