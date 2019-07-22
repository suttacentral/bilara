import { LitElement, html } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';

export class BilaraSuggestions extends LitElement{
    render() {
      return html`
      <style>

      #suggestions {
          font-size: 80%;
          margin: 0 5%;
          background-color: #eeeeee
      }

      .row {
          flex-direction: row;
      }

      .row + .row {
          border-top: 1px solid #bbbbbb;
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

      .match_quality {
          padding: 0 1px;
          float: right;
          background-color: #e0e0e0;
          border-radius: 4px;
      }
  
        div {
          display: flex;
  
          margin-bottom: 5px;
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