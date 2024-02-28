export function GM_getValue(key: string) {
    return window.localStorage.getItem('GM_' + key);
}

export function GM_setValue(key: string, value: string) {
    window.localStorage.setItem('GM_' + key, value);
}

export function GM_deleteValue(key: string) {
    window.localStorage.removeItem('GM_' + key);
}

export function parseHeader(script: string) {
    let obj: any = {};

    let lines = script.split('\n');

    if (!lines[0].includes(' ==UserScript==')) return obj;

    let endLine = lines.findIndex((line) => line.includes(' ==/UserScript=='));
    if (endLine === -1) return obj;

    let header = lines.slice(1, endLine);

    for (let i = 0; i < header.length; i++) {
        let line = header[i].replace(/^\/\/\s?/, '').trim();
        let match = [...line.matchAll(/^@(\S+)\s+([\S\s]+)$/g)];
        if (!match?.[0]) continue;

        let [_, key, value] = match[0];

        if (obj.hasOwnProperty(key)) {
            if (Array.isArray(obj[key])) obj[key].push(value);
            else obj[key] = [obj[key], value];
        } else obj[key] = value;
    }

    return obj;
}
