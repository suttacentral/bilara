import { css, html } from 'lit-element';

import { repeat } from 'lit-html/directives/repeat.js';

import { store } from '../store.js';

import { updateTertiary } from '../actions/app.js';

import { formToJSON } from '../form.js';

import { BilaraDialog } from './bilara-dialog.js';

class BilaraColumnsDialog extends BilaraDialog {
    static get properties(){
        return {
            _fieldNames: Array,
            _existingFields: Array,
            _lockedFields: Array,
            _keyValue: String,
            _searchQuery: { type: String },
            _collapsedGroups: { type: Object }
        }
    }

    constructor() {
        super();
        this._searchQuery = '';
        this._collapsedGroups = {};
    }

    static get styles() {
        return [
          css`
            :host {
                position: relative;
                display: flex;
                flex-direction: column;
                background-color: var(--bilara-black);
                border: 2px solid var(--bilara-secondary-color);
                border-radius: 8px;
                min-height: 300px;
                max-height: 80vh;
                width: 420px;
                max-width: 90vw;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                overflow: hidden;
            }

            .dialog-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px 12px;
                border-bottom: 1px solid var(--bilara-secondary-background-color);
                flex-shrink: 0;
            }

            .dialog-title {
                font-size: 1rem;
                font-weight: 600;
                color: var(--bilara-primary-text-color);
                margin: 0;
                letter-spacing: 0.02em;
            }

            .field-count {
                font-size: 0.75rem;
                color: var(--bilara-secondary-text-color);
                background: var(--bilara-secondary-background-color);
                padding: 2px 8px;
                border-radius: 10px;
            }

            .search-container {
                padding: 12px 20px;
                border-bottom: 1px solid var(--bilara-secondary-background-color);
                flex-shrink: 0;
            }

            .search-input {
                width: 100%;
                padding: 6px 12px;
                font-size: 0.85rem;
                font-family: var(--bilara-sans, sans-serif);
                color: var(--bilara-primary-text-color);
                background-color: var(--bilara-secondary-background-color);
                border: 1px solid transparent;
                border-radius: 6px;
                outline: none;
                box-sizing: border-box;
                transition: border-color 0.2s;
            }

            .search-input:focus {
                border-color: var(--bilara-secondary-color);
            }

            .search-input::placeholder {
                color: var(--bilara-secondary-text-color);
                opacity: 0.6;
            }

            #columns {
                flex: 1;
                overflow-y: auto;
                padding: 8px 0;
            }

            /* Scrollbar */
            #columns {
                scrollbar-width: thin;
                scrollbar-color: var(--bilara-secondary-background-color) transparent;
            }
            #columns::-webkit-scrollbar {
                width: 6px;
            }
            #columns::-webkit-scrollbar-track {
                background: transparent;
            }
            #columns::-webkit-scrollbar-thumb {
                background: var(--bilara-secondary-background-color);
                border-radius: 3px;
            }

            .group {
                margin-bottom: 4px;
            }

            .group-header {
                display: flex;
                align-items: center;
                padding: 6px 20px;
                cursor: pointer;
                user-select: none;
                transition: background-color 0.15s;
            }

            .group-header:hover {
                background-color: var(--bilara-secondary-background-color);
            }

            .group-toggle {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                margin-right: 8px;
                font-size: 0.7rem;
                color: var(--bilara-secondary-text-color);
                transition: transform 0.2s;
                flex-shrink: 0;
            }

            .group-toggle.collapsed {
                transform: rotate(-90deg);
            }

            .group-name {
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--bilara-secondary-text-color);
            }

            .group-badge {
                font-size: 0.65rem;
                color: var(--bilara-secondary-text-color);
                margin-left: 8px;
                opacity: 0.7;
            }

            .group-items {
                display: grid;
                grid-template-rows: 1fr;
                transition: grid-template-rows 0.25s ease;
            }

            .group-items.collapsed {
                grid-template-rows: 0fr;
            }

            .group-items-inner {
                min-height: 0;
                overflow: hidden;
            }

            .checkbox {
                display: flex;
                align-items: center;
                padding: 5px 20px 5px 44px;
                cursor: pointer;
                transition: background-color 0.12s;
            }

            .checkbox:hover {
                background-color: var(--bilara-secondary-background-color);
            }

            .checkbox input[type="checkbox"] {
                width: 14px;
                height: 14px;
                margin: 0 10px 0 0;
                cursor: pointer;
                accent-color: var(--bilara-secondary-color);
                flex-shrink: 0;
            }

            .checkbox .field-label {
                font-size: 0.85rem;
                font-weight: 400;
                color: var(--bilara-primary-text-color);
                word-break: break-all;
            }

            .checkbox.locked .field-label {
                color: var(--bilara-orange, orange);
            }

            .checkbox.locked {
                opacity: 0.7;
                cursor: default;
            }

            .no-results {
                padding: 24px 20px;
                text-align: center;
                color: var(--bilara-secondary-text-color);
                font-size: 0.85rem;
            }

            .dialog-footer {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                padding: 12px 20px;
                border-top: 1px solid var(--bilara-secondary-background-color);
                flex-shrink: 0;
            }

            button {
                font-size: 0.8rem;
                font-weight: 600;
                padding: 6px 16px;
                border-radius: 6px;
                cursor: pointer;
                border: 1px solid;
                transition: opacity 0.15s;
                font-variant-caps: normal;
                letter-spacing: 0.02em;
            }

            button:hover {
                opacity: 0.85;
            }

            .accept-button {
                color: var(--bilara-black);
                background-color: var(--bilara-green);
                border-color: var(--bilara-green);
            }

            .cancel-button {
                color: var(--bilara-primary-text-color);
                background-color: transparent;
                border-color: var(--bilara-secondary-text-color);
            }
          `
        ]
    }

    /**
     * Extract a category prefix from a field name.
     * Field names follow the pattern: type-lang-edition (e.g. root-pli-ms, translation-en-sujato)
     */
    _getGroupName(field) {
        const prefix = field.split('-')[0];
        return prefix || 'other';
    }

    /**
     * Group fields by their type prefix.
     */
    _getGroupedFields() {
        if (!this._fieldNames) return {};

        const query = (this._searchQuery || '').toLowerCase().trim();
        const groups = {};

        for (const field of this._fieldNames) {
            if (query && !field.toLowerCase().includes(query)) continue;
            const group = this._getGroupName(field);
            if (!groups[group]) groups[group] = [];
            groups[group].push(field);
        }

        // Sort fields within each group
        for (const g of Object.keys(groups)) {
            groups[g].sort();
        }

        return groups;
    }

    _toggleGroup(groupName) {
        this._collapsedGroups = {
            ...this._collapsedGroups,
            [groupName]: !this._collapsedGroups[groupName]
        };
    }

    _onSearchInput(e) {
        this._searchQuery = e.target.value;
    }

    render() {
        const grouped = this._getGroupedFields();
        const groupNames = Object.keys(grouped).sort();
        const lockedFields = this._lockedFields || [];
        const existingFields = this._existingFields || [];
        const totalFields = this._fieldNames ? this._fieldNames.length : 0;
        const selectedCount = existingFields.length;

        return html`
            <form @submit=${this._accept}>
              <div class="dialog-header">
                <span class="dialog-title">Columns</span>
                <span class="field-count">${selectedCount} / ${totalFields}</span>
              </div>

              <div class="search-container">
                <input
                  class="search-input"
                  type="text"
                  placeholder="Filter fields..."
                  .value=${this._searchQuery}
                  @input=${this._onSearchInput}
                >
              </div>

              <div id="columns">
                ${groupNames.length === 0
                  ? html`<div class="no-results">No matching fields</div>`
                  : repeat(groupNames, (groupName) => {
                    const fields = grouped[groupName];
                    const isCollapsed = !!this._collapsedGroups[groupName];
                    return html`
                      <div class="group">
                        <div class="group-header" @click=${() => this._toggleGroup(groupName)}>
                          <span class="group-toggle ${isCollapsed ? 'collapsed' : ''}">▼</span>
                          <span class="group-name">${groupName}</span>
                          <span class="group-badge">${fields.length}</span>
                        </div>
                        <div class="group-items ${isCollapsed ? 'collapsed' : ''}">
                          <div class="group-items-inner">
                            ${repeat(fields, (field) => {
                                const isLocked = lockedFields.includes(field);
                                const isChecked = existingFields.includes(field);
                                return html`
                                    <label class="checkbox ${isLocked ? 'locked' : ''}">
                                        <input name="columns" type="checkbox" value="${field}"
                                            ?disabled="${isLocked}"
                                            ?checked="${isChecked}"
                                        ><span class="field-label">${field}</span>
                                    </label>`;
                            })}
                          </div>
                        </div>
                      </div>`;
                  })
                }
              </div>

              <div class="dialog-footer">
                <button type="button" class="cancel-button" @click=${this._cancel}>Cancel</button>
                <button type="submit" class="accept-button">Accept</button>
              </div>
            </form>
        `
    }

    _accept(e) {
        e.preventDefault();
        const data = formToJSON(e.target);
        let selectedFields = data.columns;
        store.dispatch(updateTertiary(this._keyValue, selectedFields));
        this.dispatchEvent(new Event('close-overlay', {bubbles: true}));
        window.location.reload(false);
    }
}

customElements.define('bilara-columns-dialog', BilaraColumnsDialog);
