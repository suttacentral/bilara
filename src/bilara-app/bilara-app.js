import {LitElement, html} from '@polymer/lit-element';
import {installRouter} from '@pwa-helpers/router.js';

class BilaraApp extends LitElement {
  render() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>

    `;
  }
  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'bilara-app'
      }
    };
  }
}

window.customElements.define('bilara-app', BilaraApp);
