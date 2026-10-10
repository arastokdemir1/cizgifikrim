// Projeler sayfası: katalog ürün kartları (render.js ile aynı veri kaynağı) ve yapışkan başlık ilerleme rayı.
// Kart gövdesi tek yerde (productCard). Supabase gelene kadar son yayınlanan katalog (STATIC_PROJECTS) gösterilir; "Canlı" yalnız veriden gelir.
(function () {
  'use strict';
  var BLOCK_OF = { 'mobil': 'mobil-web', 'otonom-ai': 'yapay-zeka', 'finansal': 'veri-otomotiv', 'otomotiv': 'veri-otomotiv' };
  var DEMOS = { carlog: ['../demo/carlog/', 'CarLog web demosu'], piyasa: ['../demo/piyasa/', 'PiyasApp web demosu'] };
  var blocks = [].slice.call(document.querySelectorAll('[data-pj-block]'));
  var chips = [].slice.call(document.querySelectorAll('[data-pj-jump]'));
  var statusEl = document.querySelector('[data-pj-status]');
  var firstPaint = true;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function slugOf(p) { return /^[a-z0-9._-]+$/i.test(String(p.slug || '')) ? String(p.slug) : ''; }

  function productCard(p) {
    var slug = slugOf(p); if (!slug) return '';
    var badge = typeof statusBadgeHTML === 'function' ? statusBadgeHTML(p.status, p.status_label) : '<span class="status-badge">' + esc(p.status_label || 'Geliştiriliyor') + '</span>';
    var demo = DEMOS[slug];
    var desc = String(p.description || '').split('\n\n')[0];
    return '<li class="pj-card" data-kind="urun">' +
      '<div class="pj-top"><span class="pj-kind">Ürün</span>' + badge + '</div>' +
      '<h3 class="pj-name">' + esc(p.display_name) + '</h3>' +
      (p.tagline ? '<p class="pj-sub">' + esc(p.tagline) + '</p>' : '') +
      '<p class="pj-text">' + esc(desc) + '</p>' +
      '<div class="pj-foot"><a class="pj-go pj-go--main" href="' + esc(p.href || 'projects/' + slug + '.html') + '">Sayfayı gör<span class="pj-sr"> · ' + esc(p.display_name) + '</span> <span aria-hidden="true">→</span></a>' +
      (demo ? '<a class="pj-go" href="' + demo[0] + '">Demoyu aç<span class="pj-sr"> · ' + esc(demo[1]) + '</span> <span aria-hidden="true">→</span></a>' : '') + '</div></li>';
  }

  function renderProducts(list) {
    var per = {};
    (list || []).forEach(function (p) { var b = BLOCK_OF[p.category]; if (b && slugOf(p)) (per[b] = per[b] || []).push(p); });
    blocks.forEach(function (b) {
      var ul = b.querySelector('[data-pj-list]');
      ul.querySelectorAll('[data-kind="urun"]').forEach(function (n) { n.remove(); });
      var items = (per[b.id] || []).map(productCard).join('');
      ul.insertAdjacentHTML('beforeend', items);
      var n = b.querySelector('[data-pj-n]'); if (n) n.textContent = ul.children.length + ' öğe';
    });
    update();
  }

  // ---- ilerleme rayı + etkin kategori ----
  var ticking = false;
  function offsetTop() { return innerWidth > 860 ? 104 : 72; }
  function update() {
    ticking = false;
    var top0 = offsetTop(), active = null;
    blocks.forEach(function (b) {
      var r = b.getBoundingClientRect(), side = b.querySelector('.pj-side');
      var span = Math.max(1, r.height - (innerWidth > 860 ? side.offsetHeight : 0) - 24);
      var p = Math.min(1, Math.max(0, (top0 - r.top) / span));
      b.style.setProperty('--p', p.toFixed(3));
      if (r.top <= top0 + 80 && r.bottom > top0 + 80) active = b.id;
    });
    chips.forEach(function (c) { if (c.dataset.pjJump === active) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  // ---- veri ----
  var fallback = (typeof STATIC_PROJECTS !== 'undefined' ? STATIC_PROJECTS : []).filter(function (p) { return BLOCK_OF[p.category]; });
  renderProducts(fallback);
  if (typeof fetchAllProjects === 'function') {
    Promise.resolve(fetchAllProjects()).then(function (live) {
      if (live && live.length) { renderProducts(live); if (statusEl) statusEl.hidden = true; }
      else if (statusEl) { statusEl.textContent = live ? 'Katalogda şu anda yayınlanmış ürün kaydı yok; son yayınlanan katalog gösteriliyor.' : 'Katalogun güncel verisi alınamadı; son yayınlanan katalog gösteriliyor.'; statusEl.hidden = false; }
    }).catch(function () { if (statusEl) { statusEl.textContent = 'Katalogun güncel verisi alınamadı; son yayınlanan katalog gösteriliyor.'; statusEl.hidden = false; } });
  }
  update();
})();
