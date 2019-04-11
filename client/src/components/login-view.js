import { html, LitElement } from '@polymer/lit-element';

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
      <p>A Github Account is required for using Bilara</p>
      <p><a href="/login" target="_self">Login using Github</a>.</p>
      
      </div>
    `
  }
}


window.customElements.define('login-view', LoginView);
