
(function () {
    const section = document.getElementById('s13');
    const canvas = document.getElementById('footerCanvas');
    if (!canvas || !section) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
        W = canvas.width = section.offsetWidth || window.innerWidth;
        H = canvas.height = section.offsetHeight || window.innerHeight;
        buildRamp();
    }

    /* ═══════════════ RAMP PATH (zigzag bottom-left → top-right) ═══════════════ */
    let rampPath = [], rampLeft = [], rampRight = [];

    function buildRamp() {
        rampPath = []; rampLeft = []; rampRight = [];
        const sx = W * 0.05, sy = H * 0.92, ex = W * 0.95, ey = H * 0.06;
        const pts = [];
        const N = 8;
        for (let i = 0; i <= N; i++) {
            const t = i / N;
            const bx = sx + (ex - sx) * t, by = sy + (ey - sy) * t;
            const side = (i % 2 === 0) ? 1 : -1;
            const sway = (i > 0 && i < N) ? side * W * 0.12 : 0;
            pts.push({ x: bx + sway, y: by });
        }
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
            for (let t = 0; t < 1; t += 0.015) rampPath.push(catmull(p0, p1, p2, p3, t));
        }
        rampPath.push(pts[pts.length - 1]);
        buildEdges();
    }

    function catmull(p0, p1, p2, p3, t) {
        const t2 = t * t, t3 = t2 * t;
        return {
            x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        };
    }

    function buildEdges() {
        rampLeft = []; rampRight = [];
        const n = rampPath.length;
        for (let i = 0; i < n; i++) {
            const prev = rampPath[Math.max(0, i - 1)], next = rampPath[Math.min(n - 1, i + 1)];
            const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len, ny = dx / len;
            const t = i / n, w = (W * 0.065) * (0.45 + 0.55 * t);
            rampLeft.push({ x: rampPath[i].x + nx * w, y: rampPath[i].y + ny * w });
            rampRight.push({ x: rampPath[i].x - nx * w, y: rampPath[i].y - ny * w });
        }
    }

    function getPathPoint(t) {
        if (!rampPath.length) return { x: 0, y: 0 };
        const idx = Math.min(Math.floor(t * (rampPath.length - 1)), rampPath.length - 2);
        const f = t * (rampPath.length - 1) - idx;
        const a = rampPath[idx], b = rampPath[idx + 1];
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }

    function getAngle(t) {
        const dT = 0.008;
        const a = getPathPoint(Math.max(0, t - dT)), b = getPathPoint(Math.min(1, t + dT));
        return Math.atan2(b.y - a.y, b.x - a.x);
    }

    /* ═══════════════ BACKGROUND ═══════════════ */
    let bgPhase = 0;
    const bgPal = [[[6, 6, 14], [12, 5, 30]], [[5, 12, 38], [18, 6, 45]], [[8, 4, 28], [22, 8, 18]], [[10, 4, 18], [5, 5, 22]]];
    function drawBg() {
        bgPhase += 0.0025;
        const pi = Math.floor(bgPhase) % bgPal.length, t = bgPhase % 1;
        const [a, b] = bgPal[pi], [c, d] = bgPal[(pi + 1) % bgPal.length];
        const grd = ctx.createLinearGradient(0, 0, W, H);
        grd.addColorStop(0, `rgb(${lerp3(a, c, t)})`);
        grd.addColorStop(1, `rgb(${lerp3(b, d, t)})`);
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
        /* ambient glow */
        const ag = ctx.createRadialGradient(W * 0.4, H * 0.5, 50, W * 0.4, H * 0.5, W * 0.5);
        ag.addColorStop(0, 'rgba(108,99,255,0.1)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H);
    }
    function lerp3(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)].join(','); }

    /* ═══════════════ DRAW RAMP ═══════════════ */
    function drawRamp() {
        if (rampPath.length < 2) return;
        const n = rampPath.length;
        ctx.save();
        /* road fill */
        ctx.beginPath();
        ctx.moveTo(rampLeft[0].x, rampLeft[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(rampLeft[i].x, rampLeft[i].y);
        for (let i = n - 1; i >= 0; i--) ctx.lineTo(rampRight[i].x, rampRight[i].y);
        ctx.closePath();
        const rg = ctx.createLinearGradient(W * 0.05, H * 0.9, W * 0.95, H * 0.05);
        rg.addColorStop(0, '#1a1a2e'); rg.addColorStop(0.5, '#1e1e38'); rg.addColorStop(1, '#16162a');
        ctx.fillStyle = rg; ctx.fill();
        /* guardrails / side glow */
        ctx.beginPath();
        ctx.moveTo(rampLeft[0].x, rampLeft[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(rampLeft[i].x, rampLeft[i].y);
        ctx.strokeStyle = 'rgba(108,99,255,0.8)'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rampRight[0].x, rampRight[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(rampRight[i].x, rampRight[i].y);
        ctx.strokeStyle = 'rgba(0,212,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        /* dashes */
        ctx.beginPath();
        ctx.moveTo(rampPath[0].x, rampPath[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(rampPath[i].x, rampPath[i].y);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.setLineDash([14, 12]); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
    }

    /* ═══════════════ SPORTS BIKE (on the ramp, circles) ═══════════════ */
    function drawBike(x, y, angle, scale) {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
        const w = 60, h = 24;

        /* wheel glow */
        [[-w * 0.35, h * 0.3], [w * 0.35, h * 0.3]].forEach(([wx, wy]) => {
            const wg = ctx.createRadialGradient(wx, wy, 4, wx, wy, 14);
            wg.addColorStop(0, 'rgba(0,212,255,0.3)'); wg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(wx, wy, 14, 14, 0, 0, Math.PI * 2); ctx.fill();
        });

        /* frame / body low */
        ctx.fillStyle = '#111'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-w * 0.4, h * 0.1); ctx.lineTo(w * 0.15, -h * 0.4);
        ctx.lineTo(w * 0.4, -h * 0.1); ctx.lineTo(w * 0.3, h * 0.25);
        ctx.lineTo(-w * 0.1, h * 0.25); ctx.closePath();
        ctx.fill(); ctx.stroke();

        /* tank */
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.moveTo(-w * 0.05, -h * 0.5); ctx.lineTo(w * 0.32, -h * 0.5);
        ctx.lineTo(w * 0.4, -h * 0.1); ctx.lineTo(-w * 0.05, -h * 0.1); ctx.closePath();
        ctx.fill();
        /* tank stripe */
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.moveTo(-w * 0.05, -h * 0.5); ctx.lineTo(w * 0.04, -h * 0.5);
        ctx.lineTo(w * 0.04, -h * 0.1); ctx.lineTo(-w * 0.05, -h * 0.1); ctx.closePath();
        ctx.fill();

        /* fairing/front */
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.moveTo(w * 0.28, -h * 0.55); ctx.lineTo(w * 0.5, -h * 0.15);
        ctx.lineTo(w * 0.42, h * 0.05); ctx.lineTo(w * 0.2, -h * 0.05); ctx.closePath(); ctx.fill();

        /* windscreen */
        ctx.fillStyle = 'rgba(150,210,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(w * 0.3, -h * 0.5); ctx.lineTo(w * 0.46, -h * 0.15);
        ctx.lineTo(w * 0.36, -h * 0.08); ctx.lineTo(w * 0.22, -h * 0.35); ctx.closePath(); ctx.fill();

        /* seat/tail */
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(-w * 0.05, -h * 0.38); ctx.lineTo(-w * 0.38, -h * 0.1);
        ctx.lineTo(-w * 0.4, h * 0.05); ctx.lineTo(-w * 0.05, h * 0.0); ctx.closePath(); ctx.fill();

        /* rider */
        /* body */
        ctx.fillStyle = '#1565C0';
        ctx.beginPath(); ctx.ellipse(w * 0.08, -h * 0.62, 12, 15, 0.4, 0, Math.PI * 2); ctx.fill();
        /* helmet */
        ctx.fillStyle = '#1A237E';
        ctx.beginPath(); ctx.ellipse(w * 0.18, -h * 0.9, 10, 11, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(150,210,255,0.6)';
        ctx.beginPath(); ctx.ellipse(w * 0.2, -h * 0.88, 5, 6, 0.2, 0, Math.PI * 2); ctx.fill();
        /* visor */
        ctx.fillStyle = 'rgba(255,200,50,0.7)';
        ctx.beginPath(); ctx.ellipse(w * 0.23, -h * 0.86, 3, 4, 0.3, 0, Math.PI * 2); ctx.fill();
        /* scarf/hair trailing */
        ctx.strokeStyle = 'rgba(255,120,60,0.8)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(w * 0.1, -h * 0.85);
        ctx.bezierCurveTo(-w * 0.1, -h * 0.7, -w * 0.25, -h * 0.5, -w * 0.4, -h * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w * 0.08, -h * 0.82);
        ctx.bezierCurveTo(-w * 0.08, -h * 0.65, -w * 0.2, -h * 0.45, -w * 0.38, -h * 0.3);
        ctx.strokeStyle = 'rgba(255,80,20,0.6)'; ctx.stroke();

        /* arm */
        ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(w * 0.08, -h * 0.58); ctx.lineTo(w * 0.35, -h * 0.45); ctx.stroke();
        ctx.fillStyle = '#f4c17a';
        ctx.beginPath(); ctx.ellipse(w * 0.35, -h * 0.45, 4, 4, 0, 0, Math.PI * 2); ctx.fill();

        /* wheels */
        [[-w * 0.35, h * 0.3], [w * 0.37, h * 0.3]].forEach(([wx, wy]) => {
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(wx, wy, 13, 13, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#666'; ctx.lineWidth = 2; ctx.stroke();
            /* spokes */
            for (let s = 0; s < 6; s++) {
                const sa = s * Math.PI / 3;
                ctx.strokeStyle = 'rgba(200,200,200,0.5)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(sa) * 12, wy + Math.sin(sa) * 12); ctx.stroke();
            }
            ctx.fillStyle = '#555'; ctx.beginPath(); ctx.ellipse(wx, wy, 4, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(wx, wy, 2, 0, Math.PI * 2); ctx.fill();
        });

        /* headlight */
        ctx.fillStyle = 'rgba(255,245,150,0.9)';
        ctx.beginPath(); ctx.ellipse(w * 0.5, -h * 0.1, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,245,150,0.15)';
        ctx.beginPath(); ctx.ellipse(w * 0.5 + 20, -h * 0.1, 30, 14, 0, 0, Math.PI * 2); ctx.fill();

        /* tail light */
        ctx.fillStyle = '#FF1744';
        ctx.beginPath(); ctx.ellipse(-w * 0.42, -h * 0.08, 4, 3, 0, 0, Math.PI * 2); ctx.fill();

        /* exhaust sparks */
        for (let i = 0; i < 4; i++) {
            const sp = ((Date.now() / 60) + i * 1.1) % 1;
            ctx.fillStyle = `rgba(255,${60 + Math.random() * 140},0,${(1 - sp) * 0.9})`;
            ctx.beginPath();
            ctx.arc(-w * 0.42 - sp * 28, h * 0.25 + (Math.random() - .5) * 5, 3 - sp * 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /* ═══════════════ SPORTS CAR (pulls words from left) ═══════════════ */
    function drawCar(x, y, angle, scale, lightsOn) {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
        const w = 60, h = 22;
        if (lightsOn) {
            const bg = ctx.createRadialGradient(w / 2 + 10, 0, 1, w / 2 + 40, 0, 70);
            bg.addColorStop(0, 'rgba(255,245,180,0.6)'); bg.addColorStop(1, 'rgba(255,245,180,0)');
            ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(w / 2 + 30, 0, 75, 24, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(0, h / 2 + 5, w * 0.44, 4, 0, 0, Math.PI * 2); ctx.fill();
        /* lower */
        ctx.fillStyle = '#880E4F';
        ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2 + 5, w, h - 3, 5); ctx.fill();
        /* upper */
        ctx.fillStyle = '#AD1457';
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 8, -h / 2 + 5); ctx.lineTo(-w / 2 + 16, -h / 2 - 8);
        ctx.lineTo(w / 2 - 14, -h / 2 - 9); ctx.lineTo(w / 2 - 2, -h / 2 + 5); ctx.closePath(); ctx.fill();
        /* windshield */
        ctx.fillStyle = 'rgba(160,210,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 18, -h / 2 + 5); ctx.lineTo(-w / 2 + 22, -h / 2 - 6);
        ctx.lineTo(w / 2 - 17, -h / 2 - 7); ctx.lineTo(w / 2 - 6, -h / 2 + 5); ctx.closePath(); ctx.fill();
        /* stripe */
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-3, -h / 2 - 9, 6, h + 9);
        /* wheels */
        [[-w / 2 + 11, h / 2], [w / 2 - 11, h / 2]].forEach(([wx, wy]) => {
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(wx, wy, 10, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#777'; ctx.lineWidth = 1.5; ctx.stroke();
            for (let s = 0; s < 5; s++) {
                const sa = s * Math.PI * 2 / 5;
                ctx.strokeStyle = 'rgba(200,200,200,0.4)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(sa) * 8, wy + Math.sin(sa) * 8); ctx.stroke();
            }
            ctx.fillStyle = '#555'; ctx.beginPath(); ctx.ellipse(wx, wy, 5, 5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.arc(wx, wy, 2, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = lightsOn ? '#FFE082' : '#555';
        ctx.beginPath(); ctx.ellipse(w / 2 + 1, -5, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FF3D00';
        ctx.beginPath(); ctx.ellipse(-w / 2, -5, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        if (lightsOn) {
            for (let i = 0; i < 4; i++) {
                const sp = ((Date.now() / 65) + i * 1.2) % 1;
                ctx.fillStyle = `rgba(255,${70 + Math.random() * 130},0,${1 - sp})`;
                ctx.beginPath();
                ctx.arc(-w / 2 - 7 - sp * 26, h / 2 - 6 + (Math.random() - .5) * 4, 3 - sp * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    /* ═══════════════ PARTICLES ═══════════════ */
    let particles = [];
    function spawnSparks(x, y, col, n = 4) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 4;
            particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 1, color: col });
        }
    }
    function updateParticles() {
        particles = particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.03;
            ctx.save(); ctx.globalAlpha = p.life * 0.85; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore(); return p.life > 0;
        });
    }

    /* ═══════════════ WORD DELIVERY CARS ═══════════════ */
    /* Each nav word has its own delivery car that drives from left edge
       to the word's fixed screen position, drops it, then drives off right */
    const navWords = [
        { id: 'fw-home', label: 'Home', fx: 0.08, fy: 0.80 },
        { id: 'fw-about', label: 'About', fx: 0.32, fy: 0.62 },
        { id: 'fw-proj', label: 'Projects', fx: 0.58, fy: 0.44 },
        { id: 'fw-contact', label: 'Contact', fx: 0.76, fy: 0.28 },
    ];

    /* name + tag drop from top */
    const topWords = [
        { id: 'fw-name', fy: 0.10, dy: -0.25 },
        { id: 'fw-tag', fy: 0.21, dy: -0.28 },
    ];

    /* delivery car state per word */
    let deliveries = [];

    function initDeliveries() {
        deliveries = navWords.map((w, i) => {
            const el = document.getElementById(w.id);
            if (el) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; }
            return {
                ...w,
                el,
                phase: 'waiting', /* waiting → driving → parking → delivered → leaving */
                carX: -120, carY: 0,
                startDelay: 400 + i * 700,
                startTime: null,
                wordDropped: false,
                leavingX: 0,
            };
        });
        /* top words */
        topWords.forEach(tw => {
            const el = document.getElementById(tw.id);
            if (el) {
                el.style.opacity = '0'; el.style.transform = 'translateY(-80px)';
                el.style.transition = 'none'; el.style.pointerEvents = 'none';
            }
        });
        /* copy */
        const cp = document.getElementById('fw-copy');
        if (cp) {
            cp.style.opacity = '0'; cp.style.left = '50%'; cp.style.transform = 'translateX(-50%)';
            cp.style.bottom = '18px'; cp.style.top = 'auto';
        }
    }

    let animStartTime = null;

    function updateDeliveries(now) {
        if (!animStartTime) animStartTime = now;
        const elapsed = now - animStartTime;

        deliveries.forEach(d => {
            if (!d.el) return;
            const tx = W * d.fx, ty = H * d.fy;

            if (d.phase === 'waiting') {
                d.carY = ty;
                if (elapsed > d.startDelay) {
                    d.phase = 'driving';
                    d.startTime = now;
                    spawnSparks(-100, ty, '#6C63FF', 6);
                }
            }

            if (d.phase === 'driving') {
                const prog = Math.min((now - d.startTime) / 900, 1);
                const ease = 1 - Math.pow(1 - prog, 3);
                d.carX = -120 + (tx + 60) * ease;
                d.carY = ty;
                /* draw delivery car */
                drawCar(d.carX, d.carY, 0, 0.7 + (ty / H) * 0.4, true);
                if (prog >= 1) { d.phase = 'parking'; d.startTime = now; }
            }

            if (d.phase === 'parking') {
                d.carX = tx + 60; d.carY = ty;
                drawCar(d.carX, d.carY, 0, 0.7 + (ty / H) * 0.4, false);
                if (!d.wordDropped) {
                    d.wordDropped = true;
                    spawnSparks(tx, ty, '#00D4FF', 8);
                    spawnSparks(tx, ty, '#a78bfa', 6);
                    d.el.style.left = tx + 'px';
                    d.el.style.top = (ty - 14) + 'px';
                    d.el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    d.el.style.transform = 'scale(0.5)';
                    d.el.style.opacity = '0';
                    setTimeout(() => {
                        d.el.style.transform = 'scale(1)';
                        d.el.style.opacity = '1';
                        d.el.style.pointerEvents = 'auto';
                    }, 50);
                }
                if (now - d.startTime > 600) { d.phase = 'leaving'; d.startTime = now; d.leavingX = tx + 60; }
            }

            if (d.phase === 'leaving') {
                const prog = Math.min((now - d.startTime) / 600, 1);
                const ease = prog * prog;
                d.carX = d.leavingX + (W + 200 - d.leavingX) * ease;
                drawCar(d.carX, d.carY, 0, 0.7 + (ty / H) * 0.4, true);
                if (prog >= 1) d.phase = 'done';
            }
        });

        /* name + tag drop from top */
        if (elapsed > 3200) {
            topWords.forEach((tw, i) => {
                const el = document.getElementById(tw.id);
                if (!el) return;
                const prog = Math.min((elapsed - 3200 - i * 300) / 800, 1);
                if (prog <= 0) { el.style.opacity = '0'; return; }
                const ease = 1 - Math.pow(1 - prog, 3);
                el.style.opacity = String(ease);
                el.style.left = '5%';
                el.style.top = (H * tw.fy) + 'px';
                el.style.transform = `translateY(${(1 - ease) * -60}px)`;
                el.style.transition = 'none';
                if (prog >= 0.95) el.style.pointerEvents = (tw.id === 'fw-name' || tw.id === 'fw-tag') ? 'none' : 'auto';
            });
        }

        /* copyright fade */
        if (elapsed > 4200) {
            const cp = document.getElementById('fw-copy');
            if (cp) {
                const prog = Math.min((elapsed - 4200) / 800, 1);
                cp.style.opacity = String(prog * 0.4);
            }
        }
    }

    /* ═══════════════ BIKE ON RAMP ═══════════════ */
    let bikeT = 0;
    function updateBike() {
        bikeT = (bikeT + 0.0018) % 1;
        const pt = getPathPoint(bikeT);
        const angle = getAngle(bikeT);
        const scale = 0.5 + bikeT * 0.7;
        spawnSparks(pt.x, pt.y, `hsl(${30 + Math.floor(bikeT * 60)},90%,60%)`, 1);
        drawBike(pt.x, pt.y, angle, scale);
    }

    /* ═══════════════ SPEED LINES ═══════════════ */
    let speedLines = [];
    function spawnSpeedLine(x, y) {
        if (Math.random() > 0.3) return;
        speedLines.push({ x, y, len: 30 + Math.random() * 60, angle: Math.random() * Math.PI * 2, life: 1, alpha: 0.25 + Math.random() * 0.25 });
    }
    function drawSpeedLines() {
        speedLines = speedLines.filter(sl => {
            sl.life -= 0.08;
            ctx.save(); ctx.globalAlpha = sl.life * sl.alpha;
            ctx.strokeStyle = 'rgba(108,99,255,0.7)'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sl.x, sl.y);
            ctx.lineTo(sl.x + Math.cos(sl.angle) * sl.len * sl.life, sl.y + Math.sin(sl.angle) * sl.len * sl.life);
            ctx.stroke(); ctx.restore();
            return sl.life > 0;
        });
    }

    /* ═══════════════ MAIN LOOP ═══════════════ */
    let raf = null, running = false, tick = 0;

    function loop(now) {
        raf = requestAnimationFrame(loop);
        tick++;
        ctx.clearRect(0, 0, W, H);
        drawBg();
        drawRamp();
        updateParticles();
        drawSpeedLines();
        updateDeliveries(now);
        /* spawn speed lines near bike */
        const bikePos = getPathPoint(bikeT);
        spawnSpeedLine(bikePos.x + (Math.random() - .5) * 40, bikePos.y + (Math.random() - .5) * 20);
        updateBike();
    }

    function startAnim() {
        if (running) return; running = true;
        resize(); bikeT = 0; animStartTime = null;
        initDeliveries();
        requestAnimationFrame(loop);
    }

    function stopAnim() {
        if (raf) { cancelAnimationFrame(raf); raf = null; } running = false;
    }

    const mo = new MutationObserver(() => {
        if (section.style.display === 'block') startAnim(); else stopAnim();
    });
    mo.observe(section, { attributes: true, attributeFilter: ['style'] });

    const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) startAnim(); });
    }, { threshold: 0.3 });
    io.observe(section);

    window.addEventListener('resize', () => { if (running) { resize(); initDeliveries(); } });
})();


const orb = {

    x: W * .82,

    y: H * .45,

    r: 120

};

function drawOrb() {

    const g =
        ctx.createRadialGradient(
            orb.x,
            orb.y,
            10,
            orb.x,
            orb.y,
            orb.r
        );

    g.addColorStop(
        0,
        '#00D4FF'
    );

    g.addColorStop(
        1,
        'transparent'
    );

    ctx.fillStyle = g;

    ctx.beginPath();

    ctx.arc(
        orb.x,
        orb.y,
        orb.r,
        0,
        Math.PI * 2
    );

    ctx.fill();

}

drawOrb()