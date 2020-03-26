import { LitElement, html } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';

export class BilaraSuggestions extends LitElement{
    render() {
      return html`
      <style>

      #suggestions {
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
  color: var(--bilara-red);
  background-color: var(--bilara-yellow)
}

.row{
          background-color: var(--bilara-secondary-background-color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
          transition: all 0.3s cubic-bezier(.25,.8,.25,1);
          border-radius: 8px
}

.row:hover {
         box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
         cursor:pointer;
}

      .row {
          flex-direction: row;
      }

      .column {
          flex-direction: column;
      }

      .root_string, .translation {
          flex: 1;
          padding: 0 8px;
          display: block;
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
  
        div {
          display: flex;
          margin-bottom: 8px;
        }
      </style>
      
      <div id="suggestions" class="column">
      ${ this._suggestions.map( (item) => html`
      
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
        _suggestions: {type: Object}
      }
    }

    _mousedownEvent(e) {
      this.isDragging = false;
    }

    _mousemoveEvent(e) {
      this.isDragging = true;
    }

    _mouseupEvent(e) {
      if (this.isDragging) {
        this.isDragging = false;
      } else {
        const string = e.target.textContent;
        this.dispatchEvent(new CustomEvent('suggest', {
            detail: {string},
            bubbles: true,
            composed: true
          }))
      }
    }

  
    setFocus(dataType) {
      let e = this.shadowRoot.querySelector(`[data-type=${dataType}]`);
      e.focus();
    }
  }
  
  window.customElements.define('bilara-suggestions', BilaraSuggestions);