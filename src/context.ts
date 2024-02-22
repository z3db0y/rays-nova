export enum Context {
    Game,
    Social,
    Editor,
    Viewer,
    Startup,
    Common
}

export enum RunAt {
    LoadStart,
    LoadEnd
}

export function fromURL(url: URL): Context | null {
    if(!['krunker.io', 'browserfps.com'].includes(url.hostname)) return null;

    switch(url.pathname) {
        case '/':
            return Context.Game;
        case '/social.html':
            return Context.Social;
        case '/editor.html':
            return Context.Editor;
        case '/viewer.html':
            return Context.Viewer;
        default:
            return null;
    }
}