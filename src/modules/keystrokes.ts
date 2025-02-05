import { readFileSync } from 'fs';
import { Context, RunAt } from '../context';
import Module from '../module';
import { join } from 'path';
import { waitFor } from '../util';
import Checkbox from '../options/checkbox';
import Slider from '../options/slider';

export default class Keystrokes extends Module {
    name = 'Keystrokes';
    id = 'keystrokes';
    contexts = [
        {
            context: Context.Game,
            runAt: RunAt.LoadEnd,
        }
    ];

    options = [
        new Checkbox(this, {
            name: 'Enabled',
            id: 'enabled',
            description: 'Show keystrokes'
        }),
        new Slider(this, {
            name: 'X Position',
            id: 'x',
            description: 'How far to the left or right the keystrokes should be',
        }),
        new Slider(this, {
            name: 'Y Position',
            id: 'y',
            description: 'How far up or down the keystrokes should be',
        }),
        new Slider(this, {
            name: 'Scale',
            id: 'scale',
            description: 'The size of the keystrokes',

            min: 0.1,
            max: 3,
            step: 0.1,
        }),
    ];

    container?: HTMLDivElement;
    stylesheet = document.createElement('style');
    
    keys: {
        w?: HTMLDivElement,
        a?: HTMLDivElement,
        s?: HTMLDivElement,
        d?: HTMLDivElement,
        lmb?: HTMLDivElement,
        rmb?: HTMLDivElement,
        space?: HTMLDivElement,
    } = {};

    applyConfig() {
        let rule = this.stylesheet.sheet.cssRules[0] as CSSStyleRule;

        rule.style.setProperty('display', this.config.get('enabled', false) ? '' : 'none');
        rule.style.setProperty('--raysnova-key-scale', this.config.get('scale', 1));
        rule.style.setProperty('--raysnova-key-offset-x', (this.config.get('x', 0) / 100) + '');
        rule.style.setProperty('--raysnova-key-offset-y', (this.config.get('y', 0) / 100) + '');
    }

    renderer() {
        let rawHTML = readFileSync(
            join(__dirname, '../../assets/html/keystrokes.html'),
            'utf8'
        );

        this.container = document.createElement('div');
        this.container.innerHTML = rawHTML;

        this.stylesheet.textContent = 'style + .keystrokes {}';
        this.container.prepend(this.stylesheet);

        document.getElementById('inGameUI').appendChild(this.container);
        this.config.onAnyChange(this.applyConfig.bind(this));
        this.applyConfig();

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