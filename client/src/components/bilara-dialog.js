import { LitElement, css, html } from 'lit-element';


import { repeat } from 'lit-html/directives/repeat';

import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

import { updateTertiary } from '../actions/app.js';

class BilaraDialog extends LitElement {
    static get styles() {
        return css`
                :host {
                    background-color: #fff;
                }
                button {
                    color: black;
                    font-size: 28px;
                    line-height: 28px;
                  }
            `
    }

    _closeOverlay() {
        this.dispatchEvent(new Event('close-overlay', { bubbles: true }));
    }
}

customElements.define('bilara-dialog', BilaraDialog);

class BilaraColumnsDialog extends connect(store)(BilaraDialog) {
    static get properties(){
        return {
            _fieldNames: Array,
            _existingFields: Array,
            _lockedFields: Array,
            _keyValue: String
        }
    }

    render() {
        return html`
            <div>
              <lion-checkbox-group id="columns">
              ${repeat(this._fieldNames, (field) => html`
              <lion-checkbox 
                .choiceValue=${field}
                label="${field}"
                ?disabled="${this._lockedFields.includes(field)}"
                ?checked="${this._existingFields.includes(field)}"
                ></lion-checkbox>
                `
                )}
              </lion-checkbox-group>
              <button class="accept-button" @click=${this._accept}>Accept</button>
              <button class="cancel-button" @click=${this._cancel}>Cancel</button>

            </div>
    `
    }

    _accept(e) {
        let selectedFields = e.currentTarget.parentNode.querySelector('#columns').modelValue;
        store.dispatch(updateTertiary(this._keyValue, selectedFields));
        this.dispatchEvent(new Event('close-overlay', {bubbles: true}));
        window.location.reload(false);
    }
    _cancel() {
        this.dispatchEvent(new Event('close-overlay', {bubbles: true}));
    }
}

customElements.define('bilara-columns-dialog', BilaraColumnsDialog);