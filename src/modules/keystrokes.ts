import { readFileSync } from 'fs';
import { Context, RunAt } from '../context';
import Module from '../module';
import { join } from 'path';

export default class Keystrokes extends Module {
    name = 'Keystrokes';
    id = 'keystrokes';
    contexts = [
        {
            context: Context.Game,
            runAt: RunAt.LoadEnd,
        }
    ];

    options = [];

    container?: HTMLDivElement;
    
    keys: {
        w?: HTMLDivElement,
        a?: HTMLDivElement,
        s?: HTMLDivElement,
        d?: HTMLDivElement,
        lmb?: HTMLDivElement,
        rmb?: HTMLDivElement,
        space?: HTMLDivElement,
    } = {};

    renderer() {
        let rawHTML = readFileSync(
            join(__dirname, '../../assets/html/keystrokes.html'),
            'utf8'
        );

        this.container = document.createElement('div');
        this.container.innerHTML = rawHTML;
        this.container.style.cssText = `
            position: fixed;
            z-index: 999;
        `;

        document.body.appendChild(this.container);

        let keyNames = ['w', 'a', 's', 'd', 'lmb', 'rmb', 'space'];

        for (let i = 0; i < keyNames.length; i++) {
            let element = document.getElementById(
                'raysnova_key' + keyNames[i].toUpperCase()
            );

            this.keys[keyNames[i]] = element;
        }

        console.log(this.keys);

        document.addEventListener('keydown', event => {
            let keyName = event.key.toLowerCase();
            if (keyName === ' ') keyName = 'space';

            let key = this.keys[keyName];
            if (key) key.classList.add('active');
        });

        document.addEventListener('keyup', event => {
            let keyName = event.key.toLowerCase();
            if (keyName === ' ') keyName = 'space';

            let key = this.keys[keyName];
            if (key) key.classList.remove('active');
        });
    }
}