import { ipcMain, ipcRenderer } from 'electron';
import { Context, RunAt } from '../context';
import Module from '../module';
import Checkbox from '../options/checkbox';
import { window } from '../main';
import TextInput from '../options/textinput';
import Slider from '../options/slider';

export default class Chat extends Module {
    name = 'Miscellaneous';
    id = 'misc';
    options = [
        new Checkbox(this, {
            name: 'Show client watermark',
            description: '',
            id: 'watermark',
            onChange(value) {
                document.body.style.setProperty(
                    '--watermark-display',
                    value ? '' : 'none'
                );
            },
            defaultValue: true,
        }),
        new Checkbox(this, {
            name: 'Placebo FPS',
            description: 'Multiply the FPS counter to show a bigger number',
            id: 'placeboFps.enabled',
            onChange: () => this.placeboFps(),
            defaultValue: false,
        }),
        new Slider(this, {
            name: 'Placebo FPS multiplier',
            description: 'How much to multiply the FPS counter',
            id: 'placeboFps.multiplier',
            onChange: () => this.placeboFps(),
            defaultValue: 1,
            min: 1,
            max: 10,
            step: 0.1,
        }),
        new Checkbox(this, {
            name: 'Lock window size',
            description: '',
            id: 'lockWindowSize',
            onChange() {
                ipcRenderer.send('updateWindowSizeLock');
            }
        }),
        new TextInput(this, {
            name: 'Window size',
            description: '',
            label: '1920x1080',
            id: 'windowSize',
            onChange() {
                ipcRenderer.send('updateWindowSizeLock');
            }
        })
    ];

    contexts = [
        {
            context: Context.Common,
            runAt: RunAt.LoadStart,
        },
        {
            context: Context.Game,
            runAt: RunAt.LoadEnd,
        }
    ];

    updateWindowSizeLock() {
        let shouldLock = this.config.get('lockWindowSize', false);
        let [w, h] = this.config.get('windowSize', '0x0').split('x');

        console.log('updating window lock', w, h);
        window.setResizable(true);

        if (shouldLock && !isNaN(w) && !isNaN(h)) {            
            window.setSize(parseInt(w), parseInt(h));
            window.setResizable(false);
        }
    }

    placeboFpsObserver: MutationObserver;
    placeboFpsApplied = false;

    placeboFps() {
        let enabled = this.config.get('placeboFps.enabled', false);
        let multiplier = this.config.get('placeboFps.multiplier', 1);

        if (this.placeboFpsObserver) this.placeboFpsObserver.disconnect();
        this.placeboFpsObserver = null;

        if (!enabled) return;

        let ingameFPS = document.getElementById('ingameFPS');
        let menuHolder = document.getElementById('menuHolder');
        let menuFPS = document.getElementById('menuFPS');

        if (!ingameFPS) return;

        this.placeboFpsObserver = new MutationObserver(() => {
            if (this.placeboFpsApplied) {
                this.placeboFpsApplied = false;
                return;
            }

            let fps = parseFloat(ingameFPS.textContent);
            fps = Math.round(fps * multiplier + Math.random() * multiplier);
            
            this.placeboFpsApplied = true;

            ingameFPS.textContent = fps + '';
            if (menuHolder.style.display != 'none') menuFPS.textContent = fps + '';
        });
        
        this.placeboFpsObserver.observe(ingameFPS, { childList: true });
    }

    renderer() {
        this.placeboFps();
    }

    main() {
        this.updateWindowSizeLock();
        ipcMain.on('updateWindowSizeLock', () => this.updateWindowSizeLock());
    }
}
