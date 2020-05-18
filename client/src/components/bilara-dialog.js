import { LitElement, css, html } from 'lit-element';


import { repeat } from 'lit-html/directives/repeat';

import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

import { updateTertiary } from '../actions/app.js';

import { formToJSON } from '../form.js';


const dialogStyles = css`
:host
{
    position: relative;;

    display: flex;

    width: 400px;
    height: auto;
    padding-top: 5%;

    border: 4px solid var(--bilara-magenta);
    border-radius: 50%;
    background-color: var(--bilara-black);

    justify-content: center;
    align-items: center;
}

:host::before
{
    font-size: 5rem;

    position: absolute;
    left: -2rem;

    content: '≽';

    color: var(--bilara-primary-color);
}

:host::after
{
    font-size: 5rem;

    position: absolute;
    right: -2rem;

    content: '≼';

    color: var(--bilara-primary-color);
}

div
{
    position: relative;
}

#columns
{
    padding-bottom: 30%;
}

.checkbox
{
    font-weight: 500;

    display: flex;

    padding: 8px 0;

    color: white;

    align-items: center;
}

label
{
    margin-left: 8px;

    color: var(--bilara-primary-text-color);
}

input
{
    height: 16px;;
    margin: 0;
}

button
{
    font-size: 18px;
    font-weight: 600;

    position: absolute;
    top: -20%;

    width: 80px;
    height: 80px;
    margin: 8px 8px;

    border-radius: 30% 70% 16px 16px;
    background-color: var(--bilara-secondary-background-color);

    font-variant-caps: all-small-caps;
}

button:hover
{
    background-color: var(--bilara-primary-background-color);
}

.accept-button
{
    top: 0;
    left: 0;

    color: var(--bilara-green);
    border: 4px solid var(--bilara-green);
    border-radius: 70% 30% 16px 16px;
}

.cancel-button
{
       top: 0;
    right: 0;

    color: var(--bilara-red);
    border: 4px solid var(--bilara-red);
    border-radius: 30% 70% 16px 16px;
}

`

class BilaraDialog extends LitElement {
    static get styles() {
        return dialogStyles
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
    _cancel() {
        this.dispatchEvent(new Event('close-overlay', {bubbles: true}));
    }
}

customElements.define('bilara-columns-dialog', BilaraColumnsDialog);
