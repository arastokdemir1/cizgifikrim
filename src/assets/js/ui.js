/* ui.js: site arayüz davranışı (sahip: Frontend-2). Çerçeve/kütüphane yok. Hepsi isteğe bağlı iyileştirme: JS yoksa içerik görünür kalır.
   Yapar: reveal (data-reveal), üst menü (küçülme + mobil panel), sayaç (data-count), sahne ilerlemesi (data-scene), hero ışığı duraklatma. */
(() => {
  'use strict';
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const hasIO = 'IntersectionObserver' in window;

  /* ── Reveal: yalnız ekran altındaki öğeler gizlenir, görününce açılır (bir kez) ── */
  if (hasIO && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.remove('rv-wait'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach((el) => {
      if (el.getBoundingClientRect().top > innerHeight * 0.92) { el.classList.add('rv-wait'); io.observe(el); }
    });
  }

  /* ── Üst menü ── */
  const header = d.getElementById('site-header');
  if (header) {
    const sentinel = d.getElementById('top-sentinel');
    if (hasIO && sentinel) new IntersectionObserver((es) => header.classList.toggle('is-scrolled', !es[0].isIntersecting)).observe(sentinel);
    const btn = $$('.menu-toggle', header)[0], panel = d.getElementById('menu-panel');
    if (btn && panel) {
      const set = (open) => { btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç'); panel.hidden = !open; };
      btn.addEventListener('click', () => set(panel.hidden));
      d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
      d.addEventListener('click', (e) => { if (!panel.hidden && !header.contains(e.target)) set(false); });
      panel.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
      matchMedia('(min-width: 900px)').addEventListener('change', (m) => { if (m.matches) set(false); });
    }
  }

  /* ── Sayaç: sayı HTML'de metin olarak durur; animasyon yalnız görseldir ── */
  const count = (el) => {
    const to = parseFloat(el.dataset.count); if (!isFinite(to)) return;
    const t0 = performance.now(), dur = 900;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  };
  if (hasIO && !reduce) {
    const co = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { count(e.target); co.unobserve(e.target); } }), { threshold: 0.6 });
    $$('[data-count]').forEach((el) => co.observe(el));
  }

  /* ── Sahneler: data-scene="pin" (sabitlenmiş, bölüm yüksekliği boyunca) ya da "view" (görünüm boyunca). --p (0–1) ve data-step (1..data-steps) yazılır ── */
  const scenes = $$('[data-scene]');
  if (scenes.length && hasIO && !reduce) {
    const live = new Set(); let tick = false;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const update = () => {
      tick = false;
      live.forEach((el) => {
        const r = el.getBoundingClientRect(), vh = innerHeight;
        const p = el.dataset.scene === 'pin' ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((vh - r.top) / (vh + r.height));
        el.style.setProperty('--p', p.toFixed(4));
        const n = parseInt(el.dataset.steps, 10);
        if (n) { const s = Math.min(n, Math.floor(p * n * 0.999) + 1); if (el.dataset.step !== String(s)) { el.dataset.step = String(s); el.style.setProperty('--st', s); } }
        el.dataset.end = p > 0.94 ? '1' : '0';
      });
    };
    const req = () => { if (!tick) { tick = true; requestAnimationFrame(update); } };
    const so = new IntersectionObserver((es) => es.forEach((e) => { e.isIntersecting ? live.add(e.target) : live.delete(e.target); req(); }), { rootMargin: '25% 0px' });
    scenes.forEach((el) => { so.observe(el); if (el.dataset.steps) { el.dataset.step = '1'; el.style.setProperty('--st', 1); } });
    addEventListener('scroll', req, { passive: true }); addEventListener('resize', req);
    update();
  }

  /* ── Sonsuz animasyonlar görünmezken durur ── */
  if (hasIO) $$('[data-pause-offscreen]').forEach((el) => new IntersectionObserver((es) => el.classList.toggle('is-paused', !es[0].isIntersecting)).observe(el));
})();
