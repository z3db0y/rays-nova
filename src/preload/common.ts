import Preload from './preload';
import ModuleManager from '../module/manager';
import { Context, RunAt } from '../context';
import { ipcRenderer } from 'electron';

export default class CommonPreload extends Preload {
    context: Context;
    private moduleManager: ModuleManager;

    constructor(context: Context) {
        super();
        window.exports = {};
        this.context = context;
        this.moduleManager = new ModuleManager(this.context);
    }

    onLoadStart() {
        if (!this.context) { // disconnected page
            (window as any).disableProxy = function(event: Event) {
                let target = event.target as HTMLButtonElement;
                ipcRenderer.send('disableProxy');
            
                target.disabled = true;
                target.textContent = 'Proxy disabled!';

                setTimeout(() => {
                    target.disabled = false;
                    target.textContent = 'Disable proxy';
                }, 1000);
            }
        }

        this.moduleManager.load(RunAt.LoadStart);
        document.addEventListener('keydown', event => event.key === 'Escape' && document.exitPointerLock());
        delete window.exports; // Prevents the game from detecting electron
    }

    onLoadEnd() {
        this.moduleManager.load(RunAt.LoadEnd);
    }
}