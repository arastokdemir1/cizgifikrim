// CizgiFikrim "Luxe": sakin üretken arka plan (kontur çizgileri) + sayaç animasyonu.
// Bağımlılık yok. prefers-reduced-motion açıksa tek kare çizer, sayaçlar bitmiş değeri gösterir.
// Ekran dışında ve sekme gizliyken durur; en çok 30 kare/sn; mobilde daha az çizgi, imleç etkisi yok.
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(pointer: fine)').matches;

  // ── sayaçlar ──────────────────────────────────────────────────────────────
  function runCounter(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(end)) return;
    var t0 = null, dur = 1400;
    function ease(x) { return 1 - Math.pow(1 - x, 4); }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      el.textContent = String(Math.round(end * ease(p)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCounter(e.target); o.unobserve(e.target); } });
    }, { threshold: .6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  // ── kontur çizgileri ──────────────────────────────────────────────────────
  var canvas = document.querySelector('canvas.lx-flow');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = 1, lines = 0, running = false, visible = true, last = 0;
  var mx = -9999, my = -9999, tx = -9999, ty = -9999;
  var INK = 'rgba(20,21,24,', ACC = 'rgba(29,92,90,';

  function size() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lines = W < 700 ? 22 : 34;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var gap = H / (lines + 1);
    var seg = W < 700 ? 56 : 72;
    for (var i = 1; i <= lines; i++) {
      var base = i * gap, accent = (i % 11 === 0);
      ctx.beginPath();
      for (var s = 0; s <= seg; s++) {
        var x = (s / seg) * W;
        var nx = x / W;
        var y = base
          + Math.sin(nx * 5.2 + i * .21 + t * .00018) * gap * .9
          + Math.sin(nx * 2.1 - i * .13 + t * .00011) * gap * 1.7;
        if (fine) {
          var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
          if (d2 < 36000) y += (dy === 0 ? 1 : dy / Math.sqrt(d2 + 1)) * (1 - d2 / 36000) * 14;
        }
        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = (accent ? ACC + '.38)' : INK + (.045 + .035 * Math.sin(i * .7)) + ')');
      ctx.lineWidth = accent ? 1.1 : 1;
      ctx.stroke();
    }
  }

  function frame(ts) {
    if (!running) return;
    if (ts - last > 33) {
      last = ts;
      mx += (tx - mx) * .12; my += (ty - my) * .12;
      draw(ts);
    }
    requestAnimationFrame(frame);
  }
  function start() { if (running || reduce || !visible || document.hidden) return; running = true; requestAnimationFrame(frame); }
  function stop() { running = false; }

  size();
  draw(1800);
  if (reduce) return;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
  } else { start(); }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(last || 1800); }, 150); });
  if (fine) {
    canvas.parentElement.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; if (mx < -9000) { mx = tx; my = ty; }
    });
    canvas.parentElement.addEventListener('pointerleave', function () { tx = -9999; ty = -9999; mx = -9999; my = -9999; });
  }
  start();
})();
