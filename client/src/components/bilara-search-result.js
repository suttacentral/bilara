import {
    store
} from '../store.js';
import {
    connect
} from 'pwa-helpers/connect-mixin.js';
import {
    LitElement,
    html,
    css
} from 'lit-element';
import {
    repeat
} from 'lit-html/directives/repeat';


export class BilaraSearchResult extends connect(store)(LitElement) {

    static get properties() {
        return {
            _segmentId: String,
            _sourceField: String,
            _targetField: String,
            _sourceString: String,
            _replacementString: String,
            _originalString: String,
        }
    }

    render() {
        return html `
            <form class="result" id="${this._segmentId}" data-index="${i}" @submit="${this._submitResult}">
            <div class="result-location">
            <a href="/translation/mn23_translation-en-sujato#mn23:43.1" title="Go to MN 23:43.1">MN 23:43.1. The Discourse on the Noble Search</a>
            
            <button type="button" class="undo-button" title="Undo this replace">Revert</button>
            <button type="submit" class="replace-button" title="Replace this term">Replace</button>
            
            </div>
            
            <div class="result-translation-text">Standing to one side, the god Kassapa <mark>recited</mark> this verse in the Buddha’s presence:</div>
            <div class="result-root-text">Ekamantaṃ ṭhito kho māgadho devaputto bhagavantaṃ <mark>gāthāy</mark>a ajjhabhāsi:</div>
        </form>`
    }
}


window.customElements.define('bilara-search-result', BilaraSearchResult);