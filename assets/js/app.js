
document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.createElement('div'); cursor.classList.add('q-cursor'); document.body.appendChild(cursor);
    let mouse = { x: -100, y: -100 }, pos = { x: -100, y: -100 }, speed = 0.15;
    document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    const updateCursor = () => { pos.x += (mouse.x - pos.x) * speed; pos.y += (mouse.y - pos.y) * speed; cursor.style.left = pos.x + 'px'; cursor.style.top = pos.y + 'px'; requestAnimationFrame(updateCursor); };
    updateCursor();
    document.querySelectorAll('a').forEach(link => { link.addEventListener('mouseenter', () => cursor.classList.add('active')); link.addEventListener('mouseleave', () => cursor.classList.remove('active')); });
    const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.1 });
    document.querySelectorAll('.reveal, .canvas-item').forEach(el => observer.observe(el));
});
