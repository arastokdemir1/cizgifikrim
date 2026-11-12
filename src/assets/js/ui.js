/* ui.js (X07 İnce; sahip: Frontend-1, tasarım sistemi). Çerçeve/kütüphane yok. Hepsi isteğe bağlı iyileştirme: JS yoksa menü tam sayfa URL'lerine gider.
   Yapar: (1) üst menü: mobil panel ("Menü · <aktif sayfa>"), (2) "/" üzerinde bölüme ANINDA kayma + kaydırmayla aktif sekme (data-bolum),
   (3) şema etiketleri ekranda ≥11 px (--sc-k). ANİMASYON YOK: reveal, sayaç, sahne ve sayfa geçişi kaldırıldı; otomatik geçiş yok. */
(() => {
  'use strict';
  const d = document;
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const header = d.getElementById('site-header');

  if (header) {
    const btn = $$('.menu-toggle', header)[0], panel = d.getElementById('menu-panel');
    let etiket = btn ? btn.dataset.etiket || 'Ana sayfa' : '';
    const yaz = () => { if (btn) btn.textContent = panel && !panel.hidden ? 'Kapat' : 'Menü · ' + etiket; };
    const ac = (open) => { if (!btn || !panel) return; btn.setAttribute('aria-expanded', String(open)); panel.hidden = !open; yaz(); };
    if (btn && panel) {
      btn.addEventListener('click', (e) => { e.stopPropagation(); ac(panel.hidden); });
      d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { ac(false); btn.focus(); } });
      d.addEventListener('click', (e) => { if (!panel.hidden && !header.contains(e.target)) ac(false); });
      panel.addEventListener('click', (e) => { if (e.target.closest('a')) ac(false); });
      matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) ac(false); });
    }

    /* "/" üzerinde: bölüme anında kayma + aktif sekme kaydırmayla. Başka sayfalarda bağlantılar olduğu gibi çalışır. */
    if (header.dataset.ana === '1') {
      const baglar = $$('[data-bolum]', header);
      const hedef = (b) => (b === 'anasayfa' ? null : d.getElementById(b));
      const mevcut = (b) => b === 'anasayfa' || !!hedef(b);
      const sirali = ['anasayfa', ...new Set(baglar.map((a) => a.dataset.bolum).filter((b) => b !== 'anasayfa'))].filter(mevcut);
      const aktifYap = (b) => {
        baglar.forEach((a) => {
          if (a.dataset.bolum === b) a.setAttribute('aria-current', 'page');
          else if (mevcut(a.dataset.bolum)) a.removeAttribute('aria-current');
        });
        const a = baglar.find((x) => x.dataset.bolum === b && x.closest('.menu-panel'));
        if (a) { etiket = a.textContent.trim(); yaz(); }
      };
      const ust = () => parseFloat(getComputedStyle(d.documentElement).getPropertyValue('--header-h')) || 64;
      const git = (b) => {
        const el = hedef(b);
        const y = el ? Math.max(0, el.getBoundingClientRect().top + scrollY - ust() - 8) : 0;
        scrollTo({ top: y, behavior: 'auto' });
        try { history.replaceState(null, '', b === 'anasayfa' ? location.pathname : '#' + b); } catch (e) { /* sandbox */ }
        aktifYap(b);
      };
      baglar.forEach((a) => a.addEventListener('click', (e) => {
        const b = a.dataset.bolum;
        if (!mevcut(b) || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
        e.preventDefault(); git(b);
      }));
      let kare = 0;
      const olc = () => {
        kare = 0;
        const probe = ust() + innerHeight * 0.3;
        let cur = sirali[0];
        sirali.forEach((b) => { const el = hedef(b); if (el && el.getBoundingClientRect().top <= probe) cur = b; });
        if (innerHeight + scrollY >= d.documentElement.scrollHeight - 2) cur = sirali[sirali.length - 1];
        aktifYap(cur);
      };
      const iste = () => { if (!kare) kare = requestAnimationFrame(olc); };
      addEventListener('scroll', iste, { passive: true });
      addEventListener('resize', iste);
      olc();
    }
  }

  /* ── Şema etiketleri ekranda ≥11 px: --sc-k = viewBox genişliği ÷ ekran genişliği (schema.css) ── */
  if ('ResizeObserver' in window) {
    const olc = (svg) => {
      const w = svg.getBoundingClientRect().width; if (!w) return;
      const vb = svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width; if (!vb) return;
      const k = vb / w; svg.style.setProperty('--sc-k', k.toFixed(3)); svg.classList.toggle('sc-dar', k > 1.3);
    };
    const ro = new ResizeObserver((es) => es.forEach((e) => olc(e.target)));
    $$('svg.schema').forEach((s) => { ro.observe(s); olc(s); });
  }
})();
