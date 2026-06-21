/* ── CONTACT CANVAS PARTICLES ── */
(function () {
    const canvas = document.getElementById('contactCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function rand(a, b) { return a + Math.random() * (b - a); }

    for (let i = 0; i < 55; i++) {
        particles.push({
            x: rand(0, 1), y: rand(0, 1),
            vx: rand(-0.06, 0.06) * 0.5, vy: rand(-0.06, 0.06) * 0.5,
            r: rand(1, 2.5),
            alpha: rand(0.2, 0.7),
            color: Math.random() > 0.5 ? '108,99,255' : '0,212,255'
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            p.x += p.vx / W; p.y += p.vy / H;
            if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
            if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
            ctx.fill();
        });
        // draw faint connection lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = (particles[i].x - particles[j].x) * W;
                const dy = (particles[i].y - particles[j].y) * H;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x * W, particles[i].y * H);
                    ctx.lineTo(particles[j].x * W, particles[j].y * H);
                    ctx.strokeStyle = `rgba(108,99,255,${0.08 * (1 - dist / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
})();

//send button
document
    .getElementById('cSendBtn')
    ?.addEventListener(
        'click',
        async function () {
            const btn = this;

            const name =
                document
                    .getElementById('cf-name')
                    .value
                    .trim();

            const email =
                document
                    .getElementById('cf-email')
                    .value
                    .trim();

            const subject =
                document
                    .getElementById('cf-subject')
                    .value
                    .trim();

            const message =
                document
                    .getElementById('cf-message')
                    .value
                    .trim();

            const success = document.getElementById('cSuccess');

            if (!name || !email || !subject || !message) {
                alert('Fill all fields');
                return;
            }

            btn.disabled = true;
            btn.querySelector('.c-send-text').textContent = 'Sending...';

            try {
                await emailjs.send(
                    'service_jhqq789',
                    'template_98jjkrj',
                    {
                        from_name: name,
                        from_email: email,
                        subject: subject,
                        message: message,
                        to_email: 'kuchuravindra16329@gmail.com'
                    }
                );

                success.style.display = 'block';
                btn.querySelector('.c-send-text').textContent = '✓ Sent';

                // Clear form fields
                document.getElementById('cf-name').value = '';
                document.getElementById('cf-email').value = '';
                document.getElementById('cf-subject').value = '';
                document.getElementById('cf-message').value = '';

                setTimeout(() => {
                    btn.querySelector('.c-send-text').textContent = 'Send Message';
                }, 3000);
            }
            catch (err) {
                alert('Failed to send');
                btn.querySelector('.c-send-text').textContent = 'Send Message';
            }

            btn.disabled = false;
        }
    );


/* ================================================================
CONTACT SECTION — WALKING CHARACTER SCENE
Replace your entire previous contact scene script with this
================================================================ */
(function () {
    const canvas = document.getElementById('contactCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        W = canvas.width = rect.width || window.innerWidth;
        H = canvas.height = rect.height || window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── FLOOR at 88% height — bottom strip ── */
    const FLOOR = () => H * 0.88;

    /* ── Scene is entirely in the RIGHT HALF of screen ──
       Character walks from x=0 (left edge) all the way to
       rightmost edge (W), passing through visible right zone  */
    const DESK_X = () => W * 0.90;   /* laptop/desk at 80% width  */
    const DESK_Y = () => FLOOR() - 55;
    const START_X = -100;              /* starts offscreen left     */
    const STOP_X = () => DESK_X() - 30; /* sits here               */
    const END_X = () => W + 120;    /* walks off right edge       */

    /* ── STATE MACHINE ── */
    const STATES = ['walk', 'sit', 'type', 'click', 'celebrate', 'walkout'];
    const DURATION = { walk: 220, sit: 55, type: 200, click: 45, celebrate: 110, walkout: 160 };
    let state = 'walk';
    let stateT = 0;
    let personX = START_X;
    let cycle = 0;
    let typeTick = 0;
    let blinkOpen = true;
    let blinkTick = 0;
    let msgSent = false;
    let sendParticles = [];

    function nextState() {
        const idx = STATES.indexOf(state);
        state = STATES[(idx + 1) % STATES.length];
        stateT = 0;
        if (state === 'walk') {           /* loop reset */
            personX = START_X;
            cycle = 0;
            typeTick = 0;
            msgSent = false;
        }
    }

    /* ── HELPERS ── */
    function rr(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /* ── FLOOR LINE ── */
    function drawFloor() {
        const y = FLOOR();
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, 'rgba(108,99,255,0)');
        g.addColorStop(0.35, 'rgba(108,99,255,0.35)');
        g.addColorStop(0.7, 'rgba(0,212,255,0.28)');
        g.addColorStop(1, 'rgba(0,212,255,0)');
        ctx.save();
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(108,99,255,0.4)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(W, y);
        ctx.stroke();
        ctx.restore();
    }

    /* ── PARTICLES (subtle, full canvas) ── */
    const dots = Array.from({ length: 35 }, () => ({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - .5) * 0.00025,
        vy: (Math.random() - .5) * 0.00025,
        r: Math.random() * 1.6 + 0.5,
        a: Math.random() * 0.35 + 0.1,
        col: Math.random() > .5 ? '108,99,255' : '0,212,255'
    }));
    function drawParticles() {
        dots.forEach(d => {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0) d.x = 1; if (d.x > 1) d.x = 0;
            if (d.y < 0) d.y = 1; if (d.y > 1) d.y = 0;
            ctx.beginPath();
            ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${d.col},${d.a})`;
            ctx.fill();
        });
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = (dots[i].x - dots[j].x) * W, dy = (dots[i].y - dots[j].y) * H;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 85) {
                    ctx.beginPath();
                    ctx.moveTo(dots[i].x * W, dots[i].y * H);
                    ctx.lineTo(dots[j].x * W, dots[j].y * H);
                    ctx.strokeStyle = `rgba(108,99,255,${0.06 * (1 - dist / 85)})`;
                    ctx.lineWidth = 0.4;
                    ctx.stroke();
                }
            }
        }
    }

    /* ── CHAIR ── */
    function drawChair(cx, cy) {
        ctx.save();
        ctx.strokeStyle = 'rgba(108,99,255,0.55)';
        ctx.fillStyle = 'rgba(108,99,255,0.14)';
        ctx.lineWidth = 1.5;
        rr(cx - 22, cy - 14, 44, 11, 4); ctx.fill(); ctx.stroke();  /* seat */
        rr(cx - 18, cy - 42, 36, 29, 4); ctx.fill(); ctx.stroke();  /* back */
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy - 3); ctx.lineTo(cx - 20, cy + 12);
        ctx.moveTo(cx + 15, cy - 3); ctx.lineTo(cx + 20, cy + 12);
        ctx.stroke();
        ctx.restore();
    }

    /* ── DESK ── */
    function drawDesk(cx, cy) {
        const dw = 180;
        ctx.save();
        const g = ctx.createLinearGradient(cx - dw / 2, 0, cx + dw / 2, 0);
        g.addColorStop(0, 'rgba(108,99,255,0)');
        g.addColorStop(0.25, 'rgba(108,99,255,0.6)');
        g.addColorStop(0.75, 'rgba(0,212,255,0.55)');
        g.addColorStop(1, 'rgba(0,212,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(108,99,255,0.45)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(cx - dw / 2, cy); ctx.lineTo(cx + dw / 2, cy);
        ctx.stroke();
        ctx.restore();
    }

    /* ── LAPTOP ── */
    function drawLaptop(cx, cy) {
        const lw = 114, lh = 72, sw = 134, sh = 11;
        ctx.save();

        /* screen glow */
        const sg = ctx.createRadialGradient(cx, cy - lh / 2, 4, cx, cy - lh / 2, 88);
        sg.addColorStop(0, 'rgba(108,99,255,0.22)');
        sg.addColorStop(1, 'rgba(108,99,255,0)');
        ctx.fillStyle = sg; ctx.fillRect(cx - 90, cy - lh - 40, 180, 130);

        /* keyboard base */
        ctx.fillStyle = '#1e1e2e'; ctx.strokeStyle = 'rgba(108,99,255,0.55)'; ctx.lineWidth = 1.5;
        rr(cx - sw / 2, cy - sh, sw, sh, 4); ctx.fill(); ctx.stroke();

        /* keys */
        ctx.fillStyle = 'rgba(108,99,255,0.2)';
        for (let r = 0; r < 2; r++) for (let c = 0; c < 9; c++) {
            rr(cx - sw / 2 + 7 + c * 14, cy - sh + 2 + r * 4, 11, 3, 1); ctx.fill();
        }

        /* screen */
        ctx.fillStyle = '#080814'; ctx.strokeStyle = 'rgba(108,99,255,0.7)'; ctx.lineWidth = 1.5;
        rr(cx - lw / 2, cy - sh - lh, lw, lh, 6); ctx.fill(); ctx.stroke();

        /* code lines on screen */
        const lines = [
            { c: 'rgba(0,212,255,0.95)', w: 60, y: 10 },
            { c: 'rgba(167,139,250,0.8)', w: 44, y: 20 },
            { c: 'rgba(255,255,255,0.35)', w: 70, y: 30 },
            { c: 'rgba(108,99,255,0.65)', w: 35, y: 40 },
            { c: 'rgba(0,212,255,0.7)', w: 52, y: 50 },
        ];
        lines.forEach(l => {
            ctx.fillStyle = l.c;
            rr(cx - lw / 2 + 8, cy - sh - lh + l.y, l.w, 4, 2); ctx.fill();
        });

        /* typing cursor on screen */
        if ((state === 'type' || state === 'click') && Math.floor(Date.now() / 480) % 2 === 0) {
            ctx.fillStyle = 'rgba(0,212,255,1)';
            ctx.fillRect(cx - lw / 2 + 8 + lines[4].w + 2, cy - sh - lh + 48, 2, 7);
        }

        /* top glow edge */
        ctx.strokeStyle = 'rgba(0,212,255,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - lw / 2 + 7, cy - sh - lh + 1); ctx.lineTo(cx + lw / 2 - 7, cy - sh - lh + 1);
        ctx.stroke();

        /* hinge */
        ctx.fillStyle = 'rgba(108,99,255,0.6)';
        ctx.beginPath(); ctx.arc(cx, cy - sh, 3.5, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }

    /* ── SEND BURST ── */
    function triggerSend(x, y) {
        for (let i = 0; i < 22; i++) {
            const a = Math.random() * Math.PI * 2, sp = 2.5 + Math.random() * 5;
            sendParticles.push({
                x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
                life: 1,
                color: `hsl(${Math.random() * 60 + 240},85%,68%)`
            });
        }
    }
    function drawSendParticles() {
        sendParticles = sendParticles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.022;
            if (p.life <= 0) return false;
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            return true;
        });
    }

    /* ── SPEECH BUBBLE ── */
    function drawBubble(bx, by, text, col = '#6C63FF') {
        ctx.save();
        ctx.font = 'bold 12px Inter,sans-serif';
        const tw = ctx.measureText(text).width;
        const pw = 14, bw = tw + pw * 2, bh = 30, br = 8;
        const rx = bx + 14, ry = by - 96;
        ctx.fillStyle = col;
        rr(rx, ry, bw, bh, br); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(rx + 12, ry + bh); ctx.lineTo(rx + 5, ry + bh + 10); ctx.lineTo(rx + 24, ry + bh);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
        ctx.fillText(text, rx + pw, ry + bh / 2);
        ctx.restore();
    }

    /* ── PERSON ── */
    function drawPerson(px, py, walkCyc, st, sT, eyeOpen) {
        ctx.save();

        /* position offsets for sitting */
        const prog = Math.min(sT / DURATION[st], 1);
        let oX = 0, oY = 0;
        if (st === 'sit') { oX = prog * -10; oY = prog * 24; }
        if (['type', 'click', 'celebrate', 'walkout'].includes(st)) { oX = -10; oY = 24; }

        const bx = px + oX;
        const by = py + oY;

        /* body bob while walking */
        const bob = (st === 'walk' || st === 'walkout') ? Math.abs(Math.sin(walkCyc * 0.14)) * -5 : 0;
        const BY = by + bob;

        /* SHADOW */
        ctx.beginPath();
        ctx.ellipse(bx, BY + 3, 20, 5, 0, Math.PI * 2, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();

        /* LEGS */
        const walking = st === 'walk' || st === 'walkout';
        if (walking) {
            const ls = Math.sin(walkCyc * 0.14) * 22;
            [[-7, ls], [5, -ls]].forEach(([lx, ang]) => {
                ctx.save();
                ctx.translate(bx + lx, BY - 22);
                ctx.rotate(ang * Math.PI / 180);
                ctx.fillStyle = '#2828AA';
                rr(-4, 0, 10, 22, 5); ctx.fill();
                ctx.fillStyle = '#1a1a6e';
                rr(-6, 19, 14, 8, 4); ctx.fill();
                ctx.restore();
            });
        } else {
            /* sitting legs angled */
            [[bx - 12, BY - 10, 75], [bx + 2, BY - 10, 75]].forEach(([lx, ly, ang]) => {
                ctx.save();
                ctx.translate(lx, ly);
                ctx.rotate(ang * Math.PI / 180);
                ctx.fillStyle = '#2828AA';
                rr(-4, 0, 10, 22, 5); ctx.fill();
                ctx.restore();
            });
            ctx.fillStyle = '#1a1a6e';
            rr(bx - 22, BY + 14, 16, 7, 3); ctx.fill();
            rr(bx + 5, BY + 14, 16, 7, 3); ctx.fill();
        }

        /* TORSO */
        ctx.fillStyle = '#6C63FF';
        rr(bx - 15, BY - 56, 30, 36, 9); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        rr(bx - 7, BY - 50, 14, 3, 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        rr(bx - 5, BY - 44, 10, 2, 1); ctx.fill();

        /* LEFT ARM */
        ctx.save();
        ctx.translate(bx - 15, BY - 50);
        const lAng = walking ? Math.sin(walkCyc * 0.14 + Math.PI) * 24
            : st === 'type' ? -22 + Math.sin(typeTick * 0.24) * 10
                : st === 'click' ? -38
                    : st === 'celebrate' ? -88 + Math.sin(typeTick * 0.18) * 32
                        : -14;
        ctx.rotate(lAng * Math.PI / 180);
        ctx.fillStyle = '#5a52e0';
        rr(-5, 0, 10, 20, 5); ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 22, 6, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f4c17a'; ctx.fill();
        ctx.restore();

        /* RIGHT ARM */
        ctx.save();
        ctx.translate(bx + 15, BY - 50);
        const rAng = walking ? Math.sin(walkCyc * 0.14) * 24
            : st === 'type' ? -22 + Math.sin(typeTick * 0.24 + Math.PI) * 10
                : st === 'click' ? -52
                    : st === 'celebrate' ? -88 + Math.sin(typeTick * 0.18 + Math.PI) * 32
                        : -14;
        ctx.rotate(rAng * Math.PI / 180);
        ctx.fillStyle = '#5a52e0';
        rr(-5, 0, 10, 20, 5); ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 22, 6, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f4c17a'; ctx.fill();
        ctx.restore();

        /* NECK */
        ctx.fillStyle = '#f4c17a';
        rr(bx - 5, BY - 65, 10, 10, 4); ctx.fill();

        /* HEAD */
        ctx.save();
        let hTilt = 0;
        if (st === 'type' || st === 'click') hTilt = -8;
        if (st === 'celebrate') hTilt = Math.sin(typeTick * 0.1) * 12;
        if (walking) hTilt = Math.sin(walkCyc * 0.08) * 3;
        ctx.translate(bx, BY - 76);
        ctx.rotate(hTilt * Math.PI / 180);

        /* hair */
        ctx.beginPath(); ctx.ellipse(0, -13, 17, 11, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#1a0a00'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-15, -4, 5, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#1a0a00'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(15, -4, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        /* face */
        ctx.beginPath(); ctx.ellipse(0, 0, 17, 19, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f4c17a'; ctx.fill();

        /* ears */
        [-18, 18].forEach(ex => {
            ctx.beginPath(); ctx.ellipse(ex, 0, 3, 5.5, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#f4c17a'; ctx.fill();
        });

        /* eyebrows */
        ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        [[-9, 2], [2, 2]].forEach(([x, _]) => {
            ctx.beginPath();
            ctx.moveTo(x, -8); ctx.quadraticCurveTo(x + 4, -12, x + 8, -8);
            ctx.stroke();
        });

        /* eyes */
        const eyH = eyeOpen ? 4.5 : 0.6;
        [[-7, 7]].flat().forEach(ex => {
            ctx.beginPath();
            ctx.ellipse(ex, -2.5, 3.8, eyH, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.fill();
            if (eyeOpen) {
                ctx.beginPath();
                ctx.ellipse(ex + (st === 'type' ? 1.5 : 0), -2.5, 2.2, 2.8, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#1a0a00'; ctx.fill();
                ctx.beginPath(); ctx.arc(ex + 1, -3.5, 0.9, 0, Math.PI * 2);
                ctx.fillStyle = '#fff'; ctx.fill();
            }
        });

        /* nose */
        ctx.beginPath(); ctx.ellipse(0, 4, 2.8, 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#e8a850'; ctx.fill();

        /* mouth */
        ctx.strokeStyle = '#c0704a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath();
        if (st === 'celebrate') {
            ctx.moveTo(-8, 11); ctx.quadraticCurveTo(0, 17, 8, 11);
        } else if (st === 'type') {
            const mo = Math.sin(typeTick * 0.28) > 0;
            ctx.moveTo(-6, 10); ctx.quadraticCurveTo(0, mo ? 14 : 11, 6, 10);
        } else {
            ctx.moveTo(-5, 10); ctx.quadraticCurveTo(0, 13, 5, 10);
        }
        ctx.stroke();

        ctx.restore(); /* head */

        /* CELEBRATE STARS */
        if (st === 'celebrate') {
            const cols = ['#FFD700', '#00D4FF', '#6C63FF', '#FF6B6B', '#4ade80', '#f472b6'];
            for (let s = 0; s < 7; s++) {
                const a = (sT * 0.055 + s * 0.95), rad = 38 + s * 9;
                const sx = bx + Math.cos(a) * rad, sy = (BY - 70) + Math.sin(a) * rad * 0.5;
                const sz = 4 + Math.sin(sT * 0.09 + s) * 2;
                ctx.save();
                ctx.translate(sx, sy); ctx.rotate(sT * 0.07);
                ctx.fillStyle = cols[s % 6];
                ctx.beginPath();
                for (let p = 0; p < 5; p++) {
                    const pa = p * Math.PI * 2 / 5 - Math.PI / 2, pa2 = pa + Math.PI / 5;
                    p === 0
                        ? ctx.moveTo(Math.cos(pa) * sz, Math.sin(pa) * sz)
                        : ctx.lineTo(Math.cos(pa) * sz, Math.sin(pa) * sz);
                    ctx.lineTo(Math.cos(pa2) * sz * 0.42, Math.sin(pa2) * sz * 0.42);
                }
                ctx.closePath(); ctx.fill();
                ctx.restore();
            }
        }
        ctx.restore();
    }

    /* ── MAIN LOOP ── */
    function loop() {
        ctx.clearRect(0, 0, W, H);
        drawParticles();
        drawFloor();

        const deskX = DESK_X(), deskY = DESK_Y(), floorY = FLOOR();
        drawChair(deskX - 32, floorY - 8);
        drawDesk(deskX, deskY + 55);
        drawLaptop(deskX, deskY + 55);
        drawSendParticles();

        /* STATE MACHINE TICK */
        stateT++;
        blinkTick++;
        if (blinkTick === 150) { blinkOpen = false; }
        if (blinkTick === 156) { blinkOpen = true; blinkTick = 0; }
        if (state === 'type' || state === 'click' || state === 'celebrate') typeTick++;

        switch (state) {
            case 'walk': {
                const target = STOP_X();
                const spd = Math.max(0.7, (target - personX) / 150);
                personX += spd;
                cycle++;
                if (personX >= target) nextState();
                break;
            }
            case 'sit': {
                if (stateT >= DURATION.sit) nextState();
                break;
            }
            case 'type': {
                if (stateT >= DURATION.type) nextState();
                break;
            }
            case 'click': {
                if (stateT === 16 && !msgSent) {
                    msgSent = true;
                    triggerSend(deskX - 20, deskY + 20);
                }
                if (stateT >= DURATION.click) nextState();
                break;
            }
            case 'celebrate': {
                if (stateT >= DURATION.celebrate) nextState();
                break;
            }
            case 'walkout': {
                personX += 2.8;
                cycle++;
                if (personX > END_X()) nextState(); /* next = walk (reset) */
                break;
            }
        }

        /* compute sitting offsets for draw call */
        const prog = Math.min(stateT / DURATION[state], 1);
        let oX = 0, oY = 0;
        if (state === 'sit') { oX = prog * -10; oY = prog * 24; }
        if (['type', 'click', 'celebrate', 'walkout'].includes(state)) { oX = -10; oY = 24; }

        drawPerson(personX, floorY, cycle, state, stateT, blinkOpen);

        /* speech bubbles */
        const bubX = personX + oX, bubY = floorY + oY - 10;
        if (state === 'walk' && stateT > 70 && stateT < 180)
            drawBubble(bubX, bubY, 'Coming to say hi! 👋');
        if (state === 'type' && stateT > 50 && stateT < 170)
            drawBubble(bubX, bubY, 'Typing message... ⌨️', '#0891b2');
        if (state === 'click' && stateT > 8)
            drawBubble(bubX, bubY, 'Message sent! ✅', '#059669');
        if (state === 'celebrate' && stateT > 10 && stateT < 95)
            drawBubble(bubX, bubY, "Let's connect..", '#7C3AED');

        requestAnimationFrame(loop);
    }
    loop();
})();