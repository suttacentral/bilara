import { css } from 'lit-element';

export const themes = {
    'bilara': css`
        --bilara-primary-color: #dc322f;
        --bilara-secondary-color: #6c71c4;
        --bilara-primary-background-color: #fdf6e3;
        --bilara-secondary-background-color: #eee8d5;
        --bilara-tertiary-background-color: #BEB9AA;
        --bilara-primary-text-color: #657b83;
        --bilara-emphasized-text-color: #586e75;
        --bilara-secondary-text-color: #93a1a1;
        --bilara-yellow: #b58900;
        --bilara-orange: #cb4b16;
        --bilara-red: #dc322f;
        --bilara-magenta: #d33682;
        --bilara-violet: #6c71c4;
        --bilara-blue: #268bd2;
        --bilara-cyan: #2aa198;
        --bilara-green: #859900;
        --bilara-black: #002b36;
        --bilara-footer-height: 108px;
        color: var(--bilara-primary-text-color)
    `,
'none': css`

`,
'greenscale': css`
        --bilara-primary-color: #0f0;
        --bilara-secondary-color: #f0f;
        --bilara-primary-background-color: #0f0;
        --bilara-secondary-background-color: #f0f;
        --bilara-tertiary-background-color: #0f0;
        --bilara-primary-text-color: #909;
        --bilara-emphasized-text-color: #808;
        --bilara-secondary-text-color: #707;
        --bilara-yellow: #6f6;
        --bilara-orange: #5f5;
        --bilara-red: #4f4;
        --bilara-magenta: #fff;
        --bilara-violet: #efe;
        --bilara-blue: #dfd;
        --bilara-cyan: #cfc;
        --bilara-green: #b0b;
        --bilara-black: #afa;
        --bilara-footer-height: 108px;
        color: var(--bilara-primary-text-color)
`
}
