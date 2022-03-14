import { LitElement, css, html } from 'lit';

import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

import { closeDialog } from '../actions/dialog.js'

export const dialogStyles = css`
:host
{
    position: relative;
    display: flex;
    overflow: auto;

    border: 4px solid var(--bilara-magenta);
    border-radius: 10px;
    background-color: var(--bilara-black);

    justify-content: center;
    max-height: 80%;
}

div
{
    display: flex;
}

form 
{
    display: flex;
    flex-direction: column;
    min-height: min-content;

}

#buttons {
    height: 80px;
}

#columns
{
    flex-direction: column;
}

.checkbox
{
    font-weight: 500;
    display: block;

    padding: 8px 0;

    color: white;
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

export class BilaraDialog extends connect(store)(LitElement) {
    static get styles() {
        return dialogStyles
    }

    _closeOverlay() {
        store.dispatch(closeDialog());
    }

    _cancel() {
        console.log('Clicked cancel');
        this._closeOverlay();
    }
}

customElements.define('bilara-dialog', BilaraDialog);
