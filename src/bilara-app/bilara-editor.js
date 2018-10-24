import {html, LitElement} from '@polymer/lit-element';


import './bilara-settings';
import  './bilara-segment';




class BilaraEditor extends LitElement {
  static get properties() {
    return {
      source: Object,
      target: Object,
      comment: Object,
      activeSegmentId: String,
      user: {
        type: Object
      }
    }
  }

  constructor() {
    super();
    this.comment = {};
    this.user = {
        name: "guest"
    }
    this.saved = {
      source: {},
      target: {}
    }
    this.addEventListener('gainedFocus', (e) => {
      this.activeSegmentId = e.detail.segmentId;
    });
  }

  ready() {
    super.ready();
    this.addEventListener('stringChanged', (e) => {
      let dataType = e.detail.type,
          segmentId = e.detail.segmentId,
          value = e.detail.value;

      if (dataType == 'comment') {
        if (!this.comment[[this.activeSegmentId]]) this.comment[[this.activeSegmentId]] = {};
        this.comment[this.activeSegmentId][this.user.name] = value;
      } else {
        this[dataType][segmentId] = value;
      }

    });
  }

  _setData({source, target, comment}) {
    this.source = source;
    this.target = target;
    this.comment = comment;
    let keys = Object.keys(this.source);
    if (keys.length > 0 && !this.activeSegmentId) {
      this.activeSegmentId = keys[0];
    }
  }

  render() {
    return html`
      <style>
      :host {
        display: block;
      }
      :host([hidden]) {
        display: none;
      }

      .wrap {
        padding-top: 4em;
        max-width: 60em;
        margin: auto;
      }

      </style>
      <div class="page">

        <div class="wrap">
          ${this.source ? html`
            ${ Object.keys(this.source).map(key => {

              return html`
                <bilara-segment id=${key} .sourceString=${this.source[key]} .targetString=${this.target[key]} .segmentId=${key} .active=${key == this.activeSegmentId} .commentDict=${ this.comment[key] || {} }></bilara-segment>
              `})}` : html``}
        </div>

        ${ this.source ? html`<bilara-settings id="settings" mode="submit" activeSegmentId="${this.activeSegmentId}" user="${this.user}"></bilara-settings>` : html`` }

        <hr>
        <code>${JSON.stringify(this.source)}</code>
        <hr>
        <code>${JSON.stringify(this.target)}</code>
      </div>
    `;
  }
}

customElements.define('bilara-editor', BilaraEditor);
