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

    items.forEach((item, i) => {
        const pos = positions[i] || { x: 400, y: 400 };
        item.style.left = pos.x + 'px';
        item.style.top = pos.y + 'px';

        const rot = rotations[i] || 0;
        item.style.transform = `rotate(${rot}deg)`;

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

    console.log('Tech cloud initialized:', items.length, 'items positioned');
}

/* Run on load AND immediately, in case DOM is already ready */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTechCloud);
} else {
    initTechCloud();
}