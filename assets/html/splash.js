const { ipcRenderer } = require('electron');

ipcRenderer.on('setTitle', (_, title) => {
    document.getElementById('status').innerText = title;
});

ipcRenderer.on('setQuote', (_, quote) => {
    document.getElementById('quote').innerText = quote;
});
