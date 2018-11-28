import { html } from '@polymer/lit-element';
import { PageViewElement } from './page-view-element.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';


import { connect } from 'pwa-helpers/connect-mixin.js';

// This element is connected to the Redux store.
import { store } from '../store.js';


class ReduxView extends connect(store)(PageViewElement) {
  render(){
    return html`
    ${SharedStyles}
    <section>
      <h2>The Store</h2>
      <pre><code>${JSON.stringify(this._state, null, 2)}</code></pre>
    </section>
  `
  }

  stateChanged(state) {
    this._state = state;
  }
}

window.customElements.define('redux-view', ReduxView);
