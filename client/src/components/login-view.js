import { html, LitElement } from 'lit-element';

import { sharedStyles } from './shared-styles.js';

class LoginView extends LitElement {
  static get styles(){
    return [
      sharedStyles
    ]
  }
  render(){
    return html`
      <style>
      div {
        max-width: 40em;
        margin: auto;
      }
      </style>

      <div>
      <ul><li>A Github account is required to use Bilara. <li>Your submissions will be committed under your Github username. <li>Preferably, use your real name for your Github account.</ul>
      <p>To log in, use the log in button on the header.</p>
      
      
      </div>
    `
  }
}




window.customElements.define('login-view', LoginView);
