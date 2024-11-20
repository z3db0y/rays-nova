import { readFileSync } from 'fs';
import { Context, RunAt } from '../context';
import Module from '../module';
import { join } from 'path';
import { waitFor } from '../util';

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

        document.getElementById('inGameUI').appendChild(this.container);

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

        let fadeBg = document.getElementById('instructionsFadeBG');

        waitFor(() => fadeBg.style.opacity == '0').then(() => {
            let canvases = document.body.getElementsByTagName('canvas');

            for (let i = canvases.length-1; i >= 0; i--) {
                let canvas = canvases[i];

                if (!canvas.id && !canvas.className) {
                    
                    canvas.addEventListener('mousedown', event => {
                        if (event.button > 2 || event.button == 1) return;

                        let key = this.keys[event.button ? 'rmb' : 'lmb'];
                        if (key) key.classList.add('active');
                    });

                    canvas.addEventListener('mouseup', event => {
                        if (event.button > 2 || event.button == 1) return;

                        let key = this.keys[event.button ? 'rmb' : 'lmb'];
                        if (key) key.classList.remove('active');
                    });

                    break;
                }
            }
        });
    }
}