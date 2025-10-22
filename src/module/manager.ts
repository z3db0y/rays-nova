import Module from './index';
import { Context, RunAt } from '../context';
import { readdirSync } from 'fs';
import { join } from 'path';
import { session } from 'electron';
import { waitFor } from '../util';

type OnBeforeRequestFunction = (
    details: Electron.OnBeforeRequestListenerDetails,
    callback: (response: Electron.Response) => void
) => any;

export default class Manager {
    loaded: Module[] = [];
    private static beforeRequestCallbacks: OnBeforeRequestFunction[] = [];

    private directory = join(__dirname, '../modules/');
    private context: Context;
    private settingsInjected = false;

    private cached: Module[] = [];

    constructor(context: Context) {
        this.context = context;
    }

    listAll(dir = this.directory): Module[] {

        for (let file of readdirSync(dir, { withFileTypes: true })) {
            let path = dir + file.name;
            if (file.isDirectory()) this.cached.push(...this.listAll(path + '/'));
            else {
                try {
                    let ModuleClass = require(path).default;

                    let index = this.cached.findIndex(x => x instanceof ModuleClass);
                    if (index >= 0) continue;
                    
                    let module = new ModuleClass();
                    if (module instanceof Module) this.cached.push(module);
                } catch {}
            }
        }

        return this.cached;
    }

    load(runAt: RunAt) {
        this.injectSettings();

        let modules = this.listAll();
        for (let module of modules) {
            if (
                module.contexts.findIndex(
                    (ctx) => ctx.context == this.context && ctx.runAt == runAt
                ) == -1
            )
                continue;

            module.manager = this;

            try {
                module.init?.(this.context);
            } catch (initError) {
                console.error(
                    `Error while initializing module ${module.name}:`,
                    initError
                );
                return;
            }

            try {
                if (
                    this.context == Context.Startup ||
                    this.context == Context.Common
                )
                    module.main?.();
                else {
                    module.renderer?.(this.context);
                }
            } catch (moduleError) {
                console.error(
                    `Error while running module ${module.name}:`,
                    moduleError
                );
                return;
            }

            this.loaded.push(module);
        }
    }

    private async injectSettings() {
        if (
            this.settingsInjected ||
            this.context == Context.Startup ||
            this.context == Context.Common
        )
            return;
        this.settingsInjected = true;

        let settings: any = await waitFor(
            () =>
                window.windows?.[0] &&
                window.windows[0].getSettings &&
                window.windows[0]
        );

        for (let type of Object.keys(settings.tabs)) {
            settings.tabs[type].splice(settings.tabs[type].length - 1, 0, {
                name: 'CSS',
                categories: [],
            });
        }

        let gen = settings.getSettings;
        settings.getSettings = (...args) => {
            let result = gen.apply(settings, args);
            setTimeout(this.generateSettings.bind(this, settings));
            return result;
        };
    }

    private generateSettings(settings: any) {
        let removedNoSettingsFound = false;

        let { settingSearch: search } = settings;
        search = search?.toLowerCase() ?? '';

        let tabName =
            settings.tabs[settings.settingType][settings.tabIndex]?.name;
        let isClientTab = tabName == 'Client';

        let holder = document.getElementById('settHolder');

        if (isClientTab) {
            if (!removedNoSettingsFound) {
                holder.children[0].remove();
                removedNoSettingsFound = true;
            }

            let container = document.createElement('div');
            container.classList.add('setBodH');

            for (let i = 0; i < 2; i++) {
                let need = i == 0 ? 'refresh' : 'restart';
                let color = i == 0 ? 'aqua' : 'red';

                let setting = document.createElement('div');
                setting.classList.add('settName');

                let nameCont = document.createElement('span');
                nameCont.classList.add('detailedSettingName');

                let name = document.createElement('span');
                name.classList.add('name');
                name.textContent = ' Requires ' + need;

                let star = document.createElement('span');
                star.textContent = '*';
                star.style.color = color;

                name.insertAdjacentElement('afterbegin', star);
                nameCont.appendChild(name);
                setting.appendChild(nameCont);
                container.appendChild(setting);
            }

            holder.appendChild(container);
        }

        for (let module of this.listAll()) {
            let moduleInSearch = module.name.toLowerCase().includes(search);
            let genModule =
                (isClientTab ||
                    (search &&
                        (moduleInSearch ||
                            module.options.some((option) =>
                                option.name.toLowerCase().includes(search)
                            )))) &&
                module.options.length;

            if (genModule) {
                if (!removedNoSettingsFound && holder.children.length == 1) {
                    holder.children[0].remove();
                    removedNoSettingsFound = true;
                }

                let container = document.createElement('div');
                container.classList.add('setBodH');

                let header = document.createElement('div');
                header.classList.add('setHed');
                header.onclick = () => {
                    let isOpen = container.style.display !== 'none';

                    if (isOpen) {
                        header.children[0].textContent = 'keyboard_arrow_right';
                        container.style.display = 'none';
                    } else {
                        header.children[0].textContent = 'keyboard_arrow_down';
                        container.style.display = '';
                    }
                };

                header.textContent = module.name;
                header.insertAdjacentHTML(
                    'afterbegin',
                    '<span class="material-icons plusOrMinus">keyboard_arrow_down</span>'
                );
                holder.append(header, container);

                for (let option of module.options) {
                    let genOption =
                        isClientTab ||
                        (search &&
                            (moduleInSearch ||
                                option.name.toLowerCase().includes(search)));
                    if (genOption) container.appendChild(option.generate());
                }
            }
        }
    }

    static registerBeforeRequestCallback(callback: OnBeforeRequestFunction) {
        if (!Manager.beforeRequestCallbacks.includes(callback))
            Manager.beforeRequestCallbacks.push(callback);
    }

    static unregisterBeforeRequestCallback(callback: OnBeforeRequestFunction) {
        let index = Manager.beforeRequestCallbacks.indexOf(callback);
        if (index !== -1) Manager.beforeRequestCallbacks.splice(index, 1);
    }

    static async onBeforeRequest(
        details: Electron.OnBeforeRequestListenerDetails,
        finalCallback: (response: Electron.Response) => void
    ) {
        for (let callback of Manager.beforeRequestCallbacks) {
            let response = await new Promise<Electron.Response>((resolve) =>
                callback(details, resolve)
            );

            if (response.cancel || response.redirectURL)
                return finalCallback(response);
        }

        finalCallback({ cancel: false });
    }

    initBeforeRequest() {
        session.defaultSession.webRequest.onBeforeRequest(
            Manager.onBeforeRequest
        );
    }
}
