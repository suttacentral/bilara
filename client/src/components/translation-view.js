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

store.addReducers({
  segmentData
});

import {fetchSegmentData} from '../actions/segment-data.js';

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
        () => html`${repeat(Object.keys(this._source), (key) => key, (segmentId, index) => {
          const source = this._source[segmentId];
          const target = this._target[segmentId] || '';
          if (segmentId == '_meta') {
            return html``
          }
          return html`<bilara-segment _segmentId="${segmentId}"
                                      _sourceString="${source}"
                                      _targetString="${target}"></bilara-segment>`
                   
        })}
          <pre><code>${JSON.stringify(this._segmentData, null, 2)}</code></pre>`
      )}
    </section>`
  }

  static get properties() { 
    return {
      _segmentData: { type: Object },
      _fetching: { type: Boolean },
      _failure: { type: Boolean }
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
  }
}

window.customElements.define('translation-view', TranslationView);