function initTechCloud() {
    const cloud = document.getElementById('techCloud');
    if (!cloud) {
        console.warn('techCloud element not found — check that #s9 HTML was pasted correctly');
        return;
    }

    const items = Array.from(cloud.querySelectorAll('.tech-item'));
    if (items.length === 0) {
        console.warn('No .tech-item elements found inside #techCloud');
        return;
    }

    const positions = [
        { x: -100, y: 10 }, { x: 250, y: 30 }, { x: 480, y: 0 }, { x: 710, y: 35 }, { x: 930, y: -20 },
        { x: 130, y: 150 }, { x: 360, y: 175 }, { x: 590, y: 145 }, { x: 820, y: 175 },
        { x: 20, y: 295 }, { x: 250, y: 315 }, { x: 480, y: 290 }, { x: 710, y: 320 }, { x: 930, y: 395 },
        { x: 130, y: 435 }, { x: 360, y: 440 }, { x: 590, y: 435 }, { x: 820, y: 440 },
    ];

    const rotations = [-4, 3, -2, 4, -3, 2, -5, 3, -2, -3, 4, -4, 2, -3, -2, 3, -4, 2];

    /* ── DIRECTION ASSIGNMENT ──
       Each card falls in from a different side: up, down, left, right.
       Cycles through the 4 directions across the 18 cards. */
    const directions = ['top', 'bottom', 'left', 'right'];

    function getStartTransform(dir, rot) {
        switch (dir) {
            case 'top': return `translateY(-160px) scale(0.5) rotate(${rot}deg)`;
            case 'bottom': return `translateY(160px) scale(0.5) rotate(${rot}deg)`;
            case 'left': return `translateX(-200px) scale(0.5) rotate(${rot}deg)`;
            case 'right': return `translateX(200px) scale(0.5) rotate(${rot}deg)`;
            default: return `translateY(40px) scale(0.6) rotate(${rot}deg)`;
        }
    }

    items.forEach((item, i) => {
        const pos = positions[i] || { x: 400, y: 400 };
        const rot = rotations[i] || 0;
        const dir = directions[i % directions.length];

        /* place at FINAL resting x/y immediately (layout unaffected),
           but start invisible and offset off-screen in its assigned direction */
        item.style.left = pos.x + 'px';
        item.style.top = pos.y + 'px';
        item.style.opacity = '0';
        item.style.transition = 'none';
        item.style.transform = getStartTransform(dir, rot);
        item.dataset.entranceDir = dir; /* stash for the animate pass below */

        /* hover behavior (unchanged) */
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-6px) scale(1.1) rotate(0deg)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.transform = `rotate(${rot}deg)`;
        });

        if (!item.querySelector('.tech-pie')) {
            const pct = item.dataset.pct || '50';
            item.style.setProperty('--pct', pct);

            const pie = document.createElement('div');
            pie.className = 'tech-pie';
            pie.innerHTML = `
                <div class="tech-pie-circle"></div>
                <div class="tech-pie-label">${pct}%</div>
            `;
            item.appendChild(pie);
        }
    });

    /* force reflow so the off-screen starting state actually paints */
    void cloud.offsetWidth;

    items.forEach((item, i) => {
        const rot = rotations[i] || 0;
        setTimeout(() => {
            item.style.transition = 'opacity 0.65s ease, transform 0.65s cubic-bezier(0.34,1.56,0.64,1), border-color .25s, box-shadow .25s';
            item.style.opacity = '1';
            item.style.transform = `translate(0,0) scale(1) rotate(${rot}deg)`;
        }, i * 80); /* 80ms stagger between each card */
    });

    console.log('Tech cloud initialized:', items.length, 'items with multi-direction entrance');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTechCloud);
} else {
    initTechCloud();
}

/* replay every time #s9 becomes visible via your slide navigator */
(function () {
    const target = document.getElementById('s9');
    if (!target) return;
    const mo = new MutationObserver(() => {
        if (target.style.display === 'block') {
            initTechCloud();
        }
    });
    mo.observe(target, { attributes: true, attributeFilter: ['style'] });
})();