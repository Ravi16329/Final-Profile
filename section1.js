(function () {
    const char = document.getElementById('character');
    if (!char) return;

    const leftLeg = document.getElementById('leftLeg');
    const rightLeg = document.getElementById('rightLeg');
    const leftArm = document.getElementById('leftArm');
    const rightArm = document.getElementById('rightArm');
    const mouth = document.getElementById('mouth');
    const leftPupil = document.getElementById('leftPupil');
    const rightPupil = document.getElementById('rightPupil');
    const leftEye = document.getElementById('leftEye');
    const rightEye = document.getElementById('rightEye');
    const bubble = document.querySelector('.hi-bubble');
    const bodyGroup = document.getElementById('bodyGroup');

    const WALK_IN = 2800;
    const WAVE = 2600;
    const WALK_OUT = 3200;
    const TOTAL = WALK_IN + WAVE + WALK_OUT;

    const START_X = -120;
    const CENTRE = () => window.innerWidth / 2 - 40;
    const END_X = () => window.innerWidth + 120;

    let tick = 0;
    let cycleStart = performance.now();
    let mouthOpen = false;
    let blinkBusy = false;

    function ease(t) {
        return t < .5
            ? 2 * t * t
            : -1 + (4 - 2 * t) * t;
    }

    function rotate(el, a, x, y) {
        if (el)
            el.setAttribute(
                'transform',
                `rotate(${a} ${x} ${y})`
            );
    }

    function loop(now) {
        requestAnimationFrame(loop);
        tick++;

        const elapsed = (now - cycleStart) % TOTAL;
        let x = 0;
        let state = '';

        if (elapsed < WALK_IN) {
            state = 'walk';
            x = START_X + (CENTRE() - START_X) * ease(elapsed / WALK_IN);
        }
        else if (elapsed < WALK_IN + WAVE) {
            state = 'wave';
            x = CENTRE();
        }
        else {
            state = 'exit';
            x = CENTRE() + (END_X() - CENTRE()) * ease((elapsed - WALK_IN - WAVE) / WALK_OUT);
        }

        char.style.left = x + 'px';

        const swing = Math.sin(tick * .13) * 20;

        rotate(leftLeg, state === 'wave' ? 0 : swing, 34, 88);
        rotate(rightLeg, state === 'wave' ? 0 : -swing, 46, 88);

        rotate(leftArm, state === 'wave'
            ? -65 + Math.sin(tick * .18) * 32
            : swing, 24, 62);

        rotate(rightArm, state === 'wave' ? 0 : -swing, 56, 62);

        if (bodyGroup) {
            bodyGroup.setAttribute(
                'transform',
                `translate(0, ${state !== 'wave' ? Math.abs(Math.sin(tick * .13)) * -4 : 0})`
            );
        }

        /* TALK */
        if (state === 'wave') {
            mouthOpen = !mouthOpen;
            mouth.setAttribute(
                'd',
                mouthOpen
                    ? 'M33 49 Q40 59 47 49'
                    : 'M34 50 Q40 56 46 50'
            );
        } else {
            mouth.setAttribute('d', 'M35 51 Q40 54 45 51');
        }

        /* BLINK */
        if (tick % 170 === 0 && !blinkBusy) {
            blinkBusy = true;
            leftEye.setAttribute('ry', '.5');
            rightEye.setAttribute('ry', '.5');

            setTimeout(() => {
                leftEye.setAttribute('ry', '4.5');
                rightEye.setAttribute('ry', '4.5');
                blinkBusy = false;
            }, 120);
        }

        /* PUPILS */
        leftPupil.setAttribute('cx', state === 'wave' ? '31' : '34');
        rightPupil.setAttribute('cx', state === 'wave' ? '47' : '50');

        /* BUBBLE */
        if (bubble) {
            bubble.style.opacity = state === 'wave' ? '1' : '0';
        }
    }

    requestAnimationFrame(loop);
})();

// middle 

(function () {
    const wrap = document.getElementById('heroMiddle');
    const canvas = document.getElementById('heroMidCanvas');
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');

    /* labels */
    const labelEls = [
        document.querySelector('.hm-label-1'),
        document.querySelector('.hm-label-2'),
        document.querySelector('.hm-label-3'),
        document.querySelector('.hm-label-4'),
        document.querySelector('.hm-label-5'),
        document.querySelector('.hm-label-6'),
    ];
    const labelColors = [
        '#00D4FF', '#a78bfa', '#4ade80',
        '#38bdf8', '#fb923c', '#34d399'
    ];
    const labelBorders = [
        'rgba(0,212,255,0.5)', 'rgba(167,139,250,0.5)', 'rgba(74,222,128,0.45)',
        'rgba(56,189,248,0.45)', 'rgba(251,146,60,0.45)', 'rgba(52,211,153,0.45)'
    ];

    let W, H, cx, cy, R;
    function resize() {
        const rect = wrap.getBoundingClientRect();
        W = canvas.width = rect.width || 220;
        H = canvas.height = rect.height || 220;
        cx = W / 2; cy = H / 2;
        R = Math.min(W, H) * 0.40;
    }
    resize();
    window.addEventListener('resize', resize);

    /* orbiting nodes */
    const N = 6;
    const nodes = Array.from({ length: N }, (_, i) => ({
        angle: i * (Math.PI * 2 / N),
        speed: 0.004 + (i % 2 === 0 ? 0.001 : -0.001) * (i * 0.3),
        r: R * (0.88 + (i % 3) * 0.08),
        size: 6 + i % 3
    }));

    /* connection lines flash */
    let flashPair = [0, 1], flashAlpha = 0, flashDir = 1;

    /* inner ring particles */
    const ring = Array.from({ length: 28 }, (_, i) => ({
        angle: i * (Math.PI * 2 / 28),
        r: R * 0.45,
        pulse: i * (Math.PI * 2 / 28)
    }));

    /* data stream dots */
    const streams = Array.from({ length: 4 }, (_, i) => ({
        progress: i / 4,
        fromNode: i,
        toNode: (i + 2) % N,
        speed: 0.008
    }));

    let tick = 0;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        tick++;

        /* OUTER ORBIT RING */
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(108,99,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        /* INNER RING PULSES */
        ring.forEach(p => {
            const pulse = Math.sin(tick * 0.04 + p.pulse) * 0.5 + 0.5;
            const px = cx + Math.cos(p.angle) * p.r;
            const py = cy + Math.sin(p.angle) * p.r;
            ctx.beginPath();
            ctx.arc(px, py, 1.5 + pulse, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(108,99,255,${0.15 + pulse * 0.25})`;
            ctx.fill();
        });

        /* ORBIT RING DASHED */
        ctx.save();
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(108,99,255,0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        /* update nodes */
        nodes.forEach(n => { n.angle += n.speed; });

        /* FLASH connection */
        flashAlpha += flashDir * 0.015;
        if (flashAlpha >= 1) { flashAlpha = 1; flashDir = -1; flashPair = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; }
        if (flashAlpha <= 0) { flashAlpha = 0; flashDir = 1; }
        const [fa, fb] = flashPair;
        const nA = nodes[fa], nB = nodes[fb];
        const axA = cx + Math.cos(nA.angle) * nA.r, ayA = cy + Math.sin(nA.angle) * nA.r;
        const axB = cx + Math.cos(nB.angle) * nB.r, ayB = cy + Math.sin(nB.angle) * nB.r;
        ctx.beginPath();
        ctx.moveTo(axA, ayA); ctx.lineTo(axB, ayB);
        ctx.strokeStyle = `rgba(0,212,255,${flashAlpha * 0.45})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        /* DATA STREAM DOTS */
        streams.forEach(s => {
            s.progress = (s.progress + s.speed) % 1;
            const sn = nodes[s.fromNode], en = nodes[s.toNode];
            const sx = cx + Math.cos(sn.angle) * sn.r, sy = cy + Math.sin(sn.angle) * sn.r;
            const ex = cx + Math.cos(en.angle) * en.r, ey = cy + Math.sin(en.angle) * en.r;
            /* route via centre */
            const t = s.progress;
            const mx = cx + (Math.sin(tick * 0.01 + s.fromNode) * R * 0.15);
            const my = cy + (Math.cos(tick * 0.01 + s.fromNode) * R * 0.15);
            const bx = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * ex;
            const by = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * ey;
            ctx.beginPath();
            ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,212,255,${0.7 - t * 0.4})`;
            ctx.fill();
        });

        /* DRAW NODES + update labels */
        nodes.forEach((n, i) => {
            const nx = cx + Math.cos(n.angle) * n.r;
            const ny = cy + Math.sin(n.angle) * n.r;

            /* node glow */
            const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.size * 3);
            grd.addColorStop(0, `rgba(108,99,255,0.3)`);
            grd.addColorStop(1, 'rgba(108,99,255,0)');
            ctx.beginPath(); ctx.arc(nx, ny, n.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = grd; ctx.fill();

            /* line to centre */
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny);
            ctx.strokeStyle = 'rgba(108,99,255,0.1)'; ctx.lineWidth = 0.8; ctx.stroke();

            /* node circle */
            ctx.beginPath(); ctx.arc(nx, ny, n.size, 0, Math.PI * 2);
            ctx.fillStyle = '#6C63FF';
            ctx.fill();
            ctx.strokeStyle = 'rgba(167,139,250,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();

            /* inner dot */
            ctx.beginPath(); ctx.arc(nx, ny, n.size * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();

            /* position label */
            const el = labelEls[i];
            if (!el) return;
            const lx = nx + Math.cos(n.angle) * 28;
            const ly = ny + Math.sin(n.angle) * 20;
            const box = el.getBoundingClientRect();
            el.style.opacity = '1';
            el.style.left = (lx - (el.offsetWidth || 40) / 2) + 'px';
            el.style.top = (ly - (el.offsetHeight || 20) / 2) + 'px';
            el.style.color = labelColors[i];
            el.style.borderColor = labelBorders[i];
        });

        /* CENTRE CORE */
        const corePulse = Math.sin(tick * 0.05) * 0.5 + 0.5;

        /* core outer ring */
        ctx.beginPath(); ctx.arc(cx, cy, 22 + corePulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(108,99,255,${0.15 + corePulse * 0.15})`; ctx.lineWidth = 1; ctx.stroke();

        /* core glow */
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
        cg.addColorStop(0, `rgba(108,99,255,${0.45 + corePulse * 0.2})`);
        cg.addColorStop(0.6, 'rgba(108,99,255,0.12)');
        cg.addColorStop(1, 'rgba(108,99,255,0)');
        ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fillStyle = cg; ctx.fill();

        /* core circle */
        ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#0d0d1a';
        ctx.strokeStyle = 'rgba(108,99,255,0.7)'; ctx.lineWidth = 1.5;
        ctx.fill(); ctx.stroke();

        /* RK letters in core */
        ctx.font = 'bold 11px JetBrains Mono,monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(108,99,255,0.9)';
        ctx.fillText('RK', cx, cy);

        /* SPINNING ARC */
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tick * 0.03);
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 1.2);
        ctx.strokeStyle = 'rgba(0,212,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        requestAnimationFrame(draw);
    }
    draw();
})();
