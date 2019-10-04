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
      <p>A Github Account is required for using Bilara, your submissions will be comitted under your Github username.</p>
      <p><a href="/api/login" target="_self">Login using Github</a>.</p>
      
      </div>
    `
  }
}


window.customElements.define('login-view', LoginView);
