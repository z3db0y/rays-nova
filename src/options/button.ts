import Module from '../module/index';
import ClientOption from './index';

export default class Checkbox extends ClientOption {
    label: string;
    color?: string;

    constructor(module: Module, opts: {
        name: string,
        id: string,
        description: string,
        color?: 'purple' | 'pink' | 'cyan' | 'red',
        needsRefresh?: boolean,
        needsRestart?: boolean,
        onChange?(event: any): void,

        label: string
    }) {
        super(module, opts);
        this.label = opts.label;
        this.color = opts.color;
    }
    
    generate(): HTMLElement {
        let container = super.generate();

        let button = document.createElement('div');
        button.classList.add('settingsBtn');
        button.style.width = 'auto';

        button.textContent = this.label;
        if(this.onChange) button.onclick = this.onChange.bind(this);

        container.append(button);
        return container;
    }

    generateBig(): HTMLElement {
        let colors = {
            purple: 'buttonP',
            pink: 'buttonPI',
            cyan: 'buttonG',
            red: 'buttonR'
        };

        let button = document.createElement('div');
        button.className = 'button';
        button.textContent = this.label;
        button.style.width = 'calc(100% - 10px)';
        button.style.fontSize = '20px';
        button.style.padding = '10px 0';

        if(this.color) button.classList.add(colors[this.color]);
        if(this.onChange) button.onclick = this.onChange.bind(this);

        return button;
    }
}