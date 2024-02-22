const { ipcRenderer } = require('electron');

let canvas = document.getElementById('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ctx = canvas.getContext('2d');
let particles = [];
let count = Math.min(window.innerWidth, window.innerHeight) / 20;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    count = Math.min(window.innerWidth, window.innerHeight) / 20;
});

function createParticle(life = 0) {
    particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        dx: Math.random() * 20 - 10,
        dy: Math.random() * 20 - 10,
        life,
    });
}

function updateParticle(particle, delta) {
    particle.life += delta;
    particle.x += particle.dx * delta;
    particle.y += particle.dy * delta;
    particle.dx += delta * (Math.random() * 2 - 1);
    particle.dy += delta * (Math.random() * 2 - 1);

    ctx.globalAlpha =
        particle.life < 1
            ? particle.life
            : Math.max(0.5, 2 - Math.min(particle.life, 2));
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    for (let i = 0; i < particles.length; i++) {
        let other = particles[i];
        if (other === particle) continue;

        let distance = Math.sqrt(
            (other.x - particle.x) ** 2 + (other.y - particle.y) ** 2
        );

        if (distance < 100) {
            ctx.globalAlpha = (1 - distance / 100) * 0.4;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.closePath();
        }
    }
}

let last = Date.now();

function onFrame() {
    let delta = (Date.now() - last) / 1000;
    last = Date.now();

    requestAnimationFrame(onFrame);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];

        // OFFSCREEN
        if (particle.y < 0 || particle.x < 0) {
            particles.splice(i, 1);
            i--;
            continue;
        }

        if (particle.y > window.innerHeight || particle.x > window.innerWidth) {
            particles.splice(i, 1);
            i--;
            continue;
        }

        updateParticle(particle, delta);
    }

    if (particles.length < count && particles.length !== 0)
        for (let i = 0; i < count - particles.length; i++) createParticle();

    if (particles.length === 0)
        for (let i = 0; i < count; i++) createParticle(2);
}

onFrame();

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
    window.info = info;
    document.getElementById('quote').innerText = info.quote || '';
});

document.getElementById('launch').addEventListener('click', () => {
    let launch = document.getElementById('launch');
    launch.innerText = 'Launching...';
    ipcRenderer.send('launch');
});
