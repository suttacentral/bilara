import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { LitElement, html } from 'lit-element';

import '@lion/input/lion-input.js';

export class BilaraSearch extends connect(store)(LitElement){
  render(){
    return html`
    <lion-input name="search"><div slot="suffix">🔍</div></lion-input>
    `
  }
}

window.customElements.define('bilara-search', BilaraSearch);