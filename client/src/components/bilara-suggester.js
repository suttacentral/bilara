import { store } from '../store.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { LitElement, html, css } from 'lit';

import { sharedStyles } from './shared-styles.js';

import { closeDialog } from '../actions/dialog.js';

import { formToJSON } from '../form.js';

import './bilara-dialog-publish.js';
bilara-modal
class BilaraSuggester extends LitElement {
  static get styles(){
    return [
      sharedStyles,
      css`
      `
    ]
  }

  render(){
    return html`<form class="suggest">
        <fieldset>
          <legend>Suggestion by NitPicker</legend> 
          <input type="text" id="suggestion" name="suggestion" title="Write suggestion here" value="${this._originalValue}" />  
          <input type="text" id="message" name="message" title="Leave a message if you wish" /> 
          <button type="submit" @submit=${this._submit} title="Submit suggestion and/or message">Submit</button>
      </fieldset>
    </form>`
  }

  static get properties () {
      return {
          _originalValue: String
      }
  }

  _submit() {
    console.log('Submitting suggestion');
    console.log(formToJSON(this));
  }

  stateChanged(state) {
    this.hidden = !state.dialog.dialogType;
    this._dialogType = state.dialog.dialogType;
  }
}




window.customElements.define('bilara-modal', BilaraModal);