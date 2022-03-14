/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html, css } from 'lit';



export const sharedStyles = css`
  :host
{
    display: block;

    box-sizing: border-box;
}

a
{
    color: var(--bilara-primary-color);
}

.circle
{
    font-size: 30px;
    line-height: 64px;

    display: block;

    width: 64px;
    height: 64px;
    margin: 0 auto;

    text-align: center;

    color: var(--app-light-text-color);
    border-radius: 50%;
    background: var(--bilara-primary-color);
}

`;

export const formStyles = css`
      form
{
    display: block;;

    padding: 0 8px 16px;
}

label
{
    cursor: pointer;
}

input[type='search']
{
    font-family: var(--bilara-sans);

    width: 100%;
    padding: 4px 8px;

    color: var(--bilara-primary-text-color);
    border: 1px solid var(--bilara-primary-color);
    border-radius: 2px;
    border-radius: 12px;
    background-color: var(--bilara-primary-background-color);
}

input::placeholder
{
    opacity: .5;
}

input:focus::placeholder
{
    opacity: 0;
}

label
{
    font-size: 80%;

    display: inline-block;

    margin-top: 8px;
    margin-right: 16px;
}

.search-label
{
    display: block;

    width: 100%;
}

.button-row
{
    display: flex;

    justify-content: space-between;
}

button
{
    font-size: .8rem;
    font-weight: 600;
    line-height: 1;

    display: inline-block;
    display: inline-block;

    padding: 4px 8px;

    white-space: nowrap;
    letter-spacing: .05em;
    text-transform: uppercase;

    color: var(--bilara-secondary-color);
    border: 1px solid var(--bilara-secondary-color);
    border-radius: 8px;
    background-color: var(--bilara-primary-background-color);
}

form button
{
    margin: 16px 4px 0 0;
}

.undo-button
{
    color: var(--bilara-red);
    border: 1px solid var(--bilara-red);
    background-color: var(--bilara-primary-background-color);
}

.undo-button:hover
{
    color: var(--bilara-secondary-background-color);
    background-color: var(--bilara-red);
}

`;