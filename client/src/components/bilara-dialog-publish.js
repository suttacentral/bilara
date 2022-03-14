import {
  store
} from '../store.js';
import {
  LitElement,
  css,
  html
} from 'lit';

import {
  BilaraDialog,
  dialogStyles
} from './bilara-dialog';

import {
  setPublishData
} from '../actions/dialog.js';

import {
  updatePath
} from '../actions/browse.js';

class BilaraDialogPublish extends BilaraDialog {
  static get styles() {

    return [
      dialogStyles,
      css `
          #publish {
              padding: 10%;
          }

          `
    ]

  }

  render() {
    return html `
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
      if (this._PRUrl) {
        return html `
          <p>A Pull Request already exists. Accept to add any new changes to the Pull Request.</p>
          <p><a href="${this._PRUrl}">${this._PRUrl}</a>
        `
      } else {
        return html `
          <p>This will request publication of ${this._path}</p>
          <p>A GitHub pull request will be automatically created to move the
          translations into the published branch.</p>
          <p>Click the accept button to proceed.</p>
        `
      }
    } else if (this._status == 'WORKING') {
      return html `
        <p>Working...</p>
        <p>This will take a few moments, you may close the dialog if you wish.</p>
      `
    } else if (this._status == 'DONE') {
      return html `
        <p>Done.</p>
        <p><a href="${this._url}">${this._url}</a>
      `
    } else {
      return html `
        <p>Oops! Something went wrong</p>
        <code class="error">${this._error}</code>
      `
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
      }).then((res) => {
        return res.json()
      })
      .then((data) => {
          if (data.error) {
            store.dispatch(setPublishData({
              status: 'ERROR',
              error: data.error
            }))
          } else {
            store.dispatch(setPublishData({
              url: data.url,
              status: 'DONE'
            }))
            store.dispatch(updatePath({
              path: this._path + '/_publish_state',
              value: {
                state: 'PULL_REQUEST',
                url: data.url
              }
            }))
          }}).catch((e) => {
          console.error(e);
          store.dispatch(setPublishData({
            status: 'ERROR',
            error: 'Please check the console for more details.'
          }))
        });
      }

    static get properties() {
      return {
        _path: String,
        _status: String,
        _url: String,
        _PRUrl: String,
        _error: String,
      }
    }

    stateChanged(state) {
      this._path = state.dialog.publishData.path;
      this._status = state.dialog.publishData.status;
      this._url = state.dialog.publishData.url;
      this._PRUrl = state.dialog.publishData.PRUrl;
      this._error = state.dialog.publishData.error;
    }



  }

  customElements.define('bilara-dialog-publish', BilaraDialogPublish);