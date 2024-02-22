import TextInput from '../options/textinput';
import Button from '../options/button';
import UI from './index';
import { basename } from 'path';

export default class AddCSSUI extends UI {
    categories = [
        {
            name: '',
            options: [
                new TextInput(this.module, {
                    name: 'Name',
                    id: 'editui.name',
                    description: '',
                    label: 'CSS',
                }),
                new Button(this.module, {
                    name: 'Path to file',
                    id: '',
                    description: '',
                    label: 'Select file',
                    onChange: (event) => {
                        let input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.css';
                        input.click();
                        input.onchange = () => {
                            let file = input.files?.[0];
                            if (!file) return;

                            this.module.config.set('editui.path', file.path);
                            event.target.innerText = basename(file.path);
                        };
                        input.remove();
                    },
                }),
            ],
        },
    ];
    buttons = [
        new Button(this.module, {
            label: 'Save',
            color: 'purple',
            onChange: () => {
                let name = this.module.config.get('editui.name', '');
                let path = this.module.config.get('editui.path', '');
                let existing = this.module.config.get('editui.index', -1);

                this.module.config.delete('editui.name');
                this.module.config.delete('editui.path');
                this.module.config.delete('editui.index');
                if (!name || !path) return this.buttons[1].onChange(null);

                let list = this.module.config.get('list', []) || [];

                if (existing === -1)
                    list.push({
                        name,
                        path,
                    });
                else
                    list[existing] = {
                        name,
                        path,
                    };

                this.module.config.set('list', list);
                this.buttons[1].onChange(null);
            },

            name: '',
            id: '',
            description: '',
        }),
        new Button(this.module, {
            label: 'Cancel',
            color: 'red',
            onChange: () => {
                window.showWindow?.(1);
            },

            name: '',
            id: '',
            description: '',
        }),
    ];

    open(existing?: { name: string; path: string; index: number }) {
        this.name = existing ? 'Edit CSS' : 'Add CSS';
        this.module.config.set('editui.name', existing?.name || '');
        this.module.config.set('editui.path', existing?.path || '');
        if (existing) this.module.config.set('editui.index', existing.index);
        this.categories[0].options[1].label = existing
            ? basename(existing.path)
            : 'Select file';

        super.open();
    }
}
