
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navOverlay = document.querySelector('.nav-overlay');
    if(menuToggle) {
        menuToggle.addEventListener('click', () => {
            navOverlay.classList.toggle('open');
            document.body.style.overflow = navOverlay.classList.contains('open') ? 'hidden' : 'auto';
        });
    }

    // Cursor Lerp (Disabled on Mobile)
    if(window.matchMedia("(hover: hover)").matches) {
        const cursor = document.createElement('div'); cursor.classList.add('q-cursor'); document.body.appendChild(cursor);
        let mouse = {x:-100, y:-100}, pos = {x:-100, y:-100};
        document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
        const update = () => { pos.x += (mouse.x - pos.x) * 0.15; pos.y += (mouse.y - pos.y) * 0.15; cursor.style.left = pos.x + 'px'; cursor.style.top = pos.y + 'px'; requestAnimationFrame(update); };
        update();
        document.querySelectorAll('a').forEach(a => { a.addEventListener('mouseenter', () => cursor.classList.add('active')); a.addEventListener('mouseleave', () => cursor.classList.remove('active')); });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal, .canvas-item').forEach(el => observer.observe(el));
});

