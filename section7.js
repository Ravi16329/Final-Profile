
function initOrbitTimeline() {
    const stage = document.getElementById('orbitStage');
    const wrap = document.getElementById('orbitNodes');

    if (!stage || !wrap) {
        console.warn('[orbit] stage or wrap not found — check IDs orbitStage / orbitNodes exist in HTML');
        return;
    }

    const data = [
        { id: 1, icon: '📝', label: '10th CBSE', date: '2018', desc: 'Scored 420/500 in CBSE board exams, securing distinction.', score: 84, scoreLabel: '84%' },
        { id: 2, icon: '📘', label: 'Inter MPC', date: '2020', desc: 'Achieved 985/1000 in Intermediate, ranked top of college.', score: 98.5, scoreLabel: '98.5%' },
        { id: 3, icon: '🎯', label: 'EAMCET', date: '2022', desc: 'Secured a top-tier rank in EAMCET state entrance exam.', score: 97, scoreLabel: 'Top 3%' },
        { id: 4, icon: '📐', label: 'JEE Mains', date: '2022', desc: 'Scored 89 percentile in JEE Mains national exam.', score: 89, scoreLabel: '89%ile' },
        { id: 5, icon: '🎓', label: 'B.Tech CGPA', date: '2022-26', desc: 'Maintaining 9.3/10 CGPA in Computer Science Engineering.', score: 93, scoreLabel: '9.3 / 10' },
    ];

    wrap.innerHTML = '';

    const RADIUS = 175;
    let rotation = 0;
    let autoRotate = true;
    let activeId = null;

    const nodeEls = data.map(item => {
        const node = document.createElement('div');
        node.className = 'orbit-node';
        node.dataset.id = item.id;
        node.innerHTML =
            '<div class="orbit-node-dot">' + item.icon + '</div>' +
            '<div class="orbit-node-label">' + item.label + '</div>' +
            '<div class="orbit-node-card">' +
            '<div class="orbit-card-top">' +
            '<span class="orbit-card-badge">COMPLETE</span>' +
            '<span class="orbit-card-date">' + item.date + '</span>' +
            '</div>' +
            '<div class="orbit-card-title">' + item.label + '</div>' +
            '<div class="orbit-card-desc">' + item.desc + '</div>' +
            '<div class="orbit-card-score"><span>Score</span><span>' + item.scoreLabel + '</span></div>' +
            '<div class="orbit-card-bar"><div class="orbit-card-bar-fill" style="width:' + item.score + '%"></div></div>' +
            '</div>';
        wrap.appendChild(node);

        node.addEventListener('click', function (e) {
            e.stopPropagation();
            if (activeId === item.id) {
                activeId = null;
                autoRotate = true;
            } else {
                activeId = item.id;
                autoRotate = false;
            }
            updatePositions();
        });

        return node;
    });

    function updatePositions() {
        const total = data.length;
        nodeEls.forEach(function (node, i) {
            const angle = ((i / total) * 360 + rotation) % 360;
            const radian = (angle * Math.PI) / 180;
            const x = RADIUS * Math.cos(radian);
            const y = RADIUS * Math.sin(radian);
            const isActive = activeId === data[i].id;

            node.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
            node.style.zIndex = isActive ? 200 : Math.round(100 + 50 * Math.cos(radian));
            node.style.opacity = isActive ? 1 : Math.max(0.45, Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(radian)) / 2)));
            node.classList.toggle('is-active', isActive);
        });
    }

    function tick() {
        if (autoRotate) {
            rotation = (rotation + 0.25) % 360;
            updatePositions();
        }
        requestAnimationFrame(tick);
    }

    stage.addEventListener('click', function (e) {
        if (e.target === stage || e.target.classList.contains('orbit-track')) {
            activeId = null;
            autoRotate = true;
            updatePositions();
        }
    });

    updatePositions();
    requestAnimationFrame(tick);

    console.log('[orbit] initialized with', nodeEls.length, 'nodes');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrbitTimeline);
} else {
    initOrbitTimeline();
}