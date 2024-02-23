import { screen, app, BrowserWindow, shell } from 'electron';
import { launchKey } from './index';
import config from './config';
import { Context, RunAt, fromURL } from './context';
import ModuleManger from './module/manager';
import { join } from 'path';

export let window: BrowserWindow;
const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

function quit() {
    let size = window.getSize();
    let pos = window.getPosition();
    let fullscreen = window.isFullScreen();

    config.set('window', {
        width: size[0],
        height: size[1],
        x: pos[0],
        y: pos[1],
        fullscreen,
    });

    app.quit();
}

async function handleKeyEvent(
    context: Context,
    window: BrowserWindow,
    event: Electron.Event,
    input: Electron.Input
) {
    if (input.type !== 'keyDown') return;

    let binds = config.get('keybinds', {
        newGame: 'F6',
        refresh: 'F5',
        fullscreen: 'F11',
        devtools: 'F12',
    });

    binds.newGame = binds.newGame || 'F6';
    binds.refresh = binds.refresh || 'F5';
    binds.fullscreen = binds.fullscreen || 'F11';
    binds.devtools = binds.devtools || 'F12';

    switch (context) {
        case Context.Game:
            if (input.key == binds.newGame)
                window.loadURL('https://krunker.io');
        default:
            if (input.key == binds.refresh) window.reload();

            if (input.key == binds.fullscreen)
                window.setFullScreen(!window.isFullScreen());

            if (input.key == binds.devtools) {
                let devtools = window.webContents.isDevToolsOpened();

                if (devtools) window.webContents.closeDevTools();
                else window.webContents.openDevTools({ mode: 'detach' });
            }
            break;
    }
}

export default function createMainWindow(key: string) {
    if (key !== launchKey) process.exit(1337);
    let { workAreaSize: displaySize } = screen.getPrimaryDisplay();

    let windowParams = config.get('window', {
        width: displaySize.width,
        height: displaySize.height,
        x: 0,
        y: 0,
        fullscreen: false,
    });

    windowParams.width = windowParams.width || displaySize.width;
    windowParams.height = windowParams.height || displaySize.height;
    windowParams.x = windowParams.x || 0;
    windowParams.y = windowParams.y || 0;
    windowParams.fullscreen = windowParams.fullscreen || false;

    window = new BrowserWindow({
        ...windowParams,
        title: app.getName(),
        show: false,
        icon: 'assets/img/icon.png',

        webPreferences: {
            preload: join(__dirname, 'preload'),
        },
    });

    let moduleManager = new ModuleManger(Context.Common);
    moduleManager.load(RunAt.LoadStart);

    window.setMenu(null);
    window.on('close', quit);

    window.webContents.on(
        'did-fail-load',
        (event, errorCode, errorDesc, validatedURL, isMainFrame) => {
            if (isMainFrame) window.loadFile('assets/html/disconnected.html');
        }
    );

    window.once('ready-to-show', () => {
        window.show();
        moduleManager.load(RunAt.LoadEnd);
    });

    window.webContents.on('page-title-updated', (event) => {
        event.preventDefault();
        window.setTitle(app.getName());
    });
    window.webContents.on('will-navigate', (event, url) =>
        handleNavigation(event, new URL(url))
    );
    window.webContents.on('new-window', (event, url) =>
        handleNavigation(event, new URL(url))
    );
    window.webContents.on(
        'before-input-event',
        handleKeyEvent.bind(null, Context.Game, window)
    );
    window.loadURL('https://krunker.io');
}

function handleNavigation(event: Electron.Event, url: URL) {
    event.preventDefault();
    let context = fromURL(url);

    switch (context) {
        case Context.Game:
            window.loadURL(url.toString());
            window.focus();
            break;
        case null:
            shell.openExternal(url.toString());
            break;
        default:
            let win = new BrowserWindow({
                width: 800,
                height: 600,
                title: app.getName(),
                icon: 'assets/img/icon.png',
                webPreferences: {
                    preload: join(__dirname, 'preload'),
                    contextIsolation: true,
                },
            });

            win.setMenu(null);
            win.webContents.on('will-navigate', (event, url) =>
                handleNavigation(event, new URL(url))
            );
            win.webContents.on('new-window', (event, url) =>
                handleNavigation(event, new URL(url))
            );
            win.webContents.on(
                'before-input-event',
                handleKeyEvent.bind(null, context, win)
            );
            win.webContents.on('will-prevent-unload', (event) =>
                event.preventDefault()
            );

            win.loadURL(url.toString(), { userAgent });
            break;
    }
}
