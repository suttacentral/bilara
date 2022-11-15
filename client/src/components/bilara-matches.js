import { LitElement, html } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

export class BilaraMatches extends LitElement{
    render() {
      return html`
      <style>

      #matches {
          font-size: 80%;
          color: var(--bilara-empasized-text-color);
          margin: 8px 5% 0;
}

del{
  color: var(--bilara-orange)
}
ins{
  color: var(--bilara-blue)
}
mark{
  background-color: var(--bilara-yellow);
  color: var(--bilara-empasized-text-color);
}

.row{
  display: flex;
          background-color: var(--bilara-secondary-background-color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
          transition: all 0.3s cubic-bezier(.25,.8,.25,1);
          border-radius: 8px;
          justify-content: space-evenly;
          flex-direction: row;
          margin: 0 5% 8px
}

.row:hover {
         box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
         cursor:pointer;
}

      .column {
          flex-direction: column;
      }

      .root_string, .translation {
flex-basis: 50%;
    padding: 0 8px;
    max-width: 40rem;
    margin: 0 16px;
      }
      .row + .row {
        border-top: 1px dotted rgba(0,0,0,0.2);
      }

      .match_quality {
          padding: 0 1px;
          float: right;
          background-color: #e0e0e0;
          border-radius: 4px;
          display: none
      }
  
      </style>
      
      <div id="matches" class="column">
      ${ this._matches.map( (item) => html`
      
        <div class="row">
        <span class="root_string">${unsafeHTML(item.highlighted)}</span>
        
        <span class="translation" 
                  @mousedown=${this._mousedownEvent}
                  @mouseup=${this._mouseupEvent}
                  @mousemove=${this._mousemoveEvent}
                  title="${item.segment_ids.length}"
                  >${item.translation}</span>
        `)}        
        </div>`
    }
  
    static get properties(){
      return {
        _matches: {type: Object}
      }
    }

    _mousedownEvent(e) {
      this.clicked = true;
      this.isDragging = false;
    }

    _mousemoveEvent(e) {
      this.isDragging = true;
    }

    _mouseupEvent(e) {
      if (this.isDragging) {
        this.isDragging = false;
      } else if (this.clicked) {
        const string = e.target.textContent;
        this.dispatchEvent(new CustomEvent('match', {
            detail: {string},
            bubbles: true,
            composed: true
          }))
      }
      this.clicked = false;
    }

  
    setFocus(dataType) {
      let e = this.shadowRoot.querySelector(`[data-type=${dataType}]`);
      e.focus();
    }
  }
  
  window.customElements.define('bilara-matches', BilaraMatches);
