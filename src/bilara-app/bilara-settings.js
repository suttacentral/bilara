import {html, LitElement} from '@polymer/lit-element';

class BilaraSettings extends LitElement {
  static get properties() {
    return {
      mode: String,
      comments: Object,
      activeSegmentId: String,
      user: Object,
      uid: String,
      fromLang: String,
      toLang: String
    }
  }

  constructor() {
    super();

    this._onCommentChange = this._onCommentChange.bind(this);
    this._onFileLoad = this._onFileLoad.bind(this);
  }


  render() {
    return html`
      <style>
        div {
          display: flex;
          flex-flow: row;
          align-self: center;
          align-items: stretch;
          margin: auto;
          height: 100%;
        }
        span {
          display: inline-flex;
          align-self: center;
        }
        #settings_bar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 2em;
          background-color: #ddffdd;
        }
        #active_segment_id {
          width: 8em;
        }
        label {
          height: 100%;
          display: inline-flex;
          position: relative;
          cursor: pointer;
          user-select: none;
          text-size: 1.25em;
        }

        /* Hide default checkbox */
        label input[type=checkbox] {
          position: absolute;
          opacity: 0;
        }

        label input[type=text] {
          margin-left: 0.5em;
          width: 2em;
          height: 50%;
        }

        label input[name=uid] {
          width: 4em;
        }

        input ~ span {
          border-radius: 0.25em;
          border-color: black;
          background-color: #aaaaaa;
          border: 1px solid #aaaaaa;
          color: #555555;
          padding: 0.5em;
        }

        input:checked ~ .left {
          background-color: yellow;
          border: 1px solid black;
          color: black;

        }

        input:checked ~ .right {
          background-color: yellow;
          border: 1px solid black;
          color: black;

        }

        .right {
          border-top-left-radius: 0em;
          border-bottom-left-radius: 0em;
        }

        .left {
          border-top-right-radius: 0em;
          border-bottom-right-radius: 0em;
        }

      </style>
      <div id="settings_bar">
        <form>
            <label>
              UID: <input type="text" name="uid" value="sn1.1">
            </label>
            <label>
              From: <input type="text" name="from_lang" value="pli">
            </label>
            <label>
              To: <input type="text" name="to_lang" value="en">
            </label>
            <button id="load">Load</button>
        </form>
        <div id="active_segment_id">${this.activeSegmentId}</div>

        <div>
          <label>
            <input type="radio" name="mode" value="submit" checked="checked">
            <span class="left">Submit</span>
          </label>
          <label>
            <input type="radio" name="mode" value="suggest">
            <span class="right">Suggest</span>
          </label>
        </div>

        <div id="user"><a>${ this.user.name }</a></div>

      </div>
    `
  }

  _onFileLoad(e) {


    e.stopPropagation();
    e.stopDefault();
    window.alert('Loading File' + this.$);

  }

  _onCommentChange(e) {
    let value = e.target.value;

    this.dispatchEvent(new CustomEvent("stringChanged", {
      bubbles: true,
      composed: true,
      detail: {
        type: 'comment',
        segmentId: this.segmentId,
        value: value
      }
    }));

    e.target.clear();
  }



}

customElements.define('bilara-settings', BilaraSettings);
