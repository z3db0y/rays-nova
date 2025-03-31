import { ipcMain, ipcRenderer } from 'electron';
import { Context, RunAt } from '../context';
import Module from '../module';
import Checkbox from '../options/checkbox';
import { window } from '../main';
import TextInput from '../options/textinput';

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
            runAt: RunAt.LoadStart,
        },
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

    main() {
        this.updateWindowSizeLock();
        ipcMain.on('updateWindowSizeLock', () => this.updateWindowSizeLock());
    }
}
