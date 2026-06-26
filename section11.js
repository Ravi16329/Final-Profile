

(function () {
    const stage = document.getElementById('holoStage');
    const card = document.getElementById('holoCard');
    const shine = document.getElementById('holoShine');
    const canvas = document.getElementById('inkCanvas');
    const resetBtn = document.getElementById('inkResetBtn');
    const bgCV = document.getElementById('s11Canvas');
    const section = document.getElementById('s11');
    if (!card || !canvas || !bgCV || !section) return;

    const ctx = canvas.getContext('2d');
    const bgCtx = bgCV.getContext('2d');
    let W, H;

    /* ── RESIZE BOTH CANVASES ── */
    function resize() {
        const r = section.getBoundingClientRect();
        bgCV.width = r.width || window.innerWidth;
        bgCV.height = r.height || window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cr = canvas.parentElement.getBoundingClientRect();
        W = cr.width; H = cr.height;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        repaintInk();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── BACKGROUND PARTICLE FIELD ── */
    let bgTick = 0, bgRAF = null;
    const bParts = Array.from({ length: 120 }, () => ({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - .5) * .0003, vy: (Math.random() - .5) * .0003,
        r: Math.random() * 1.4 + 0.4, hue: 20 + Math.random() * 40,
        a: Math.random() * .5 + .1,
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
        /* subtle connection lines */
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
        bgRAF = requestAnimationFrame(drawBg);
    }
    drawBg();

    /* ── INK REVEAL ── */
    const MASK = [20, 16, 12];
    const BRUSH = 130, LIFE = 650, R0 = 10, RVARY = .45, STEP = 10, MAX = 220, SEG = 36;
    const WOB = [.14, .08, .05], GIR = .2, GS = [.95, .88, 0];
    let stamps = [], inkRunning = false, lastPos = null;

    function repaintInk() {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgb(${MASK})`;
        ctx.fillRect(0, 0, W, H);
    }
    repaintInk();

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

        stamps.push({
            x,
            y,
            seed: Math.random() * Math.PI * 2,
            rmax: BRUSH
        });

    }
    function stampAlong(x, y) {
        if (!lastPos) { addStamp(x, y); }
        else {
            const dx = x - lastPos.x, dy = y - lastPos.y, dist = Math.hypot(dx, dy);
            const steps = Math.max(1, Math.ceil(dist / STEP));
            for (let i = 1; i <= steps; i++) addStamp(lastPos.x + dx * i / steps, lastPos.y + dy * i / steps);
        }
        lastPos = { x, y };
    }

    function inkLoop() {

        ctx.globalCompositeOperation = "destination-out";

        while (stamps.length) {

            const s = stamps.shift();

            carve(
                s.x,
                s.y,
                s.rmax,
                s.seed,
                1
            );

        }

        inkRunning = false;

    }
    function startInk() {

        if (inkRunning) return;

        inkRunning = true;

        requestAnimationFrame(() => {

            inkLoop();

        });

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
        stampAlong(t.clientX - r.left, t.clientY - r.top); startInk();
    }, { passive: false });

    if (resetBtn) {

        resetBtn.addEventListener("click", () => {

            stamps = [];
            lastPos = null;

            ctx.globalCompositeOperation = "source-over";

            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = `rgb(${MASK})`;

            ctx.fillRect(0, 0, W, H);

        });

    }

    /* ── 3D TILT ON HOVER ── */
    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = -(py - .5) * 14;
        const ry = (px - .5) * 14;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.01)`;
        shine.style.setProperty('--mx', (px * 100) + '%');
        shine.style.setProperty('--my', (py * 100) + '%');
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
})();