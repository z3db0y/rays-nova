import { Context, RunAt } from '../context';
import Module from '../module';
import UI from '../ui';
import AltManagerUI from '../ui/altmanager';
import Button from '../options/button';
import TextInput from '../options/textinput';
import { waitFor } from '../util';

let encryptionKey = 'a5de16da0bb09720a7a917736c3be0beddc4418816c5f469a31419f1f6d5e592';
export let encrypt = (data: string) => {
    let out = '';
    for (let i = 0; i < data.length; i++) {
        out += String.fromCharCode(
            data.charCodeAt(i) ^
                encryptionKey.charCodeAt(i % encryptionKey.length)
        );
    }
    return out;
};

class AddAltUI extends UI {
    categories = [
        {
            name: '',
            options: [
                new TextInput(this.module, {
                    id: 'editui.username',
                    description: '',
                    label: 'Username',
                    name: 'Username',
                }),
                new TextInput(this.module, {
                    id: 'editui.password',
                    description: '',
                    label: 'Password',
                    name: 'Password',
                    type: 'password',
                }),
            ],
        },
    ];

    buttons = [
        new Button(this.module, {
            label: 'Add',
            color: 'purple',

            name: '',
            id: '',
            description: '',
            onChange: () => {
                let username = this.module.config
                    .get('editui.username', '')
                    .toLowerCase();
                let password = this.module.config.get('editui.password', '');

                if (!username || !password)
                    return (this.module as AltManager).ui.open();

                let alts = [];

                try {
                    let parsed = JSON.parse(
                        window.localStorage.getItem('taxAltManager')
                    );
                    if (Array.isArray(parsed)) alts = parsed;
                } catch {}

                let altIndex = alts.findIndex((a) => a.username === username);
                if (altIndex !== -1)
                    alts[altIndex].password = encrypt(password);
                else
                    alts.push({
                        username,
                        password: encrypt(password),
                    });

                window.localStorage.setItem(
                    'taxAltManager',
                    JSON.stringify(alts)
                );
                this.module.config.delete('editui.username');
                this.module.config.delete('editui.password');
                (this.module as AltManager).ui.open();
            },
        }),
        new Button(this.module, {
            label: 'Cancel',
            color: 'red',

            name: '',
            id: '',
            description: '',
            onChange: () => {
                this.module.config.delete('editui.username');
                this.module.config.delete('editui.password');
                (this.module as AltManager).ui.open();
            },
        }),
    ];

    open() {
        this.buttons[0].label = this.module.config.get('editui.username', '')
            ? 'Save'
            : 'Add';
        super.open();
    }
}

export default class AltManager extends Module {
    id = 'altmanager';
    name = 'Alt Manager';
    options = [];

    contexts = [
        {
            context: Context.Game,
            runAt: RunAt.LoadEnd,
        },
    ];

    button = document.createElement('div');
    ui = new AltManagerUI(this);
    addAltUI = new AddAltUI(this);

    renderer() {
        this.button.className = 'button buttonPI lgn';
        this.button.textContent = 'Alt Manager';
        let firstStyle = {
            width: '300px',
            marginRight: '0',
            marginLeft: '10px',
            paddingBottom: '13px',
            paddingTop: '5px',
        };

        for (let style in firstStyle)
            this.button.style[style] = firstStyle[style];
        document.getElementById('signedOutHeaderBar').append(this.button);
        this.button.onclick = () => this.ui.open();
    }

    loginAlt(username: string) {
        let alts = [];

        try {
            let parsed = JSON.parse(
                window.localStorage.getItem('taxAltManager')
            );
            if (Array.isArray(parsed)) alts = parsed;
        } catch {}

        let alt = alts.find((a) => a.username === username);
        if (!alt) return;

        for (let i = 0; i < 2; i++) {
            window.showWindow(5);
        }

        let windowHolder = document.getElementById('windowHolder');
        let usernameInput = document.getElementById('accName');
        let passwordInput = document.getElementById('accPass');

        if (!windowHolder || !usernameInput || !passwordInput) return;
        windowHolder.style.display = '';

        (usernameInput as HTMLInputElement).value = alt.username;
        (passwordInput as HTMLInputElement).value = encrypt(alt.password);

        setTimeout(async () => {
            window.loginAcc();

            let captcha = await waitFor(
                () => document.getElementById('altcha_checkbox'),
                1000
            ) as HTMLElement | undefined;

            if (captcha) captcha.click();
        }, 100);
    }

    editAlt(username?: string) {
        let alts = [];

        try {
            let parsed = JSON.parse(
                window.localStorage.getItem('taxAltManager')
            );
            if (Array.isArray(parsed)) alts = parsed;
        } catch {}

        let alt = alts.find((a) => a.username === username) || {
            username: '',
            password: '',
        };

        this.config.set('editui.username', alt.username);
        this.config.set('editui.password', encrypt(alt.password));
        this.addAltUI.open();
    }
}
