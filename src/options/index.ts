import Module from '../module';

export default abstract class ClientOption {
    name: string;
    id: string;
    description: string;
    module: Module;

    defaultValue?: any;
    needsRefresh?: boolean;
    needsRestart?: boolean;

    onChange?(value: any): void;

    constructor(module: Module, opts: {
        name: string,
        id: string,
        description: string,
        needsRefresh?: boolean,
        needsRestart?: boolean,
        defaultValue?: any,
        onChange?(value: any): void
    }) {
        this.module = module;
        this.name = opts.name;
        this.id = opts.id;
        this.description = opts.description;
        this.needsRefresh = opts.needsRefresh;
        this.needsRestart = opts.needsRestart;
        this.defaultValue = opts.defaultValue;
        this.onChange = opts.onChange;
    }

    generate(): HTMLElement {
        let container = document.createElement('div');
        container.classList.add('settName');
    
        let nameContainer = document.createElement('span');
        nameContainer.classList.add('detailedSettingName');

        let name = document.createElement('span');
        name.classList.add('name');

        let description = document.createElement('span');
        description.classList.add('description');

        name.innerHTML = this.name;
        description.innerHTML = this.description;

        nameContainer.append(name, description);
        container.append(nameContainer);

        for(let i = 0; i < 2; i++) {
            let need = i == 0 ? this.needsRefresh : this.needsRestart;
            if(!need) continue;

            let star = document.createElement('span');
            let color = i == 0 ? 'aqua' : 'red';
            star.textContent = '*';
            star.style.color = color;

            name.insertAdjacentElement('beforeend', star);
        }

        return container;
    };
}