const { ipcRenderer } = require('electron');

let canvas = document.getElementById('canvas');

let particles = new Particles(canvas);
particles.start();

let close = document.getElementById('close');
let minimize = document.getElementById('minimize');

close.addEventListener('click', () => {
    ipcRenderer.send('close');
});

minimize.addEventListener('click', () => {
    ipcRenderer.send('minimize');
});

settings.addEventListener('click', () => {
    ipcRenderer.send('settings');
});

ipcRenderer.on('info', (_, info) => {
    document.getElementById('quote').innerText = info.quote || '';
    if (info.discord)
        document.getElementById('discordBtn').onclick = () =>
            window.open('https://discord.gg/' + info.discord);
});

document.getElementById('launch').addEventListener('click', () => {
    let launch = document.getElementById('launch');
    launch.innerText = 'Launching...';
    ipcRenderer.send('launch');
});

ipcRenderer.send('info');
