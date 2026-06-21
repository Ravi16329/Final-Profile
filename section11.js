
(function () {
    const stage = document.getElementById('inkStage');
    const canvas = document.getElementById('inkCanvas');
    const resetBtn = document.getElementById('inkResetBtn');
    if (!stage || !canvas) return;

    const ctx = canvas.getContext('2d');

    /* ===== CONFIG (same defaults as the React version) ===== */
    const maskColor = [20, 16, 12];   /* dark ink color, matches your dark theme */
    const brushSize = 130;
    const lifetime = 650;
    const rStart = 10;
    const rVary = 0.45;
    const stampStep = 10;
    const maxStamps = 220;
    const segments = 36;
    const wobble = [0.14, 0.08, 0.05];
    const gradientInnerRadius = 0.2;
    const gradientStops = [0.95, 0.88, 0];

    let stamps = [];
    let running = false;
    let lastPos = null;
    let dims = { w: 0, h: 0 };

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = stage.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        dims = { w, h };
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgb(${maskColor[0]},${maskColor[1]},${maskColor[2]})`;
        ctx.fillRect(0, 0, w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    function carveInk(x, y, r, seed, alpha) {
        const g = ctx.createRadialGradient(x, y, r * gradientInnerRadius, x, y, r);
        g.addColorStop(0, `rgba(0,0,0,${gradientStops[0] * alpha})`);
        g.addColorStop(0.5, `rgba(0,0,0,${gradientStops[1] * alpha})`);
        g.addColorStop(1, `rgba(0,0,0,${gradientStops[2] * alpha})`);
        ctx.fillStyle = g;

        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            const wob = 0.78
                + wobble[0] * Math.sin(a * 3 + seed)
                + wobble[1] * Math.sin(a * 5 + seed * 2.1)
                + wobble[2] * Math.sin(a * 7 + seed * 0.7);
            const px = x + Math.cos(a) * r * wob;
            const py = y + Math.sin(a) * r * wob;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    function addStamp(x, y) {
        if (stamps.length >= maxStamps) stamps.shift();
        stamps.push({
            x, y,
            born: performance.now(),
            seed: Math.random() * Math.PI * 2,
            rmax: brushSize * (1 - rVary + Math.random() * rVary)
        });
    }

    function stampAlong(x, y) {
        if (!lastPos) {
            addStamp(x, y);
        } else {
            const dx = x - lastPos.x, dy = y - lastPos.y;
            const dist = Math.hypot(dx, dy);
            const steps = Math.max(1, Math.ceil(dist / stampStep));
            for (let i = 1; i <= steps; i++) {
                addStamp(lastPos.x + (dx * i) / steps, lastPos.y + (dy * i) / steps);
            }
        }
        lastPos = { x, y };
    }

    function loop() {
        const { w, h } = dims;
        const now = performance.now();

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgb(${maskColor[0]},${maskColor[1]},${maskColor[2]})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'destination-out';

        for (let i = stamps.length - 1; i >= 0; i--) {
            const t = (now - stamps[i].born) / lifetime;
            if (t >= 1) { stamps.splice(i, 1); continue; }
            const ease = 1 - Math.pow(1 - t, 3);
            const r = rStart + (stamps[i].rmax - rStart) * ease;
            const alpha = 1 - t * t;
            carveInk(stamps[i].x, stamps[i].y, r, stamps[i].seed, alpha);
        }

        if (stamps.length) {
            requestAnimationFrame(loop);
        } else {
            running = false;
        }
    }

    function startLoop() {
        if (!running) {
            running = true;
            requestAnimationFrame(loop);
        }
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    canvas.addEventListener('mouseenter', (e) => {
        const pos = getPos(e);
        lastPos = pos;
        stampAlong(pos.x, pos.y);
        startLoop();
    });
    canvas.addEventListener('mousemove', (e) => {
        const pos = getPos(e);
        stampAlong(pos.x, pos.y);
        startLoop();
    });
    canvas.addEventListener('mouseleave', () => {
        lastPos = null;
    });

    /* touch support for mobile */
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const pos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        stampAlong(pos.x, pos.y);
        startLoop();
    }, { passive: false });

    /* reset button — repaints full ink layer */
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            stamps = [];
            lastPos = null;
            resize();
        });
    }
})();