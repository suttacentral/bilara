import { LitElement, css, html } from 'lit-element';
import { store } from '../store.js';

import { BilaraDialog, dialogStyles } from './bilara-dialog';

class BilaraDialogPublish extends BilaraDialog {
    static get properties() {
        return {
            _path: String,
            _status: String,
            _url: String,
            _error: String,
        }
    }

    static get styles() {
        
        return [
          dialogStyles,
          css`
          #publish {
              padding: 10%;
          }

          `
        ]
    
    }



    render() {
        return html`
            <form  @submit=${this._accept}>
              <div id="publish">
              ${this._renderContents()}
              </div>
              <button type="submit" ?disabled=${this._status} class="accept-button">${this._status ? '' : 'Accept'}</button>
              <button type="button" class="cancel-button" @click=${this._cancel}>${this._status ? 'Close': 'Cancel'}</button>
            </form>
    `
    }

    _renderContents() {
        if (!this._status) {
            return html`
                <p>This will request publication of ${this._path}</p>
                <p>A GitHub pull request will be automatically created to move the
                translations into the published branch.</p>
            `
        } else if (this._status == 'WORKING') {
            return html`
                <p>Working...</p>
            `
        } else if (this._status == 'DONE') {
            return html`
                <p>Done.</p>
                <p><a href="${this._url}">${this._url}</a>
            `
        } else {
            return html`
                <p>Oops! Something went wrong</p>
                <code class="error">${this._error}</code>
            `
        }
    }

    updated(changedProperties) {
        console.log(changedProperties);
        if (changedProperties.has('_path')) {
            this._status = null;
            this._url = null;
        }
    }

    _accept(e) {
        console.log(e);
        e.preventDefault();
        const state = store.getState(),
                user = state.app.user;

        const requestData = {
            path: this._path,
            user: user.username
        }

        this._status = 'WORKING';

        const request = fetch(`/api/publish`, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                "Content-Type": "application/json",
                "X-Bilara-Auth-Token": user.authToken,
                "X-Bilara-Username": user.username,
            },
            body: JSON.stringify(requestData)
        }).then( (res) => {
          return res.json()
        })
        .then( (data) => {
          console.log(data);
          if (data.error) {
              console.log('Its an error')
              this._status = 'ERROR';
              this._error = data.error;
          } else {
            this._url = data.url;
            this._status = 'DONE';
          }
        }).catch( (e) => {
            console.error(e);
            this._status = 'ERROR';
            this._error = 'Please check the console for more details.';
        });
    }

    
}

customElements.define('bilara-dialog-publish', BilaraDialogPublish);