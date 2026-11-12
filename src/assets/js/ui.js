/* ui.js (X07 İnce; sahip: Frontend-1, tasarım sistemi). Çerçeve/kütüphane yok. Hepsi isteğe bağlı iyileştirme: JS yoksa menü bağlantıları tam sayfa URL'lerine gider.
   Yapar: (1) mobil menü paneli ("Menü · <aktif sayfa>"; etiket sunucuda yazılır), (2) şema etiketleri ekranda ≥11 px (--sc-k).
   Site çok sayfalı: kaydırmaya bağlı aktif sekme, #bölüm/hash kaydırma, reveal, sayaç, sahne ve otomatik geçiş YOK; aktif sekmeyi sunucu (aria-current) belirler. */
(() => {
  'use strict';
  const d = document;
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const header = d.getElementById('site-header');

  if (header) {
    const btn = $$('.menu-toggle', header)[0], panel = d.getElementById('menu-panel');
    if (btn && panel) {
      const etiket = btn.dataset.etiket || '';
      const yaz = () => { btn.textContent = !panel.hidden ? 'Kapat' : 'Menü' + (etiket ? ' · ' + etiket : ''); };
      const ac = (open) => { btn.setAttribute('aria-expanded', String(open)); panel.hidden = !open; yaz(); };
      btn.addEventListener('click', (e) => { e.stopPropagation(); ac(panel.hidden); });
      d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { ac(false); btn.focus(); } });
      d.addEventListener('click', (e) => { if (!panel.hidden && !header.contains(e.target)) ac(false); });
      matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) ac(false); });
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
