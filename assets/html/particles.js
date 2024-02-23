window.Particles = class {
    particles = [];
    count = Math.min(window.innerWidth, window.innerHeight) / 20;

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
    }

    start() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            this.count = Math.min(window.innerWidth, window.innerHeight) / 20;
        });

        this.last = Date.now();
        this.onFrame();
    }

    createParticle(life = 0) {
        this.particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            dx: Math.random() * 20 - 10,
            dy: Math.random() * 20 - 10,
            life,
        });
    }

    updateParticle(particle, delta) {
        particle.life += delta;
        particle.x += particle.dx * delta;
        particle.y += particle.dy * delta;
        particle.dx += delta * (Math.random() * 2 - 1);
        particle.dy += delta * (Math.random() * 2 - 1);

        this.ctx.globalAlpha =
            particle.life < 1
                ? particle.life
                : Math.max(0.5, 2 - Math.min(particle.life, 2));
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.closePath();

        for (let i = 0; i < this.particles.length; i++) {
            let other = this.particles[i];
            if (other === particle) continue;

            let distance = Math.sqrt(
                (other.x - particle.x) ** 2 + (other.y - particle.y) ** 2
            );

            if (distance < 100) {
                this.ctx.globalAlpha = (1 - distance / 100) * 0.4;
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(other.x, other.y);
                this.ctx.strokeStyle = 'white';
                this.ctx.stroke();
                this.ctx.closePath();
            }
        }
    }

    onFrame() {
        let delta = (Date.now() - this.last) / 1000;
        this.last = Date.now();

        requestAnimationFrame(this.onFrame.bind(this));
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];

            // OFFSCREEN
            if (particle.y < 0 || particle.x < 0) {
                this.particles.splice(i, 1);
                i--;
                continue;
            }

            if (
                particle.y > window.innerHeight ||
                particle.x > window.innerWidth
            ) {
                this.particles.splice(i, 1);
                i--;
                continue;
            }

            this.updateParticle(particle, delta);
        }

        if (this.particles.length < this.count && this.particles.length !== 0)
            for (let i = 0; i < this.count - this.particles.length; i++) this.createParticle();

        if (this.particles.length === 0)
            for (let i = 0; i < this.count; i++) this.createParticle(2);
    }
};
