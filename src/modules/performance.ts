import { app } from 'electron';
import { Context, RunAt } from '../context';
import Module from '../module';
import Checkbox from '../options/checkbox';
import Button from '../options/button';
import SwitchesUI from '../ui/switches';

class SwitchesButton extends Button {
    generate(): HTMLElement {
        let container = super.generate();
        let question = document.createElement('sup');
        question.textContent = '[?]';
        question.classList.add('question');
        question.onclick = () =>
            window.open(
                'https://peter.sh/experiments/chromium-command-line-switches/'
            );

        container.children[0].children[0].insertAdjacentElement(
            'beforeend',
            question
        );
        return container;
    }
}

export default class Performance extends Module {
    name = 'Performance';
    id = 'performance';

    switchList = [
        'renderer-process-limit=100',
        'max-active-webgl-contexts=100',
        'disable-dev-shm-usage',
        'enable-gpu-rasterization',
        'enable-oop-rasterization',
        'enable-webgl',
        'enable-javascript-harmony',
        'enable-future-v8-vm-features',
        'enable-quic',
        'enable-accelerated-2d-canvas',
        'enable-highres-timer',
        'disable-accelerated-video-decode=false',
        'disable-accelerated-video-encode=false',
        'disable-print-preview',
        'disable-metrics-repo',
        'disable-metrics',
        'disable-breakpad',
        'disable-logging',
        'disable-component-update',
        'disable-bundled-ppapi-flash',
        'disable-2d-canvas-clip-aa',
        'disable-hang-monitor',
        'autoplay-policy=no-user-gesture-required',
        'high-dpi-support=1',
        'ignore-gpu-blacklist',
        'disable-background-timer-throttling',
        'disable-renderer-backgrounding',
    ];

    switchesUI = new SwitchesUI(this);

    options = [
        new Checkbox(this, {
            id: 'uncap',
            name: 'Uncap FPS',
            description: 'Disable frame rate limit / VSync',
            needsRestart: true,
        }),
        new Checkbox(this, {
            id: 'inProcessGPU',
            name: 'In-process GPU',
            description: 'Support for OBS and Nvidia Shadowplay',
            needsRestart: true,
        }),
        new SwitchesButton(this, {
            name: 'Chromium Switches',
            description: 'Edit Chromium command-line switches',
            id: '',
            label: 'Edit',
            needsRestart: true,

            onChange: this.switchesUI.open.bind(this.switchesUI),
        }),
    ];

    contexts = [
        {
            context: Context.Startup,
            runAt: RunAt.LoadStart,
        },
    ];

    main() {
        let uncap = this.config.get('uncap', false);
        console.log('Uncap FPS:', uncap);

        if (uncap) {
            console.log('Uncapping FPS');
            this.uncapFPS();
        }

        this.switches();
    }

    uncapFPS() {
        app.commandLine.appendSwitch('disable-frame-rate-limit');
        app.commandLine.appendSwitch('disable-gpu-vsync');
    }

    switches() {
        let switches = this.config.get('switches', {});

        for (let s of this.switchList)
            if (switches[s] === undefined) switches[s] = true;

        console.log('Loading switches...');
        for (let s of Object.keys(switches)) {
            console.log('  ', s, switches[s]);
            if (typeof switches[s] === 'boolean' && !switches[s]) continue;

            let [name, value] = s.split('=');
            app.commandLine.appendSwitch(name, value || '');
        }

        app.commandLine.appendSwitch('no-sandbox');
        if (this.config.get('inProcessGPU', false))
            app.commandLine.appendSwitch('in-process-gpu');
    }
}
