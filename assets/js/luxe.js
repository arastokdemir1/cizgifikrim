// CizgiFikrim "Luxe v2": kaydırmaya bağlı sahneler (hero nesnesi, yapışkan süreç sahnesi), sayaçlar, mobil sabit CTA.
// Bağımlılık yok. prefers-reduced-motion açıkken sahneler statik açık hâlde kalır, sayaçlar son değeri gösterir.
// Kaydırma: tek pasif dinleyici + rAF; yalnız görünür sahneler güncellenir; yalnız transform/opaklık/CSS değişkeni yazılır.
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var smooth = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  // ── sayaçlar (render.js veriyi yazdıktan sonra window.initCounters() çağırır) ──
  function runCounter(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(end)) return;
    if (reduce) { el.textContent = String(end); return; }
    var t0 = null, dur = 1400;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  window.initCounters = function () {
    var list = document.querySelectorAll('[data-count]:not([data-count-bound])');
    list.forEach(function (el) {
      el.setAttribute('data-count-bound', '1');
      if (reduce || !('IntersectionObserver' in window)) { runCounter(el); return; }
      new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { runCounter(el); o.disconnect(); } }, { threshold: .6 }).observe(el);
    });
  };
  window.initCounters();

  // ── kaydırma sahneleri ──
  var hero = document.querySelector('[data-hero]');
  var scene = document.querySelector('[data-scene]');
  var fig = hero && hero.querySelector('.lx-fig');
  var figCount = hero && hero.querySelector('[data-fig-count]');
  var steps = scene ? [].slice.call(scene.querySelectorAll('.lx-steps li')) : [];
  var cards = scene ? [].slice.call(scene.querySelectorAll('.lx-stepcard')) : [];
  var sceneCount = scene && scene.querySelector('[data-scene-count]');
  var vh = window.innerHeight, dirty = true, lastStage = -1, lastStep = -1, lastDark = null;

  function progress(el) {
    var r = el.getBoundingClientRect();
    var total = r.height - vh;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  }
  function visible(el) { var r = el.getBoundingClientRect(); return r.bottom > -vh * .2 && r.top < vh * 1.2; }

  function update() {
    dirty = false;
    if (hero && fig && visible(hero)) {
      var p = progress(hero);
      var sep = smooth(p / .8);                 // katmanlar ilk %80'de ayrılır
      fig.style.setProperty('--sep', sep.toFixed(3));
      var stage = p < .08 ? 0 : p < .38 ? 1 : p < .7 ? 2 : 3;
      if (stage !== lastStage) {
        lastStage = stage; fig.setAttribute('data-stage', String(stage));
        if (figCount) figCount.textContent = '0' + stage + ' / 03';
      }
    }
    if (scene && steps.length && visible(scene)) {
      var q = progress(scene);
      var idx = clamp(Math.floor((q - .06) / .22), 0, steps.length - 1);
      if (idx !== lastStep) {
        lastStep = idx;
        steps.forEach(function (li, i) { li.classList.toggle('is-active', i === idx); });
        cards.forEach(function (c, i) { c.style.setProperty('--d', String(i - idx)); c.style.setProperty('--a', String(Math.abs(i - idx))); });
        if (sceneCount) sceneCount.textContent = '0' + (idx + 1) + ' / 0' + steps.length;
      }
      var bgp = smooth((q - .08) / .2);          // arka plan: açık → koyu
      scene.style.setProperty('--bgp', bgp.toFixed(3));
      var dark = bgp > .5;
      if (dark !== lastDark) { lastDark = dark; scene.classList.toggle('is-dark', dark); }
    }
  }
  function onScroll() { if (!dirty) { dirty = true; requestAnimationFrame(update); } }
  if (!reduce && (hero || scene)) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); });
    update();
  } else if (scene) {
    scene.classList.add('is-dark');
    steps.forEach(function (li) { li.classList.add('is-active'); });
  }

  // ── mobil sabit CTA ──
  var bar = document.querySelector('.lx-sticky');
  if (bar && 'IntersectionObserver' in window) {
    var after = document.querySelector(bar.getAttribute('data-sticky-after'));
    var until = document.querySelector(bar.getAttribute('data-sticky-until')) || document.querySelector('footer');
    var past = false, atEnd = false;
    var apply = function () { bar.classList.toggle('on', past && !atEnd); };
    document.body.classList.add('has-sticky');
    if (after) new IntersectionObserver(function (e) { var r = e[0]; past = !r.isIntersecting && r.boundingClientRect.top < 0; apply(); }).observe(after);
    if (until) new IntersectionObserver(function (e) { atEnd = e[0].isIntersecting; apply(); }).observe(until);
  }
})();
