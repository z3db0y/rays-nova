import UI from './index';
import Button from '../options/button';
import TextInput from '../options/textinput';

export default class RPCButtonsUI extends UI {
    name = 'Edit Rich Presence Buttons';

    categories = [
        {
            name: 'First button',
            options: [
                new TextInput(this.module, {
                    name: 'Label',
                    description: '',
                    id: 'buttons.0.label',
                    label: 'Label',
                }),
                new TextInput(this.module, {
                    name: 'URL',
                    description: '',
                    id: 'buttons.0.url',
                    label: 'URL',
                }),
            ],
        },
        {
            name: 'Second button',
            options: [
                new TextInput(this.module, {
                    name: 'Label',
                    description: '',
                    id: 'buttons.1.label',
                    label: 'Label',
                }),
                new TextInput(this.module, {
                    name: 'URL',
                    description: '',
                    id: 'buttons.1.url',
                    label: 'URL',
                }),
            ],
        },
    ];
    buttons = [
        new Button(this.module, {
            label: 'Back to settings',
            color: 'purple',
            name: '',
            description: '',
            id: '',
            onChange: () => {
                window.showWindow?.(1);
            },
        }),
    ];
}
