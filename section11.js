(function () {
    const card = document.getElementById('holoCard');
    const shine = document.getElementById('holoShine');
    const canvas = document.getElementById('inkCanvas');
    const resetBtn = document.getElementById('inkResetBtn');
    const bgCV = document.getElementById('s11Canvas');
    const section = document.getElementById('s11');
    if (!card || !canvas || !bgCV || !section) return;

    const ctx = canvas.getContext('2d');
    const bgCtx = bgCV.getContext('2d');
    let W = 0, H = 0;
    const MASK = '20,16,12';

    /* ── RESIZE ── */
    function resize() {
        /* bg canvas */
        const sr = section.getBoundingClientRect();
        bgCV.width = sr.width || window.innerWidth;
        bgCV.height = sr.height || window.innerHeight;

        /* ink canvas — matches the card element */
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cr = canvas.parentElement.getBoundingClientRect();
        W = cr.width;
        H = cr.height;
        if (W < 1 || H < 1) return;   /* not ready yet */
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        fillInk();   /* re-cover after resize */
    }

    /* ── FILL CANVAS SOLID DARK INK ── */
    function fillInk() {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgb(${MASK})`;
        ctx.fillRect(0, 0, W, H);
    }

    /* delay first resize until layout is painted */
    requestAnimationFrame(() => { resize(); });
    window.addEventListener('resize', resize);

    /* ── BACKGROUND PARTICLE NETWORK ── */
    const bParts = Array.from({ length: 100 }, () => ({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - .5) * .0003, vy: (Math.random() - .5) * .0003,
        r: Math.random() * 1.3 + 0.4, hue: 20 + Math.random() * 40,
        a: Math.random() * .45 + .1,
    }));

    function drawBg() {
        const bW = bgCV.width, bH = bgCV.height;
        bgCtx.clearRect(0, 0, bW, bH);
        bParts.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
            if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
            bgCtx.beginPath();
            bgCtx.arc(p.x * bW, p.y * bH, p.r, 0, Math.PI * 2);
            bgCtx.fillStyle = `hsla(${p.hue},80%,65%,${p.a})`;
            bgCtx.fill();
        });
        for (let i = 0; i < bParts.length; i++) {
            for (let j = i + 1; j < bParts.length; j++) {
                const dx = (bParts[i].x - bParts[j].x) * bW;
                const dy = (bParts[i].y - bParts[j].y) * bH;
                const d = Math.hypot(dx, dy);
                if (d < 80) {
                    bgCtx.beginPath();
                    bgCtx.moveTo(bParts[i].x * bW, bParts[i].y * bH);
                    bgCtx.lineTo(bParts[j].x * bW, bParts[j].y * bH);
                    bgCtx.strokeStyle = `rgba(249,115,22,${0.06 * (1 - d / 80)})`;
                    bgCtx.lineWidth = 0.5;
                    bgCtx.stroke();
                }
            }
        }
        requestAnimationFrame(drawBg);
    }
    drawBg();

    /* ── INK REVEAL PARAMETERS ── */
    const BRUSH = 130, LIFE = 650, R0 = 10, RVARY = .45, STEP = 10, MAX = 220, SEG = 36;
    const WOB = [.14, .08, .05], GIR = .2, GS = [.95, .88, 0];
    let stamps = [], inkRunning = false, lastPos = null;

    function carve(x, y, r, seed, alpha) {
        const g = ctx.createRadialGradient(x, y, r * GIR, x, y, r);
        g.addColorStop(0, `rgba(0,0,0,${GS[0] * alpha})`);
        g.addColorStop(.5, `rgba(0,0,0,${GS[1] * alpha})`);
        g.addColorStop(1, `rgba(0,0,0,${GS[2] * alpha})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        for (let i = 0; i <= SEG; i++) {
            const a = (i / SEG) * Math.PI * 2;
            const w = .78 + WOB[0] * Math.sin(a * 3 + seed) + WOB[1] * Math.sin(a * 5 + seed * 2.1) + WOB[2] * Math.sin(a * 7 + seed * .7);
            const px = x + Math.cos(a) * r * w, py = y + Math.sin(a) * r * w;
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fill();
    }

    function addStamp(x, y) {
        if (stamps.length >= MAX) stamps.shift();
        stamps.push({
            x, y,
            born: performance.now(),
            seed: Math.random() * Math.PI * 2,
            rmax: BRUSH * (1 - RVARY + Math.random() * RVARY)
        });
    }

    function stampAlong(x, y) {
        if (!lastPos) { addStamp(x, y); }
        else {
            const dx = x - lastPos.x, dy = y - lastPos.y;
            const dist = Math.hypot(dx, dy);
            const steps = Math.max(1, Math.ceil(dist / STEP));
            for (let i = 1; i <= steps; i++)
                addStamp(lastPos.x + dx * i / steps, lastPos.y + dy * i / steps);
        }
        lastPos = { x, y };
    }

    function inkLoop() {
        const now = performance.now();
        /* repaint solid ink */
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgb(${MASK})`;
        ctx.fillRect(0, 0, W, H);
        /* carve holes */
        ctx.globalCompositeOperation = 'destination-out';
        for (let i = stamps.length - 1; i >= 0; i--) {
            const t = (now - stamps[i].born) / LIFE;
            if (t >= 1) { stamps.splice(i, 1); continue; }
            const ease = 1 - Math.pow(1 - t, 3);
            carve(stamps[i].x, stamps[i].y,
                R0 + (stamps[i].rmax - R0) * ease,
                stamps[i].seed,
                1 - t * t);
        }
        stamps.length ? requestAnimationFrame(inkLoop) : (inkRunning = false);
    }

    function startInk() {
        if (!inkRunning) { inkRunning = true; requestAnimationFrame(inkLoop); }
    }

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    canvas.addEventListener('mouseenter', e => { const p = getPos(e); lastPos = p; stampAlong(p.x, p.y); startInk(); });
    canvas.addEventListener('mousemove', e => { const p = getPos(e); stampAlong(p.x, p.y); startInk(); });
    canvas.addEventListener('mouseleave', () => { lastPos = null; });
    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const t = e.touches[0], r = canvas.getBoundingClientRect();
        stampAlong(t.clientX - r.left, t.clientY - r.top);
        startInk();
    }, { passive: false });

    /* ── RE-COVER BUTTON (fixed) ── */
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            /* 1. kill animation */
            inkRunning = false;
            stamps = [];
            lastPos = null;
            /* 2. restore normal composite mode */
            ctx.globalCompositeOperation = 'source-over';
            /* 3. paint solid ink over entire canvas */
            ctx.fillStyle = `rgb(${MASK})`;
            ctx.fillRect(0, 0, W, H);
        });
    }

    /* ── 3D TILT ── */
    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(1000px) rotateX(${-(py - .5) * 14}deg) rotateY(${(px - .5) * 14}deg) scale(1.01)`;
        if (shine) {
            shine.style.setProperty('--mx', (px * 100) + '%');
            shine.style.setProperty('--my', (py * 100) + '%');
        }
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
})();