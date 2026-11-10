/* Vesira önce/sonra galerisi (Frontend-1): oda sekmeleri, seviye sekmeleri, çapraz geçiş kipi. Klavye: sekmelerde ←/→. Ağ isteği yok (yalnız sayfadaki görseller). */
(function () {
  'use strict';
  var kok = document.querySelector('[data-galeri]');
  if (!kok) return;
  var GECIS = { salon: 1, koridor: 1, mutfak: 1 };   // bu odalarda "baştan tasarım" kamera açısı farklı: kaydırıcı yerine çapraz geçiş
  var odaTab = kok.querySelectorAll('[data-oda-tab]'), paneller = kok.querySelectorAll('[data-oda]');
  function hepsi(l, f) { Array.prototype.forEach.call(l, f); }
  function seviye(panel, s) {
    var os = panel.querySelector('.os');
    hepsi(panel.querySelectorAll('[data-seviye-tab]'), function (b) { var on = b.getAttribute('data-seviye-tab') === s; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    var gelen = null;
    hepsi(os.querySelectorAll('.os__katman--sonra'), function (k) { if (k.getAttribute('data-seviye') === s) gelen = k; });
    hepsi(os.querySelectorAll('.os__katman--sonra'), function (k) { if (k !== gelen && !k.hidden) { k.classList.remove('is-gelen'); var eski = k; setTimeout(function () { if (eski !== os.__aktif) eski.hidden = true; }, 300); } });
    os.__aktif = gelen; gelen.hidden = false; gelen.classList.add('is-gelen');
    os.setAttribute('data-mod', GECIS[panel.getAttribute('data-oda')] && s === 'bastan-tasarim' ? 'gecis' : '');
    os.classList.remove('is-sonra');
    hepsi(os.querySelectorAll('[data-os-gecis]'), function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-os-gecis') === 'once')); });
    if (os.__ayarla) os.__ayarla(50);
  }
  function oda(a) {
    hepsi(odaTab, function (b) { var on = b.getAttribute('data-oda-tab') === a; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    hepsi(paneller, function (p) { p.hidden = p.getAttribute('data-oda') !== a; });
  }
  function oklar(liste, e) {
    var i = Array.prototype.indexOf.call(liste, document.activeElement);
    if (i < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    e.preventDefault(); var n = liste[(i + (e.key === 'ArrowRight' ? 1 : liste.length - 1)) % liste.length]; n.focus(); n.click();
  }
  hepsi(odaTab, function (b) { b.addEventListener('click', function () { oda(b.getAttribute('data-oda-tab')); }); });
  kok.querySelector('[data-oda-liste]').addEventListener('keydown', function (e) { oklar(odaTab, e); });
  hepsi(paneller, function (p) {
    var tabs = p.querySelectorAll('[data-seviye-tab]');
    hepsi(tabs, function (b) { b.addEventListener('click', function () { seviye(p, b.getAttribute('data-seviye-tab')); }); });
    p.querySelector('[data-seviye-liste]').addEventListener('keydown', function (e) { oklar(tabs, e); });
    var os = p.querySelector('.os'); os.__aktif = os.querySelector('.os__katman--sonra:not([hidden])');
  });
})();
