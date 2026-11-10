/* Önceki-sonraki kaydırıcı (Frontend-1): fare/dokunma sürükleme + klavye (←/→ %5, Home/End), ilk görünümde bir kez ipucu sallanması (reduced-motion'da yok).
   Çapraz geçiş kipinde ([data-mod="gecis"]) "Önce/Sonra" düğmeleri. Veri toplamaz, ağ isteği yapmaz. */
(function () {
  'use strict';
  var hepsi = document.querySelectorAll('.os');
  if (!hepsi.length) return;
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(hepsi, function (os) {
    var tut = os.querySelector('.os__tutamac');
    function ayarla(v) {
      v = Math.max(0, Math.min(100, v));
      os.style.setProperty('--p', v);
      if (tut) tut.setAttribute('aria-valuenow', Math.round(v));
    }
    os.__ayarla = ayarla;
    if (tut && !os.classList.contains('os--statik')) {
      var surukle = false;
      var konum = function (e) { var r = os.getBoundingClientRect(); ayarla((e.clientX - r.left) / r.width * 100); };
      os.addEventListener('pointerdown', function (e) {
        if (os.getAttribute('data-mod') === 'gecis' || (e.target.closest && e.target.closest('.os__gecis'))) return;
        surukle = true; try { os.setPointerCapture(e.pointerId); } catch (_) {} konum(e);
      });
      os.addEventListener('pointermove', function (e) { if (surukle) konum(e); });
      os.addEventListener('pointerup', function () { surukle = false; });
      os.addEventListener('pointercancel', function () { surukle = false; });
      tut.addEventListener('keydown', function (e) {
        var v = +tut.getAttribute('aria-valuenow');
        var yeni = { ArrowLeft: v - 5, ArrowRight: v + 5, Home: 0, End: 100 }[e.key];
        if (yeni !== undefined) { e.preventDefault(); ayarla(yeni); }
      });
      if (!rm && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return;
          io.disconnect();
          var t0 = performance.now();
          (function kare(t) { var k = Math.min(1, (t - t0) / 600); ayarla(50 + Math.sin(k * Math.PI * 2) * 7); if (k < 1) requestAnimationFrame(kare); else ayarla(50); })(t0);
        }, { threshold: 0.6 });
        io.observe(os);
      }
    }
    var dugmeler = os.querySelectorAll('[data-os-gecis]');
    Array.prototype.forEach.call(dugmeler, function (b) {
      b.addEventListener('click', function () {
        os.classList.toggle('is-sonra', b.getAttribute('data-os-gecis') === 'sonra');
        Array.prototype.forEach.call(dugmeler, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
  });
})();
