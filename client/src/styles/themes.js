import { css } from 'lit-element';


import { store } from '../store.js';

export const defaultTheme = 'suriya';

export const themes = {
    'suriya': css`
        --bilara-primary-color: #dc322f;
        --bilara-secondary-color: #6c71c4;
        --bilara-primary-background-color: #fdf6e3;
        --bilara-secondary-background-color: #eee8d5;
        --bilara-tertiary-background-color: #BEB9AA;
        --bilara-primary-text-color: #657b83;
        --bilara-emphasized-text-color: #586e75;
        --bilara-secondary-text-color: #93a1a1;
        --bilara-yellow: rgba(255, 194, 2, 0.3);
        --bilara-orange: #cb4b16;
        --bilara-red: #dc322f;
        --bilara-magenta: #d33682;
        --bilara-violet: #6c71c4;
        --bilara-blue: #268bd2;
        --bilara-cyan: #2aa198;
        --bilara-green: #859900;
        --bilara-black: #002b36;
        --bilara-footer-height: 108px;
        --scrollbar-size: 8px;
        --scrollbar-minlength: 1.5rem; 
        color: var(--bilara-primary-text-color)
    `,
        'candima': css`
        --bilara-primary-color: #dc322f;
        --bilara-secondary-color: #6c71c4;
        --bilara-primary-background-color: #002b36;
        --bilara-secondary-background-color: #073642;
        --bilara-tertiary-background-color: #073642;
        --bilara-primary-text-color: #839496;
        --bilara-emphasized-text-color: #93a1a1;
        --bilara-secondary-text-color: #586e75;
        --bilara-yellow: rgba(255, 194, 2, 0.1);
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
'manussa': css`
        --bilara-primary-color: black;
        --bilara-secondary-color: #757575;
        --bilara-primary-background-color: white;
        --bilara-secondary-background-color: #efefef;
        --bilara-tertiary-background-color: #DDDDDD;
        --bilara-primary-text-color: black;
        --bilara-emphasized-text-color: black;
        --bilara-secondary-text-color: #757575;
        --bilara-yellow: rgba(255, 194, 2, 0.3);
        --bilara-orange: #FF851B;
        --bilara-red: #FF4136;
        --bilara-magenta: #F012BE;
        --bilara-violet: #B10DC9;
        --bilara-blue: #0074D9;
        --bilara-cyan: #39CCCC;
        --bilara-green: #2ECC40;
        --bilara-black: #111111;
        --bilara-footer-height: 108px;
        color: var(--bilara-primary-text-color)
`,
'yakkha': css`
        --bilara-primary-color: white;
        --bilara-secondary-color: #85144b;
        --bilara-primary-background-color: #111111;
        --bilara-secondary-background-color: #001f3f;
        --bilara-tertiary-background-color: #3D9970;
        --bilara-primary-text-color: white;
        --bilara-emphasized-text-color: white;
        --bilara-secondary-text-color: #AAAAAA;
        --bilara-yellow: rgba(255, 194, 2, 0.1);
        --bilara-orange: #FF851B;
        --bilara-red: #FF4136;
        --bilara-magenta: #F012BE;
        --bilara-violet: #B10DC9;
        --bilara-blue: #0074D9;
        --bilara-cyan: #39CCCC;
        --bilara-green: #2ECC40;
        --bilara-black: #001f3f;
        --bilara-footer-height: 108px;
        color: var(--bilara-primary-text-color)
`,
'deva': css`
        --bilara-primary-color: #92a8d1;
        --bilara-secondary-color: #c5a1a0;
        --bilara-primary-background-color: #f4f6fa;
        --bilara-secondary-background-color: #e9edf5;
        --bilara-tertiary-background-color: #dee4f1;
        --bilara-primary-text-color: rgba(0,0,0,0.5);
        --bilara-emphasized-text-color: rgba(0,0,0,0.7);
        --bilara-secondary-text-color: rgba(0,0,0,0.3);
        --bilara-yellow: #e4f1de;
        --bilara-orange: #FF851B;
        --bilara-red: #ed8986;
        --bilara-magenta: #ed8986;
        --bilara-violet: #B10DC9;
        --bilara-blue: #0074D9;
        --bilara-cyan: #c5a1a0;
        --bilara-green:#70ea73;
        --bilara-black: #DEE4F1;
        --bilara-footer-height: 108px;
        color: var(--bilara-primary-text-color)
`,
'asura': css`
        --bilara-primary-color: #92a8d1;
        --bilara-secondary-color: #c5a1a0;
        --bilara-primary-background-color: #7f7f7f;
        --bilara-secondary-background-color:  rgba(0,0,0,0.3);
        --bilara-tertiary-background-color: #727272;
        --bilara-primary-text-color: #f4f6fa;
        --bilara-emphasized-text-color:  #e9edf5;
        --bilara-secondary-text-color: #dee4f1;
        --bilara-yellow: rgba(228, 241, 222,0.1);
        --bilara-orange: #FF851B;
        --bilara-red: #ed8986;
        --bilara-magenta: #ed8986;
        --bilara-violet: #B10DC9;
        --bilara-blue: #0074D9;
        --bilara-cyan: #c5a1a0;
        --bilara-green: #2ECC40;
        --bilara-black: #727272;
        --bilara-footer-height: 108px;
        color: var(--bilara-primary-text-color)
`,
'gandhabba': css`
        --bilara-primary-color: #92a8d1;
        --bilara-secondary-color: #F661B1;
        --bilara-primary-background-color: #1C1C1C;
        --bilara-secondary-background-color:  #272727;
        --bilara-tertiary-background-color: #25313E;
        --bilara-primary-text-color: rgba(255,255,255,0.8);
        --bilara-emphasized-text-color:  white;
        --bilara-secondary-text-color: #D4D4D4;
        --bilara-yellow: rgba(230, 219, 116,0.1);
        --bilara-orange: #F39B35;
        --bilara-red: #FC4384;
        --bilara-magenta: #8059a2;
        --bilara-violet: #FC4384;
        --bilara-blue: #00A7AA;
        --bilara-cyan: #c5a1a0;
        --bilara-green: #98E342;
        --bilara-black: #272727;
        --bilara-footer-height: 108px;
        color: var(--bilara-primary-text-color)
`,
'niraya': css`
        --bilara-primary-color: #666;
        --bilara-secondary-color: firebrick;
        --bilara-primary-background-color: darkred;
        --bilara-secondary-background-color: red;
        --bilara-tertiary-background-color: #666;
        --bilara-primary-text-color: crimson;
        --bilara-emphasized-text-color: maroon;
        --bilara-secondary-text-color: maroon;
        --bilara-yellow: orange;
        --bilara-orange: orange;
        --bilara-red: red;
        --bilara-magenta: magenta;
        --bilara-violet: fuschia;
        --bilara-blue: blue;
        --bilara-cyan: cyan;
        --bilara-green: tomato;
        --bilara-black: #666;
        --bilara-footer-height: 108px;
        color: var(--bilara-primary-text-color)
`,
'suññatā': css`
        --bilara-black: white;
        --bilara-footer-height: 108px;
`
}


let oldTheme = null,
    styleElement = document.createElement('STYLE');
    
store.subscribe( () => {
  const state = store.getState(),
        theme = state.app.pref.theme || defaultTheme;
  if (oldTheme != theme) {
    
    styleElement.innerHTML = 'body{' + themes[theme] + '}';
    document.body.appendChild(styleElement);
    oldTheme = theme;
  }
})
