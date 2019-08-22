import { LitElement, html } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';

export class BilaraSuggestions extends LitElement{
    render() {
      return html`
      <style>

      #suggestions {
          font-size: 80%;
          color: var(--bilara-empasized-text-color);
          margin: 0 5%;
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

      .root_string, .translations {
          flex: 1;
          padding: 0 8px;
      }

      .translation {
        display: block;
      }
      .translation + .translation{
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
        <span class="root_string">${unsafeHTML(item.diffed_root)}</span>
        
        <span class="translations" class="row">
        <span class="match_quality">${Math.round(100*item.match_quality)}%</span>
        ${ item.translations.map( (translation) => html`
            <span class="translation" 
                  @click="${this._clickEvent}"
                  title="${translation.count}: ${translation.id}">${translation.translation}</span>
        `)}
        </span>`)}        
        </div>`
    }
  
    static get properties(){
      return {
        _suggestions: {type: Object}
      }
    }

    _clickEvent(e) {
      const string = e.target.textContent;
      this.dispatchEvent(new CustomEvent('suggest', {
          detail: {string},
          bubbles: true,
          composed: true
        }))
    }
  
    setFocus(dataType) {
      let e = this.shadowRoot.querySelector(`[data-type=${dataType}]`);
      e.focus();
    }
  }
  
  window.customElements.define('bilara-suggestions', BilaraSuggestions);