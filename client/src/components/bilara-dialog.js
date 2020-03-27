import { LitElement, css, html } from 'lit-element';


import { repeat } from 'lit-html/directives/repeat';

import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

import { updateTertiary } from '../actions/app.js';

class BilaraDialog extends LitElement {
    static get styles() {
        return css`
                :host {
                     background-color: purple;
                    border-radius: 50%;
                    width: 400px;
                    height: auto;
                    padding-top:5%;
                    display: flex;
                    justify-content: center;
                    align-items: center
                }
                lion-checkbox-group{
                    margin-bottom: 16px
                }
                lion-checkbox{
                    padding: 8px 0;
                    color: white;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                }
                label{
                        margin-left: 8px;
                }
                input{
                    margin: 0;
                    height: 16px
                }
                button {
                     background-color: white;
                    font-size: 18px;
                    font-variant-caps: all-small-caps;
                    font-weight: 600;
                    padding: 4px 16px;
                    margin: 8px 8px;
                    border-radius: 8px
                  }
                  button:hover{
                     background-color: chartreuse;
                  }
                  .accept-button{
                    color: green;
                    border: 4px solid green;

                  }
                      .cancel-button{
                    color: red;
                    border: 4px solid red; 
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

    static get styles() {
        
        return [
            super._styles,
            css`
            [disabled]{
                color: orange;
            }
            `
        ]
    
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
