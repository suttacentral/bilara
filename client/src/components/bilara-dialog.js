import { LitElement, css, html } from 'lit-element';

class BilaraDialog extends LitElement {
    static get styles() {
        return [
            css`
                :host {
                    background-color: #fff;
                }
                .accept-button {
                    color: black;
                    font-size: 28px;
                    line-height: 28px;
                  }
            `
        ]
    }

    _closeOverlay() {
        this.dispatchEvent(new Event('close-overlay', { bubbles: true }));
    }
    render() {
        return html`

        <slot></slot>
        <button
        class="accept-button"
        @click=${this._closeOverlay}
      >Accept</button>
        `
    }
}

customElements.define('bilara-dialog', BilaraDialog);