const SECTION_LABELS = ['Hero', 'About Me', 'Skills', 'Projects', 'Case Study', 'Experience', 'Education', 'Achievements', 'Tech Stack', 'Coding Profiles', 'Resume', 'Contact', 'Footer'];
const sections = document.querySelectorAll('.section');
const dotsWrap = document.getElementById('navDots');
const dotLabel = document.getElementById('dotLabel');
const total = sections.length;
let current = 0;
let isAnimating = false;
let autoTimer;

const CONTACT_INDEX = 11; // Section 12 = index 11 — no auto-advance here


document.body.style.perspective = '1200px';

// Build dots
sections.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', SECTION_LABELS[i]);
    d.addEventListener('click', () => goToSection(i));
    d.addEventListener('mouseenter', () => showLabel(i, d));
    d.addEventListener('mouseleave', () => { dotLabel.style.opacity = '0'; });
    dotsWrap.appendChild(d);
});

function showLabel(i, el) {
    const r = el.getBoundingClientRect();
    dotLabel.textContent = SECTION_LABELS[i];
    dotLabel.style.top = (r.top + r.height / 2) + 'px';
    dotLabel.style.opacity = '1';
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function goToSection(index, instant = false) {
    if ((isAnimating && !instant) || index < 0 || index >= total) return;
    isAnimating = true;
    const dir = index > current ? 1 : -1;

    sections.forEach((sec, i) => {
        if (i === index) {
            sec.style.display = 'block';
            sec.style.zIndex = 10;
            gsap.fromTo(sec,
                { rotationX: dir > 0 ? -90 : 90, opacity: 0, y: dir > 0 ? -80 : 80 },
                {
                    duration: instant ? 0 : 0.85, rotationX: 0, opacity: 1, y: 0, ease: 'power3.out',
                    onComplete: () => { isAnimating = false; }
                }
            );
        } else if (i === current && !instant) {
            gsap.to(sec, {
                duration: 0.4, opacity: 0, y: dir > 0 ? 60 : -60, ease: 'power2.in',
                onComplete: () => { sec.style.display = 'none'; sec.style.zIndex = 0; }
            });
        } else {
            sec.style.display = 'none';
            sec.style.zIndex = 0;
            sec.style.opacity = 0;
        }
    });

    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === index));
    document.getElementById('curNum').textContent = pad(index + 1);
    current = index;
    //resetAuto();
}

function next() { if (current < total - 1) goToSection(current + 1); }
function prev() { if (current > 0) goToSection(current - 1); }

document.getElementById('nextBtn').addEventListener('click', next);
document.getElementById('prevBtn').addEventListener('click', prev);

document.addEventListener('keydown', e => {
    if (['ArrowDown', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
    if (['ArrowUp'].includes(e.key)) { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
});

let lastWheel = 0;
window.addEventListener('wheel', e => {
    const now = Date.now();
    if (now - lastWheel < 800) return;
    lastWheel = now;
    if (e.deltaY > 0) next(); else prev();
}, { passive: true });

let touchY = 0;
window.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchend', e => {
    const diff = touchY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 40) { if (diff > 0) next(); else prev(); }
}, { passive: true });

function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
        // ✅ Skip auto-advance if currently on Contact section (index 11)
        if (current === CONTACT_INDEX) return;

        if (current < total - 1) next(); else goToSection(0);
    }, 15000);
}

goToSection(0, true);
//resetAuto();
