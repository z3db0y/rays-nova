import Preload from './preload';
import ModuleManager from '../module/manager';
import { Context, RunAt } from '../context';

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
        this.moduleManager.load(RunAt.LoadStart);
        document.addEventListener('keydown', event => event.key === 'Escape' && document.exitPointerLock());
    }

    onLoadEnd() {
        this.moduleManager.load(RunAt.LoadEnd);
    }
}