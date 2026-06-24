(function () {
    'use strict';
    const section = document.getElementById('s13');
    const cvWave = document.getElementById('s13Wave');
    const cvFX = document.getElementById('s13FX');
    if (!section || !cvWave || !cvFX) return;

    const ctxW = cvWave.getContext('2d');
    const ctxF = cvFX.getContext('2d');
    let W, H, cx, cy;
    let raf = null, running = false, tick = 0;
    const mouse = { x: 0.5, y: 0.5 };

    /* ── resize ── */
    function resize() {
        const r = section.getBoundingClientRect();
        W = cvWave.width = cvFX.width = r.width || window.innerWidth;
        H = cvWave.height = cvFX.height = r.height || window.innerHeight;
        cx = W / 2; cy = H / 2;
        buildDots();
    }

    /* ════════════════════════════════════════════════
       LAYER 1 — 3D DOTTED WAVE SURFACE (from dotted-surface)
       40×50 grid of dots with sine-wave Y animation
       Perspective projected for 3D depth
    ════════════════════════════════════════════════ */
    const DOTCOLS = 40, DOTROWS = 32;
    let dotPhase = 0;
    let dots = [];

    function buildDots() {
        dots = [];
        const SEPC = W / DOTCOLS * 1.1;
        const SEPR = H / DOTROWS * 0.9;
        const offX = (W - (DOTCOLS - 1) * SEPC) / 2;
        const offZ = (H - (DOTROWS - 1) * SEPR) / 2;
        for (let ix = 0; ix < DOTCOLS; ix++) {
            for (let iz = 0; iz < DOTROWS; iz++) {
                dots.push({
                    bx: offX + ix * SEPC - W / 2,
                    bz: offZ + iz * SEPR - H / 2,
                    ix, iz,
                    hue: 220 + ix * 3 + iz * 2,
                });
            }
        }
    }

    const CAM_Y = -280;
    const CAM_Z = 500;
    const FOV_W = 600;

    function projectDot(x, y, z) {
        const dz = z - CAM_Z;
        if (dz >= 0) return null;
        const scale = -FOV_W / dz;
        return {
            px: cx + x * scale,
            py: cy + (y - CAM_Y) * scale,
            s: scale,
        };
    }

    function drawDots() {
        ctxW.clearRect(0, 0, W, H);

        /* deep space background */
        const bg = ctxW.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.9);
        bg.addColorStop(0, 'hsl(240,55%,6%)');
        bg.addColorStop(0.6, 'hsl(250,50%,3%)');
        bg.addColorStop(1, 'hsl(240,40%,1%)');
        ctxW.fillStyle = bg; ctxW.fillRect(0, 0, W, H);

        /* scanlines */
        for (let y = 0; y < H; y += 24) {
            ctxW.fillStyle = 'rgba(100,120,255,0.018)';
            ctxW.fillRect(0, y, W, 1);
        }

        dotPhase += 0.07;

        /* sort back-to-front for correct depth */
        const rendered = dots.map(d => {
            const wave = Math.sin((d.ix + dotPhase) * 0.28) * 55
                + Math.sin((d.iz + dotPhase) * 0.38) * 40
                + Math.sin((d.ix + d.iz + dotPhase) * 0.18) * 25;
            const y3 = wave - 60;
            const pr = projectDot(d.bx, y3, d.bz - 600);
            if (!pr || pr.px < -20 || pr.px > W + 20 || pr.py < -20 || pr.py > H + 20) return null;
            const depth = (d.bz + H / 2) / (H);
            return { ...d, pr, depth, wave };
        }).filter(Boolean).sort((a, b) => a.depth - b.depth);

        rendered.forEach(d => {
            const { pr, depth, wave } = d;
            const sz = Math.max(0.5, pr.s * 5.5);
            const alpha = 0.15 + depth * 0.7;
            /* pulse glow from wave */
            const wavePct = (wave + 120) / 240;
            const hue = 220 + wavePct * 80;
            const sat = 60 + wavePct * 30;
            const lit = 40 + wavePct * 35;

            if (sz > 2) {
                /* glow ring */
                ctxW.save();
                ctxW.shadowColor = `hsla(${hue},${sat}%,${lit}%,0.6)`;
                ctxW.shadowBlur = sz * 3;
                ctxW.fillStyle = `hsla(${hue},${sat}%,${lit}%,${alpha * 0.9})`;
                ctxW.beginPath();
                ctxW.arc(pr.px, pr.py, sz * 0.55, 0, Math.PI * 2);
                ctxW.fill();
                ctxW.restore();
            } else {
                ctxW.fillStyle = `hsla(${hue},${sat}%,${lit + 10}%,${alpha})`;
                ctxW.fillRect(pr.px - 0.5, pr.py - 0.5, 1.5, 1.5);
            }
        });
    }

    /* ════════════════════════════════════════════════
       LAYER 2 FX — Particles + Rings + Core + Text-Particles
    ════════════════════════════════════════════════ */
    const FOV = 500;
    function proj(x, y, z) { const s = FOV / (FOV + z); return { x: cx + x * s, y: cy + y * s, s }; }

    /* ── HYPERSPACE RINGS ── */
    const RINGS = 20;
    let rings = [];
    function makeRings() {
        rings = [];
        for (let i = 0; i < RINGS; i++) {
            rings.push({
                z: i * (800 / RINGS) - 200,
                vz: -3,
                r: 200 + Math.random() * 80,
                hue: i * (360 / RINGS),
                gap: Math.random() * Math.PI * 2,
                gapSz: Math.PI * 0.25 + Math.random() * Math.PI * 0.5,
                lw: 1.2 + Math.random() * 2,
            });
        }
    }

    function drawRings() {
        rings.forEach(r => {
            r.z += r.vz;
            if (r.z < -FOV * 0.85) r.z = 700;
            const p = proj(0, 0, r.z);
            if (p.s < 0.04 || p.s > 6) return;
            const rad = r.r * p.s;
            const hue = (r.hue + tick * 0.6) % 360;
            const a = Math.min(1, p.s * 0.75) * 0.65;
            ctxF.save();
            ctxF.beginPath();
            ctxF.arc(p.x, p.y, rad, r.gap, r.gap + Math.PI * 2 - r.gapSz);
            ctxF.strokeStyle = `hsla(${hue},85%,68%,${a})`;
            ctxF.lineWidth = r.lw * Math.max(0.3, p.s);
            ctxF.shadowColor = `hsla(${hue},100%,75%,0.8)`;
            ctxF.shadowBlur = 14 * p.s;
            ctxF.stroke();
            /* inner bright */
            ctxF.beginPath();
            ctxF.arc(p.x, p.y, rad * 0.9, r.gap, r.gap + Math.PI * 2 - r.gapSz);
            ctxF.strokeStyle = `hsla(${hue},100%,92%,${a * 0.35})`;
            ctxF.lineWidth = r.lw * 0.3 * Math.max(0.3, p.s);
            ctxF.shadowBlur = 5;
            ctxF.stroke();
            ctxF.restore();
        });
    }

    /* ── LIGHT STREAKS (hyperspace) ── */
    const STREAKS = 55;
    let streaks = [];
    function makeStreaks() {
        streaks = [];
        for (let i = 0; i < STREAKS; i++) {
            const ang = Math.random() * Math.PI * 2;
            const r = (60 + Math.random() * 0.4 * Math.min(W, H));
            streaks.push({
                angle: ang, r,
                x3: Math.cos(ang) * r, y3: Math.sin(ang) * r,
                z: Math.random() * 700,
                speed: 3 + Math.random() * 9,
                hue: 210 + Math.random() * 130,
                len: 0.05 + Math.random() * 0.18,
            });
        }
    }
    function drawStreaks() {
        streaks.forEach(s => {
            s.z -= s.speed;
            if (s.z < -FOV * 0.8) { s.z = 650 + Math.random() * 150; }
            const zB = s.z + s.speed * (1 / s.len);
            const pF = proj(s.x3, s.y3, s.z);
            const pB = proj(s.x3, s.y3, Math.min(600, zB));
            if (pF.s < 0.04 || pF.s > 5) return;
            const a = Math.min(1, pF.s) * 0.55;
            ctxF.save();
            const g = ctxF.createLinearGradient(pB.x, pB.y, pF.x, pF.y);
            g.addColorStop(0, `hsla(${s.hue},90%,82%,0)`);
            g.addColorStop(1, `hsla(${s.hue},90%,92%,${a})`);
            ctxF.strokeStyle = g;
            ctxF.lineWidth = Math.max(0.3, pF.s * 1.1);
            ctxF.shadowColor = `hsla(${s.hue},100%,82%,0.5)`;
            ctxF.shadowBlur = 4;
            ctxF.beginPath();
            ctxF.moveTo(pB.x, pB.y); ctxF.lineTo(pF.x, pF.y);
            ctxF.stroke(); ctxF.restore();
        });
    }

    /* ── FLOATING PARTICLES (background stars) ── */
    const PARTS = 1400;
    let parts = [];
    function makeParts() {
        parts = [];
        for (let i = 0; i < PARTS; i++) {
            const layer = Math.floor(Math.random() * 3);
            parts.push({
                x: (Math.random() - .5) * W * 2.5,
                y: (Math.random() - .5) * H * 2.5,
                z: layer === 0 ? Math.random() * 500 + 200 : layer === 1 ? Math.random() * 400 - 100 : Math.random() * 300 - 250,
                vz: layer === 0 ? -.3 - Math.random() * .3 : layer === 1 ? -.6 - Math.random() * .5 : -1.2 - Math.random() * .8,
                vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
                sz: 0.8 + Math.random() * 2.2, layer,
                hue: layer === 2 ? 200 + Math.random() * 80 : layer === 1 ? 255 + Math.random() * 55 : 295 + Math.random() * 55,
                a: 0.4 + Math.random() * .6,
                ph: Math.random() * Math.PI * 2,
            });
        }
    }
    function drawParts() {
        const mx = (mouse.x - .5) * 55, my = (mouse.y - .5) * 35;
        parts.forEach(p => {
            p.x += p.vx + mx * 0.0007 * (p.layer + 1);
            p.y += p.vy + my * 0.0007 * (p.layer + 1);
            p.z += p.vz;
            if (p.z < -FOV * .9) { p.z = 550; p.x = (Math.random() - .5) * W * 2; p.y = (Math.random() - .5) * H * 2; }
            if (Math.abs(p.x) > W * 1.6) p.x = (Math.random() - .5) * W * 2;
            if (Math.abs(p.y) > H * 1.6) p.y = (Math.random() - .5) * H * 2;
            const pr = proj(p.x, p.y, p.z);
            if (pr.s < 0.04 || pr.s > 5) return;
            const pulse = Math.sin(tick * .025 + p.ph) * .3 + .7;
            const sz = p.sz * pr.s * pulse;
            const a = Math.min(1, pr.s * 1.5) * p.a * pulse;
            ctxF.save();
            ctxF.shadowColor = `hsla(${p.hue},90%,72%,${a * .7})`;
            ctxF.shadowBlur = sz * 3.5;
            ctxF.fillStyle = `hsla(${p.hue},85%,78%,${a})`;
            ctxF.beginPath(); ctxF.arc(pr.x, pr.y, Math.max(0.3, sz), 0, Math.PI * 2); ctxF.fill();
            ctxF.restore();
        });
    }

    /* ── ENERGY CORE ── */
    function drawCore() {
        const p1 = Math.sin(tick * .042) * .5 + .5, p2 = Math.sin(tick * .068 + 1) * .5 + .5;
        /* outer halos */
        [2.0, 1.5, 1.1].forEach((m, i) => {
            const r = (55 + p1 * 18) * m;
            const hue = 230 + i * 28 + (tick * .4) % 55;
            ctxF.save();
            ctxF.shadowBlur = 70; ctxF.shadowColor = `hsla(${hue},100%,72%,0.4)`;
            const g = ctxF.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, `hsla(${hue},90%,72%,${0.06 - i * .015})`);
            g.addColorStop(.5, `hsla(${hue + 15},80%,55%,${0.03 - i * .008})`);
            g.addColorStop(1, `hsla(${hue},70%,40%,0)`);
            ctxF.fillStyle = g;
            ctxF.beginPath(); ctxF.arc(cx, cy, r, 0, Math.PI * 2); ctxF.fill();
            ctxF.restore();
        });
        /* spinning rings */
        for (let i = 0; i < 4; i++) {
            const r = 38 + i * 16, rot = tick * (.02 - i * .005) * (i % 2 ? 1 : -1);
            const hue = (200 + i * 45 + tick * .5) % 360;
            ctxF.save();
            ctxF.translate(cx, cy); ctxF.rotate(rot);
            ctxF.shadowColor = `hsla(${hue},100%,72%,0.9)`;
            ctxF.shadowBlur = 18;
            ctxF.strokeStyle = `hsla(${hue},90%,72%,0.75)`;
            ctxF.lineWidth = 1.5;
            ctxF.setLineDash([3 + i * 2, 7 + i * 3]);
            ctxF.beginPath(); ctxF.arc(0, 0, r, 0, Math.PI * 2); ctxF.stroke();
            ctxF.setLineDash([]);
            ctxF.restore();
        }
        /* core pulse */
        const cg = ctxF.createRadialGradient(cx, cy, 0, cx, cy, 40 + p2 * 14);
        const ch = (220 + tick * .6) % 360;
        cg.addColorStop(0, `hsla(${ch},100%,95%,.92)`);
        cg.addColorStop(.35, `hsla(${ch + 15},90%,72%,.65)`);
        cg.addColorStop(.7, `hsla(${ch + 30},80%,50%,.25)`);
        cg.addColorStop(1, 'rgba(0,0,0,0)');
        ctxF.save();
        ctxF.shadowColor = 'rgba(108,99,255,.95)'; ctxF.shadowBlur = 55;
        ctxF.fillStyle = cg; ctxF.beginPath(); ctxF.arc(cx, cy, 40 + p2 * 14, 0, Math.PI * 2); ctxF.fill();
        ctxF.restore();
        /* white center */
        ctxF.save();
        ctxF.shadowColor = '#fff'; ctxF.shadowBlur = 35;
        ctxF.fillStyle = `rgba(255,255,255,${.88 + p1 * .1})`;
        ctxF.beginPath(); ctxF.arc(cx, cy, 4.5 + p1 * 2, 0, Math.PI * 2); ctxF.fill();
        ctxF.restore();
    }

    /* ── PARTICLE TEXT EFFECT (from particle-text-effect component) ──
       Particles form the name text then scatter out */
    let textParticles = [];
    let textPhase = 'idle'; /* idle → forming → formed → scatter */
    let textTick = 0;
    const TEXT_WORDS = ['RAVEENDRA K', 'BACKEND DEV'];
    let textWordIdx = 0;

    function sampleText(word) {
        const oc = document.createElement('canvas');
        oc.width = Math.min(W, 900); oc.height = 120;
        const ox = oc.getContext('2d');
        const fs = Math.min(96, oc.width * 0.12);
        ox.font = `900 ${fs}px Inter,JetBrains Mono,monospace`;
        ox.textAlign = 'center'; ox.textBaseline = 'middle';
        ox.fillStyle = '#fff';
        ox.fillText(word, oc.width / 2, oc.height / 2);
        const d = ox.getImageData(0, 0, oc.width, oc.height).data;
        const pts = [];
        const STEP = 4;
        for (let y = 0; y < oc.height; y += STEP) {
            for (let x = 0; x < oc.width; x += STEP) {
                if (d[(y * oc.width + x) * 4 + 3] > 80) {
                    pts.push({
                        tx: cx + (x - oc.width / 2),
                        ty: cy + (y - oc.height / 2) - H * .28,
                    });
                }
            }
        }
        return pts;
    }

    function initTextParticles() {
        if (!W || !H) return;
        const pts = sampleText(TEXT_WORDS[textWordIdx]);
        textParticles = pts.map(p => ({
            x: cx + (Math.random() - .5) * W * 2,
            y: cy + (Math.random() - .5) * H * 2,
            tx: p.tx, ty: p.ty,
            vx: 0, vy: 0,
            hue: 200 + Math.random() * 140,
            a: 0, sz: 1.5 + Math.random() * 1.5,
            ph: Math.random() * Math.PI * 2,
        }));
        textPhase = 'forming'; textTick = 0;
    }

    function updateTextParticles() {
        if (textPhase === 'idle') return;
        textTick++;

        if (textPhase === 'forming' && textTick > 340) {
            textPhase = 'formed';
            setTimeout(() => {
                textPhase = 'scatter'; textTick = 0;
                textWordIdx = (textWordIdx + 1) % TEXT_WORDS.length;
                setTimeout(initTextParticles, 800);
            }, 1800);
        }
        if (textPhase === 'scatter' && textTick > 60) textPhase = 'idle';

        textParticles.forEach(p => {
            if (textPhase === 'forming' || textPhase === 'formed') {
                const dx = p.tx - p.x, dy = p.ty - p.y;
                p.vx += dx * 0.06; p.vy += dy * 0.06;
                p.vx *= 0.78; p.vy *= 0.78;
                p.a = Math.min(1, p.a + 0.04);
            } else {
                const ang = Math.atan2(p.y - cy, p.x - cx) + Math.PI * .08;
                const sp = 4 + Math.random() * 8;
                p.vx += Math.cos(ang) * sp; p.vy += Math.sin(ang) * sp;
                p.a = Math.max(0, p.a - 0.055);
            }
            p.x += p.vx; p.y += p.vy;
            const pulse = Math.sin(tick * .03 + p.ph) * .3 + .7;
            if (p.a < 0.01) return;
            ctxF.save();
            ctxF.shadowColor = `hsla(${p.hue},90%,75%,${p.a * .7})`;
            ctxF.shadowBlur = p.sz * 4;
            ctxF.fillStyle = `hsla(${p.hue},85%,80%,${p.a * pulse})`;
            ctxF.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz);
            ctxF.restore();
        });
    }

    /* ── ANIMATED WAVE BARS (from animated-footer component) ── */
    function drawWaveBars() {
        const BARS = 26;
        const bh = H * 0.12;  /* total height for bars zone at bottom */
        ctxF.save();
        for (let i = 0; i < BARS; i++) {
            const t = i / BARS;
            const waveY = Math.max(0, 22 * Math.sin((tick * .08 + i) * .3));
            const barH = (i + 1) * (bh / BARS);
            const y = H - barH + waveY;
            const hue = 220 + t * 60 + (tick * .5) % 40;
            const a = 0.09 + t * 0.14;
            ctxF.fillStyle = `hsla(${hue},75%,62%,${a})`;
            ctxF.fillRect(0, y, W, barH + 2);
        }
        ctxF.restore();
    }

    /* ── VIGNETTE ── */
    function drawVignette() {
        const v = ctxF.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * .85);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.72)');
        ctxF.fillStyle = v; ctxF.fillRect(0, 0, W, H);
    }

    /* ════════════════════════════════════════════════
       MAIN LOOP
    ════════════════════════════════════════════════ */
    function loop() {
        raf = requestAnimationFrame(loop);
        tick++;

        /* WAVE CANVAS */
        drawDots();

        /* FX CANVAS */
        ctxF.clearRect(0, 0, W, H);
        drawStreaks();
        drawRings();
        drawParts();
        drawWaveBars();
        updateTextParticles();
        drawCore();
        drawVignette();
    }

    /* ════════════════════════════════════════════════
       TEXT OVERLAY REVEAL
    ════════════════════════════════════════════════ */
    function revealOverlay() {
        setTimeout(() => document.getElementById('s13Name')?.classList.add('in'), 500);
        setTimeout(() => document.getElementById('s13Tag')?.classList.add('in'), 1100);
        setTimeout(() => document.getElementById('s13Nav')?.classList.add('in'), 1700);
        setTimeout(() => document.getElementById('s13Copy')?.classList.add('in'), 2400);
    }
    function hideOverlay() {
        ['s13Name', 's13Tag', 's13Nav', 's13Copy'].forEach(id => {
            document.getElementById(id)?.classList.remove('in');
        });
    }

    /* ════════════════════════════════════════════════
       START / STOP
    ════════════════════════════════════════════════ */
    function startAnim() {
        if (running) return; running = true;
        resize();
        makeParts(); makeRings(); makeStreaks();
        tick = 0; dotPhase = 0;
        hideOverlay();
        revealOverlay();
        setTimeout(initTextParticles, 2000);
        loop();
    }
    function stopAnim() {
        if (raf) cancelAnimationFrame(raf);
        raf = null; running = false;
    }

    section.addEventListener('mousemove', e => {
        const r = section.getBoundingClientRect();
        mouse.x = (e.clientX - r.left) / r.width;
        mouse.y = (e.clientY - r.top) / r.height;
    });

    new MutationObserver(() => {
        if (section.style.display === 'block') startAnim(); else stopAnim();
    }).observe(section, { attributes: true, attributeFilter: ['style'] });

    new IntersectionObserver(e => {
        e[0].isIntersecting ? startAnim() : stopAnim();
    }, { threshold: 0.15 }).observe(section);

    window.addEventListener('resize', () => { if (running) { resize(); makeParts(); makeRings(); makeStreaks(); } });
})();