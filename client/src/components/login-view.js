import { html, LitElement } from 'lit-element';

import { SharedStyles } from './shared-styles.js';

class LoginView extends LitElement {
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
      <p><a href="/api/login" target="_self">Login using Github</a>.</p>
      
      </div>
    `
  }
}


window.customElements.define('login-view', LoginView);
