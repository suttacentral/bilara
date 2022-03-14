import { LitElement, css, html } from 'lit';

import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';

import { closeDialog } from '../actions/dialog.js'

export const dialogStyles = css`
:host
{
    position: relative;;

    display: flex;

    border: 4px solid var(--bilara-magenta);
    border-radius: 50%;
    background-color: var(--bilara-black);

    min-height: 400px;

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

export class BilaraDialog extends connect(store)(LitElement) {
    static get styles() {
        return dialogStyles
    }

    _closeOverlay() {
        store.dispatch(closeDialog());
    }

    _cancel() {
        this._closeOverlay();
    }
}

customElements.define('bilara-dialog', BilaraDialog);
