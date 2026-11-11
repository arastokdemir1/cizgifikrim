/* Cal.com takvimi (Frontend-1): yalnız "Takvimi aç" tıklanınca yüklenir (sayfa açılışında Cal isteği yok).
   Yüklenene dek sabit yükseklikli kutu + statik iskelet; yavaşsa/başarısızsa Cal.com bağlantısı görünür. Süre bilgisi yazılmaz. */
(function () {
  'use strict';
  var kok = document.querySelector('[data-cal]');
  if (!kok) return;
  var sahne = kok.querySelector('[data-cal-sahne]'), durum = kok.querySelector('[data-cal-durum]');
  var ac = kok.querySelector('[data-cal-ac]'), yedek = kok.querySelector('[data-cal-yedek]');
  var basladi = false;
  var CAL_LINK = 'cizgifikrim';                      // Cal.com profil sayfası (görüntülü/telefon seçenekleri Cal'ın kendisinde)

  function renk(ad, yedekDeger) { var v = getComputedStyle(document.documentElement).getPropertyValue(ad).trim(); return v || yedekDeger; }
  function calYukle() {
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); }, d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal, ar = arguments;
        if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); }, ns = ar[1]; api.q = api.q || [];
          if (typeof ns === 'string') { cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ['initNamespace', ns]); } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');
  }
  function baslat() {
    if (basladi) return; basladi = true;
    ac.hidden = true; durum.textContent = 'Takvim yükleniyor…';
    calYukle();
    var bitti = false, t0 = performance.now();
    function bitir() { if (bitti) return; bitti = true; sahne.classList.add('is-yuklu'); clearInterval(tick); }
    var tick = setInterval(function () {
      var s = (performance.now() - t0) / 1000;
      if (s >= 45) { durum.textContent = 'Takvim yüklenemedi. Cal.com bağlantısını kullanabilirsiniz.'; yedek.hidden = false; clearInterval(tick); ac.hidden = false; ac.textContent = 'Yeniden dene'; basladi = false; }
      else if (s >= 8) { durum.textContent = 'Takvim beklenenden yavaş yükleniyor. İsterseniz Cal.com\'da açın.'; yedek.hidden = false; }
    }, 1000);
    var mo = new MutationObserver(function () { var f = sahne.querySelector('iframe'); if (f && !f.__w) { f.__w = true; f.addEventListener('load', bitir); setTimeout(bitir, 6000); } });
    mo.observe(sahne, { childList: true, subtree: true });
    var ns = 'gorusme';
    Cal('init', ns, { origin: 'https://cal.com' });
    Cal.ns[ns]('on', { action: 'linkReady', callback: bitir });
    Cal.ns[ns]('inline', { elementOrSelector: sahne, calLink: CAL_LINK, layout: 'month_view', config: { theme: 'light', layout: 'month_view' } });
    Cal.ns[ns]('ui', { theme: 'light', hideEventTypeDetails: false, layout: 'month_view', cssVarsPerTheme: { light: { 'cal-brand': renk('--c-ink-2', '#000'), 'cal-brand-text': renk('--c-second', '#fff') }, dark: { 'cal-brand': renk('--c-ink-2', '#000'), 'cal-brand-text': renk('--c-second', '#fff') } } });
  }
  ac.addEventListener('click', baslat);
})();
