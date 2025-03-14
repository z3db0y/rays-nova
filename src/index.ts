import {
    app,
    autoUpdater,
    BrowserWindow,
    screen,
    protocol,
    ipcMain,
} from 'electron';
import ModuleManager from './module/manager';
import createMainWindow, { handleNavigation } from './main';
import config from './config';
import { Context, RunAt } from './context';
import { join } from 'path';
import { get } from 'https';

export const launchKey = 'FUCK YENDIS';
const discord = 'EhafAs6UA3';

export default async function verify(input: TemplateStringsArray) {
    let str = input[0];
    let count = 0;
    let first = '';
    let assembled = '';

    for (let char of str) {
        let match = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(char);
        if (match && !first) first = char;

        if (match) count++;
        else {
            if (count > 1) {
                assembled += first;
                if (first == 'K') assembled += ' ';
            }

            first = '';
            count = 0;
        }
    }

    if (assembled != launchKey) return process.exit(1337);

    let moduleManager = new ModuleManager(Context.Startup);
    moduleManager.load(RunAt.LoadStart);

    await app.whenReady();
    moduleManager.load(RunAt.LoadEnd);
    moduleManager.initBeforeRequest();

    protocol.registerFileProtocol('client-resource', (request, callback) => {
        let path = request.url.replace('client-resource://', '');
        callback({ path: join(__dirname, path) });
    });

    app.name = '[Rays] Nova';
    launch(launchKey);
}

function updater(setTitle: (title: string) => void) {
    return new Promise<void>((resolve) => {
        autoUpdater.on('update-available', (info) => {
            setTitle(`New update found: v${info.version}`);
        });

        autoUpdater.on('download-progress' as any, (progress) => {
            setTitle(`Downloading update... ${progress.percent.toFixed(2)}%`);
        });

        autoUpdater.on('update-downloaded', () => {
            setTitle('Update downloaded. Restarting...');
            setTimeout(
                autoUpdater.quitAndInstall.bind(autoUpdater, true, true),
                1000
            );
        });

        autoUpdater.on('update-not-available', resolve);
        if (!app.isPackaged) return resolve();

        try {
            autoUpdater.checkForUpdates();
        } catch {
            resolve();
        }
    });
}

async function getKanyeQuote() {
    return new Promise<string>((resolve, reject) => {
        get('https://api.kanye.rest/', (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data).quote);
                } catch {
                    reject();
                }
            });
        }).on('error', reject);
    });
}

function splash() {
    let { workAreaSize: primaryDisplay } = screen.getPrimaryDisplay();
    let biggest = Math.max(primaryDisplay.width, primaryDisplay.height) * 0.25;
    let size = {
        width: ~~biggest,
        height: ~~((biggest / 16) * 9),
    };

    let win = new BrowserWindow({
        ...size,
        frame: false,
        resizable: false,
        show: false,
        icon: 'assets/img/icon.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    return new Promise<BrowserWindow>((resolve) => {
        win.once('ready-to-show', win.show.bind(win));
        win.webContents.on('did-finish-load', resolve.bind(null, win));

        win.setMenu(null);
        win.loadFile('assets/html/splash.html');
    });
}

function launcher() {
    let win = new BrowserWindow({
        frame: false,
        show: false,
        icon: 'assets/img/icon.png',
        maximizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    return new Promise<BrowserWindow>((resolve) => {
        win.once('ready-to-show', win.show.bind(win));
        win.webContents.on('did-finish-load', resolve.bind(null, win));

        let onCloseEvent: (event: Electron.IpcMainEvent) => void;
        let onMinimizeEvent: (event: Electron.IpcMainEvent) => void;

        ipcMain.on(
            'close',
            (onCloseEvent = (event) => {
                if (event.sender !== win.webContents) return;
                app.quit();
            })
        );

        ipcMain.on(
            'minimize',
            (onMinimizeEvent = (event) => {
                if (event.sender !== win.webContents) return;
                win.minimize();
            })
        );

        win.webContents.on('will-navigate', (event, url) => {
            event.preventDefault();
            handleNavigation(new URL(url));
        });
        win.webContents.on('new-window', (event, url) => {
            event.preventDefault();
            handleNavigation(new URL(url));
        });
        win.webContents.on('page-title-updated', (event) => {
            event.preventDefault();
            win.setTitle(app.getName());
        });

        win.on('close', () => onCloseEvent({ sender: win.webContents } as any));

        win.on('closed', () => {
            ipcMain.removeListener('close', onCloseEvent);
            ipcMain.removeListener('minimize', onMinimizeEvent);
        });

        win.loadFile('assets/html/launcher.html');
    });
}

function openLauncherSettings() {
    let win = new BrowserWindow({
        frame: false,
        show: false,
        icon: 'assets/img/icon.png',
        maximizable: false,
        width: 500,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    return new Promise<BrowserWindow>((resolve) => {
        win.once('ready-to-show', win.show.bind(win));
        win.webContents.on('did-finish-load', resolve.bind(null, win));

        win.loadFile('assets/html/launcherSettings.html');
    });
}

enum LaunchMode {
    Splash,
    Launcher,
}

export async function launch(key: string, launchMode?: number) {
    if (key !== launchKey) return process.exit(1337);
    ipcMain.on('getArgv', (event) => (event.returnValue = process.argv));

    let quote = await getKanyeQuote().catch(() => '');
    launchMode ||= config.get('modules.launcher.mode', 0);
    let shouldUpdate = config.get('update', true);

    switch (launchMode) {
        case LaunchMode.Splash:
            let splashWindow = await splash();
            splashWindow.webContents.send('setQuote', quote);

            let setTitle = splashWindow.webContents.send.bind(
                splashWindow.webContents,
                'setTitle'
            );

            let onResetCSSEvent: (event: Electron.IpcMainEvent) => void;

            ipcMain.on(
                'resetCSS',
                (onResetCSSEvent = (event) => {
                    if (event.sender !== splashWindow.webContents) return;
                    config.set('modules.easycss.active', -1);
                })
            );

            if (shouldUpdate) {
                setTitle('Checking for updates...');
                await updater(setTitle);
            }

            setTitle('Client up to date!');
            setTimeout(() => {
                ipcMain.off('resetCSS', onResetCSSEvent);
                
                app.on('window-all-closed', (event) => event.preventDefault());
                splashWindow.close();
                app.removeAllListeners('window-all-closed');
                app.on('window-all-closed', app.quit.bind(app));

                createMainWindow(launchKey);
            }, 2000);
            break;
        case LaunchMode.Launcher:
            let launcherWindow = await launcher();
            let launcherSettings: BrowserWindow | null = null;

            let onLaunchEvent: (event: Electron.IpcMainEvent) => void;
            let onSettingsEvent: (event: Electron.IpcMainEvent) => void;
            let onInfoEvent: (event: Electron.IpcMainEvent) => void;

            ipcMain.on(
                'launch',
                (onLaunchEvent = (event) => {
                    if (event.sender !== launcherWindow.webContents) return;
                    launcherWindow.removeAllListeners('close');
                    app.on('window-all-closed', (event) =>
                        event.preventDefault()
                    );

                    launcherWindow.close();
                    
                    app.removeAllListeners('window-all-closed');
                    app.on('window-all-closed', app.quit.bind(app));

                    createMainWindow(launchKey);
                })
            );

            ipcMain.on(
                'settings',
                (onSettingsEvent = async (event) => {
                    if (event.sender !== launcherWindow.webContents) return;
                    if (!launcherSettings) {
                        launcherSettings = await openLauncherSettings();

                        launcherSettings.on(
                            'closed',
                            () => (launcherSettings = null)
                        );
                    } else launcherSettings.focus();
                })
            );

            ipcMain.on(
                'info',
                (onInfoEvent = (event) => {
                    if (event.sender !== launcherWindow.webContents) return;

                    event.sender.send('info', {
                        quote,
                        discord,
                    });
                })
            );

            launcherWindow.on('closed', () => {
                ipcMain.removeListener('launch', onLaunchEvent);
                ipcMain.removeListener('settings', onSettingsEvent);
                ipcMain.removeListener('info', onInfoEvent);
            });

            ipcMain.emit('info', { sender: launcherWindow.webContents });
            break;
    }
}
