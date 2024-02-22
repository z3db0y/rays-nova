import { ipcMain, ipcRenderer } from 'electron';
import { Context, RunAt } from '../context';
import Module from '../module';

export default class BetterConsole extends Module {
    name = 'Better Console';
    id = 'betterconsole';
    options = [];

    contexts = [
        {
            context: Context.Startup,
            runAt: RunAt.LoadStart,
        },
        {
            context: Context.Game,
            runAt: RunAt.LoadStart,
        },
    ];

    main() {
        const originalLog = console.log;

        let timeString = () => {
            let date = new Date();
            let hours = date.getHours().toString().padStart(2, '0');
            let minutes = date.getMinutes().toString().padStart(2, '0');
            let seconds = date.getSeconds().toString().padStart(2, '0');
            let milliseconds = date
                .getMilliseconds()
                .toString()
                .padStart(3, '0');
            return `${hours}:${minutes}:${seconds}.${milliseconds}`;
        };

        ipcMain.on('log', (event, type, ...args) => {
            originalLog(
                '\x1b[33m' +
                    timeString() +
                    ' \x1b[36mRENDERER \x1b[0m>\x1b[' +
                    (type == 'error' ? '31' : '0') +
                    'm',
                ...args,
                '\x1b[0m'
            );
        });

        console = new Proxy(console, {
            get: (target, prop) => {
                if (!['log', 'info', 'error'].includes(prop as string))
                    return Reflect.get(target, prop);
                return (...args: any[]) => {
                    originalLog(
                        '\x1b[33m' +
                            timeString() +
                            ' \x1b[35mMAIN     \x1b[0m>\x1b[' +
                            (prop == 'error' ? '31' : '0') +
                            'm',
                        ...args,
                        '\x1b[0m'
                    );
                };
            },
        });
    }

    renderer(): void {
        window.console = new Proxy(window.console, {
            set: (target, prop, value) => {
                if (!['log', 'info', 'error'].includes(prop as string))
                    return true;
                return Reflect.set(target, prop, value);
            },
            get: (target, prop) => {
                if (!['log', 'info', 'error'].includes(prop as string))
                    return Reflect.get(target, prop);
                return (...args: any[]) => {
                    try {
                        ipcRenderer.send('log', prop, ...args);
                    } catch {}

                    return Reflect.get(target, prop);
                };
            },
        });
    }
}
