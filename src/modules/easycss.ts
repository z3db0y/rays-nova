import { Context, RunAt } from '../context';
import Module from '../module';
import { waitFor } from '../util';
import Button from '../options/button';
import AddCSSUI from '../ui/addcss';
import { existsSync, readFileSync } from 'fs';
import TextInput from '../options/textinput';

export default class EasyCSS extends Module {
    name = 'EasyCSS';
    id = 'easycss';
    options = [];
    element = document.createElement('style');
    ruleElement = document.createElement('style');

    contexts = [{
        context: Context.Game,
        runAt: RunAt.LoadStart
    }];

    addCSSUI = new AddCSSUI(this);

    async renderer() {
        waitFor(() => document.body).then((body: HTMLElement) => body.append(this.element, this.ruleElement));
        this.applyCSS();

        await waitFor(() => window.windows?.[0] && window.windows[0].getSettings && window.windows[0]);

        let settings = window.windows[0];
        let gen = settings.getSettings;
        settings.getSettings = (...args) => {
            let isCSSTab = settings.tabs[settings.settingType][settings.tabIndex]?.name == 'CSS';

            let ret = gen.apply(settings, args);
            if(isCSSTab) setTimeout(this.injectTab.bind(this));
            return ret;
        }
    }

    injectTab() {
        let settHolder = document.getElementById('settHolder');
        if(!settHolder) return;
        settHolder.innerHTML = '';

        let list = this.config.get('list', []) || [];

        if(list.length) {
            let header = document.createElement('div');
            header.classList.add('setHed');
            header.innerText = 'Added CSS';
            settHolder.append(header);
        } else {
            let noCSS = document.createElement('div');
            noCSS.classList.add('setHed');
            noCSS.innerText = 'No CSS added yet';
            settHolder.append(noCSS);
        }

        for(let css of list) {
            let isApplied = this.config.get('active', -1) == list.indexOf(css);

            let cont = document.createElement('div');
            cont.classList.add('setBodH');

            let elem = document.createElement('div');
            elem.classList.add('settName');
            
            elem.textContent = css.name + (existsSync(css.path) ? '' : ' (File not found)');

            let apply = document.createElement('div');
            apply.innerText = isApplied ? 'Reset' : 'Apply';
            apply.onclick = () => {
                if(isApplied) this.config.set('active', -1);
                else this.config.set('active', list.indexOf(css));
                this.applyCSS();
                this.injectTab();
            }
            apply.style.backgroundColor = isApplied ? '#aa0000' : '#00aa00';


            let edit = document.createElement('div');
            edit.innerText = 'Edit';
            edit.style.backgroundColor = '#aa5500';
            edit.onclick = () => this.addCSSUI.open({ ...css, index: list.indexOf(css) });

            let remove = document.createElement('div');
            remove.innerText = 'Remove';
            remove.style.backgroundColor = '#aa0000';
            remove.onclick = () => {
                let list = this.config.get('list', []);
                list.splice(list.indexOf(css), 1);
                this.config.set('list', list);
                this.injectTab();
            };

            for(let i = 0; i < 3; i++) {
                let button = [apply, edit, remove][i];
                button.classList.add('settingsBtn');
                button.style.width = 'auto';
            }

            elem.append(remove, edit, apply);
            cont.append(elem);
            settHolder.append(cont);
        }

        let addNew = new Button(this, {
            label: 'Add new',
            onChange: this.addCSSUI.open.bind(this.addCSSUI, null),

            name: '',
            id: '',
            description: ''
        });

        settHolder.append(addNew.generateBig());

        let variableHeader = document.createElement('div');
        variableHeader.classList.add('setHed');
        variableHeader.innerText = 'Variables (Advanced)';
        settHolder.append(variableHeader);

        let variableHolder = document.createElement('div');
        variableHolder.classList.add('setBodH');

        this.parseVariables(this.element.sheet, variableHolder);
        if(variableHolder.children.length) settHolder.append(variableHolder);
        else variableHeader.textContent = 'No variables found';
    }

    async applyCSS() {
        let activeCSS = this.config.get('active', -1);
        let css = this.config.get('list.' + activeCSS, null);
        this.element.innerHTML = '';

        if(!css || !css.name || !css.path || !existsSync(css.path)) return;
    
        this.element.onload = this.applyVariables.bind(this);
        this.element.textContent = readFileSync(css.path).toString();
    }

    applyVariables() {
        if(!this.element.sheet) return;

        let vars = this.config.get('variables', {}) || {};
        let str = ':root {\n';

        for(let key in vars) {
            let value = vars[key];
            if(!value) continue;
            str += `    ${key}: ${value};\n`;
        }

        str += '}';
        this.ruleElement.textContent = str;
    }

    parseVariables(sheet: CSSStyleSheet, variableHolder: HTMLElement) {
        if(sheet?.cssRules?.length) for(let rule of sheet.cssRules) {
            if(rule instanceof CSSImportRule) {
                this.parseVariables(rule.styleSheet, variableHolder);
                continue;
            }

            if(!(rule instanceof CSSStyleRule)) continue;
            if(!rule.selectorText.startsWith(':root')) continue;

            for(let declaration of rule.style) {
                if(!declaration.startsWith('--')) continue;
                let value = rule.style.getPropertyValue(declaration);

                let input = new TextInput(this, {
                    id: 'variables.' + declaration,
                    name: declaration.slice(2),
                    description: '',
                    label: value,
                    onChange: this.applyVariables.bind(this)
                });

                variableHolder.append(input.generate());
            }
        }
    }
}