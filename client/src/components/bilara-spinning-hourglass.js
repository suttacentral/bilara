
import { LitElement, css, html } from 'lit-element';

class BilaraSpinningHourglass extends LitElement {

    static get styles(){
        return css`
        :host {
            height: 100%;
            margin-top: 30vh;
            border-spacing: 0;
            border-collapse: collapse;
        }
        
        td > span {
            display: inline-block;
            width: 40px;
            height: 40px;
            animation-duration: 4s;
            animation-iteration-count: infinite;
            animation-name: spin;
            animation-timing-function: linear;
        }
        
        span span {
            position: absolute;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.7);
            -webkit-clip-path: polygon(0 0, 100% 0, 50% 100%, 0 0);
            clip-path: polygon(0 0, 100% 0, 50% 100%, 0 0);
        }
        
        span span:first-of-type {
            transform: translateY(-50%);
        }
        
        span span:last-of-type {
            transform: translateY(50%) rotate(180deg);
        }
        
        span span::before {
            content: '';
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bilara-tertiary-background-color);
            animation-duration: 4s;
            animation-iteration-count: infinite;
            animation-name: slide;
            animation-timing-function: linear;
        
        }
        
        span span:last-of-type::before {
            animation-delay: -2s;
        }
        
        @keyframes slide {
            0% {
                transform: translateY(0%);
            }
            
            25% {
                transform: translateY(100%);
            }
            
            50% {
                transform: translateY(100%);
            }
            
            75% {
                transform: translateY(0%);		
            }
            
            100% {
                transform: translateY(0%);		
            }
        }
        
        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }
            
            25% {
                transform: rotate(0deg);
            }
            
            50% {
                transform: rotate(180deg);
            }
            
            75% {
                transform: rotate(180deg);
            }
            
            100% {
                transform: rotate(360deg);
            }
        }
        `
    }
    render() {
        return html`
        <table>
        <td>
            <span>
                <span></span>
                <span></span>
            </span>
        </td>
        </table>`
    }

}

customElements.define('bilara-spinning-hourglass', BilaraSpinningHourglass);