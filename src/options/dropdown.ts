import Module from '../module/index';
import ClientOption from './index';

export default class Dropdown extends ClientOption {
    options: {
        name: string,
        value: any
    }[];

    constructor(module: Module, opts: {
        name: string,
        id: string,
        description: string,
        needsRefresh?: boolean,
        needsRestart?: boolean,
        onChange?(value: any): void,

        options: {
            name: string,
            value: any
        }[]
    }) {
        super(module, opts);
        this.options = opts.options;
    }

    generate(): HTMLElement {
        let container = super.generate();
        let currValue = this.module.config.get(this.id, this.defaultValue || this.options[0].value);

        let select = document.createElement('select');
        select.classList.add('inputGrey2');

        for(let option of this.options) {
            let opt = document.createElement('option');
            opt.innerText = option.name;
            opt.value = option.value;
            if(option.value == currValue) opt.selected = true;

            select.appendChild(opt);
        }

        select.onchange = () => {
            let value = isNaN(parseFloat(select.value)) ? select.value : parseFloat(select.value);
            this.module.config.set(this.id, value);
            if(this.onChange) this.onChange(value);
        }

        container.appendChild(select);
        return container;
    }
}