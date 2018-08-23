import {html, LitElement} from '@polymer/lit-element';

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
    this._onSourceChange = this._onSourceChange.bind(this);
    this._onTargetChange = this._onTargetChange.bind(this);
  }
  
  _onSourceChange(e) {
    let value = e.target.value;
    if (value == this.sourceString) return
    
    this.dispatchEvent(new CustomEvent("stringChanged", {
      bubbles: true,
      composed: true,
      details: {
        type: 'source',
        segmentId: this.segmentId,
        value: value
      }
    }));
  }    
    
  _onTargetChange(e) {
    let value = e.target.value;
    if (value == this.targetString) return
    
    this.dispatchEvent(new CustomEvent("stringChanged", {
      bubbles: true,
      composed: true,
      detail: {
        type: 'target',
        segmentId: this.segmentId,
        value: value
      }
    }));
  }
  
  ready() {
    super.ready();
    
    this.addEventListener('focus', (e) => {
      this.dispatchEvent(new CustomEvent("gainedFocus", 
        {
          bubbles: true,
          composed: true,
          detail: {
            segmentId: this.segmentId
          }
        }
      ))
    });
  }
    
  _render({sourceString, targetString, segmentId, active, commentDict}) {
    return html`
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
      <a class="segment-id">${segmentId}</a>
      <div id="wrap" class$="${active ? 'active': ''}">
        <div id="strings">
          
          <textarea class="source" value="${sourceString}" onblur="${this._onSourceChange}" disabled=disabled></textarea>
          <textarea class="target" value="${targetString}" onblur="${this._onTargetChange}"></textarea>
        </div>
        ${ active ? html`
          <div id="comments">
            ${ Object.keys(commentDict).map(name => {
              let value = commentDict[name];
              return html`<div class="comment"><span class="username">${name}: </span><span class="comment-text">${value}</span></div>`
            }) }
          </div>` : html`` }
      </div>
      `
  }
}

customElements.define('bilara-segment', BilaraSegment);
