const { ipcRenderer } = require('electron');

ipcRenderer.on('setTitle', (_, title) => {
    document.getElementById('status').innerText = title;
});

ipcRenderer.on('setQuote', (_, quote) => {
    document.getElementById('quote').innerText = quote;
});

resetCSS.onclick = () => {
    ipcRenderer.send('resetCSS');

    let orig = resetCSS.textContent;
    
    resetCSS.disabled = true;
    resetCSS.textContent = 'CSS Reset!';

    setTimeout(() => {
        resetCSS.disabled = false;
        resetCSS.textContent = orig;
    }, 1000);
};