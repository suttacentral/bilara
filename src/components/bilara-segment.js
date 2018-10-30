import {
  html, LitElement
}
from '@polymer/lit-element';

class BilaraSegment extends LitElement {
  static get properties() {
    return {
      sourceString: String,
      targetString: String,
      commentDict: Object,
      segmentId: String,
      active: Boolean
    }
  }

  constructor() {
    super();
    this.addEventListener('focus', (e) => {
      this.dispatchEvent(new CustomEvent("gainedFocus", {
        bubbles: true,
        composed: true,
        detail: {
          segmentId: this.segmentId
        }
      }))
    });
  }

  _blur(e) {
    let value = e.target.value,
      name = e.target.name;
    if (name == 'target' && value == this.targetString) return
    if (name == 'source' && value == this.sourceString) return
    this.dispatchEvent(new CustomEvent("stringChanged", {
      bubbles: true,
      composed: true,
      detail: {
        type: name,
        segmentId: this.segmentId,
        value: value
      }
    }));
  }

  render() {
      return html `
      <style>
        :host {
          display: block;
        }
        textarea {
          resize: none;
        }
        .segment-id {
          font-size: 0.6em;
        }
        .active {
          border-top: 3px solid cyan;
          border-bottom: 3px solid cyan;
        }
        div {

        }

        #wrap {
          display: flex;
          flex-direction: column;
        }

        #strings {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          justify-content: center;
          align-items: flex-start;
          align-content: stretch;
          width: 100%;
          flex-direction: row;
        }

        #comments {
          display: block;
        }

        textarea {
          flex-grow: 2;
        }

        a {
          position: absolute;
          margin-left: -5em;
          margin-top: 1em;
          flex-grow: 0.1;
          padding: 0.1em;
          align-self: center;
        }

        .comment {
          padding: 0.25em;
          display: flex;
        }

        .username {
          flex-grow: 0;
          padding-right: 1em;
          font-size: 80%;
        }

        .comment-text {
          flex-grow: 1;
        }

      </style>
      <a class="segment-id">${this.segmentId}</a>
      <div id="wrap" class=${this.active ? 'active': ''}>
        <div id="strings">

          <textarea class="source" name="source" .value=${this.sourceString} disabled=disabled></textarea>
          <textarea class="target" name="target" .value=${this.targetString} @blur=${ this._blur }></textarea>
        </div>
        ${ this.active ? html`<div id="comments">
        ${
          Object.keys(this.commentDict).map(name => {
            let value = this.commentDict[name];
            return html `<div class="comment"><span class="username">${name}: </span><span class="comment-text">${value}</span></div>`
          })
        }</div>` : html`` } </div >
        `
  }
}

customElements.define('bilara-segment', BilaraSegment);
