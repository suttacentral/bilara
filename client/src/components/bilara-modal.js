import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { LitElement, html, css } from 'lit-element';

import { sharedStyles } from './shared-styles.js';

import { closeDialog } from '../actions/dialog.js';

import './bilara-dialog-publish.js';

class BilaraModal extends connect(store)(LitElement) {
  static get styles(){
    return [
      sharedStyles,
      css`
      :host {
        position: fixed;
        display: flex;
        z-index: 2147483647;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background-color: rgb(0,0,0, 0.4);
        justify-content: center;
￼       align-items: center;
      }

      .dialog {
        width: 400px;
        height: auto;
        padding-top: 5%;
      }
      :host([hidden]) {
          display: none;
      }
      
      `
    ]
  }

  render(){
    return html`<div class="dialog" role="dialog">
        ${this._renderDialog()}
      </div>
    `
  }

  _renderDialog() {
      switch (this._dialogType) {
          case 'PUBLISH':
              return html`<bilara-dialog-publish></bilara-dialog-publish>`;
          default:
      } 
      return html``
  }

  constructor(){
    super();
    document.addEventListener('keydown', e => {
      console.log(e);
      if (e.key == 'Escape') {
        store.dispatch(closeDialog());
      }
    })
  }

  static get properties () {
      return {
          hidden: {type: Boolean, reflect: true},
          _dialogType: String
      }
  }  

  stateChanged(state) {
    this.hidden = !state.dialog.dialogType;
    this._dialogType = state.dialog.dialogType;
  }
}




window.customElements.define('bilara-modal', BilaraModal);