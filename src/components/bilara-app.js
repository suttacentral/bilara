import {LitElement, html} from '@polymer/lit-element';


class BilaraApp extends LitElement {
  static get properties() {
    location: String
  }

  constructor() {
    super();
  }

  render() {
    return html`<bilara-editor id="editor"></bilara-editor>`
  }
}


window.customElements.define('bilara-app', BilaraApp);
