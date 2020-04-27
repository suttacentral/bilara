/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html, css } from 'lit-element';



export const sharedStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
  }

  a{
  color: var(--bilara-primary-color);
  }

  .circle {
    display: block;
    width: 64px;
    height: 64px;
    margin: 0 auto;
    text-align: center;
    border-radius: 50%;
    background: var(--bilara-primary-color);
    color: var(--app-light-text-color);
    font-size: 30px;
    line-height: 64px;
  }
`;

export const formStyles = css`
      form {
        padding: 0 8px 16px;
        display: block
      }

      label {
        cursor: pointer;
      }

      input[type="search"] {
        border: 1px solid var(--bilara-primary-color);
        border-radius: 2px;
        padding: 4px 8px;
        width: 100%;
        border-radius: 12px;
        background-color: var(--bilara-primary-background-color);
        color: var(--bilara-primary-text-color);
        font-family: "source sans pro"

      }
      input::placeholder {
        opacity: 0.5;
      }
      input:focus::placeholder {
        opacity: 0;
      }
      label {
        font-size: 80%;
        margin-top: 8px;
        margin-right: 16px;
        display: inline-block;
       
      }
      .search-label{
      	display: block;
      	 width: 100%;
      }
      .button-row {
        display: flex;
        justify-content: space-between
      }
      button {
        display: inline-block;
        color: var(--bilara-secondary-color);
        font-weight: 600;
        font-size: 0.8rem;
        padding: 4px 8px;
        border: 1px solid var(--bilara-secondary-color);
        border-radius: 8px;
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: .05em;
        background-color: var(--bilara-primary-background-color);
        white-space: nowrap;
        line-height: 1;
      }
      form button {
        margin: 16px 4px 0px 0px;
      }

      .undo-button {
        color: var(--bilara-red);
        border: 1px solid var(--bilara-red);
        background-color: var(--bilara-primary-background-color);
      }
      .undo-button:hover {
        background-color: var(--bilara-red);
        color: var(--bilara-secondary-background-color);
      }

`;