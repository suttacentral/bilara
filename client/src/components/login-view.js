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

  _onClick(e) {
    e.currentTarget.open = !e.currentTarget.open;
    e.stopPropagation();
  }

  _navigate(e) {
    const url = e.currentTarget.href;
    console.log(e.currentTarget,  url);
    e.preventDefault();
    e.stopPropagation();
    history.pushState({page: url}, "Translate " + url, url);
    store.dispatch(navigate(decodeURIComponent(location.pathname)))
  }

  static get properties(){
    return {
      _name: {type: String},
      _tree: {type: Object},
      open: {type: Boolean, reflect: true}
    }
  }
}


window.customElements.define('login-view', LoginView);
