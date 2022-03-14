import { css, html } from 'lit';


import { repeat } from 'lit/directives/repeat.js';

import { store } from '../store.js';

import { updateTertiary } from '../actions/app.js';

import { formToJSON } from '../form.js';

import { BilaraDialog, dialogStyles } from './bilara-dialog.js';

class BilaraColumnsDialog extends BilaraDialog {
    static get properties(){
        return {
            _fieldNames: Array,
            _existingFields: Array,
            _lockedFields: Array,
            _keyValue: String
        }
    }

    static get styles() {
        
        return [
          dialogStyles,
          css`
          [disabled]{
              color: orange;
          }
          `
        ]
    
    }

    render() {
        return html`
            <form  @submit=${this._accept}>
              <div id="columns">
              ${repeat(this._fieldNames, (field) => html`
              <label class="checkbox">
                <input name="columns" type="checkbox" value="${field}"
                  ?disabled="${this._lockedFields.includes(field) ? 'disabled' : ''}"
                  ?checked="${this._existingFields.includes(field)}"
                >${field}</label>
                `
                )}
              </div>
              <button type="submit" class="accept-button">Accept</button>
              <button type="button" class="cancel-button" @click=${this._cancel}>Cancel</button>

            </form>
    `
    }

    _accept(e) {
        e.preventDefault();
        const data = formToJSON(e.target);
        console.log(data);
        
        let selectedFields = data.columns;
        store.dispatch(updateTertiary(this._keyValue, selectedFields));
        this.dispatchEvent(new Event('close-overlay', {bubbles: true}));
        window.location.reload(false);
    }
}

customElements.define('bilara-columns-dialog', BilaraColumnsDialog);
