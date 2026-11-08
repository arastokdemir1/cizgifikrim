/* Demo çerçevesi betiği (Frontend-1). Masaüstü (>=1024 px, saveData kapalı, yavaş ağ değil): %50 görününce yükler; mobil/tablet/saveData/yavaş ağ: yalnız düğmeyle, mobilde tam ekran <dialog> (Kapat, Esc, geri, odak, kaydırma kilidi). Veri toplamaz; istek yalnız data-src adresine gider. Betik yoksa poster ve 'Tam ekranda aç' bağlantısı kalır. */
(function () {
  'use strict';
  var els = document.querySelectorAll('.demo-cerceve');
  if (!els.length) return;
  var mq = window.matchMedia ? matchMedia('(min-width:1024px)') : { matches: false };
  var c = navigator.connection || {};
  var yavas = !!c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || '');
  var dlgOk = typeof HTMLDialogElement === 'function';
  var acik = null, pushed = false;

  function iframe(root) {
    var f = document.createElement('iframe');
    f.className = 'demo-iframe';
    f.title = root.getAttribute('data-baslik') || 'Demo';
    f.setAttribute('sandbox', 'allow-scripts');
    f.setAttribute('referrerpolicy', 'no-referrer');
    f.setAttribute('allow', '');
    f.src = root.getAttribute('data-src');
    return f;
  }
  function yerinde(root) {
    if (root.__yuk) return; root.__yuk = true;
    var ekran = root.querySelector('.demo-ekran'); if (!ekran) return;
    ekran.setAttribute('data-durum', 'yukleniyor');
    var f = iframe(root);
    f.addEventListener('load', function () { ekran.setAttribute('data-durum', 'hazir'); });
    ekran.appendChild(f);
  }
  function katman(root, btn) {
    var dlg = document.createElement('dialog');
    dlg.className = 'demo-katman';
    dlg.setAttribute('aria-label', root.getAttribute('data-baslik') || 'Demo');
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'demo-kapat'; x.textContent = 'Kapat';
    dlg.appendChild(x); dlg.appendChild(iframe(root));
    document.body.appendChild(dlg);
    document.documentElement.classList.add('demo-kilit');
    dlg.showModal(); x.focus();
    try { history.pushState({ demo: 1 }, ''); pushed = true; } catch (e) { pushed = false; }
    acik = { dlg: dlg, btn: btn };
    function kapat() {
      if (!acik) return; var a = acik; acik = null;
      document.documentElement.classList.remove('demo-kilit');
      try { a.dlg.close(); } catch (e) {}
      a.dlg.remove();
      if (a.btn) a.btn.focus();
      if (pushed) { pushed = false; history.back(); }
    }
    x.addEventListener('click', kapat);
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); kapat(); });
    dlg.__kapat = kapat;
  }
  window.addEventListener('popstate', function () {
    if (acik) { pushed = false; acik.dlg.__kapat(); }
  });

  Array.prototype.forEach.call(els, function (root) {
    var btn = root.querySelector('.demo-ac');
    var masaustu = mq.matches && !yavas;
    if (btn) btn.addEventListener('click', function () {
      if (!mq.matches && dlgOk) katman(root, btn); else yerinde(root);
    });
    if (!masaustu || root.getAttribute('data-yukle') === 'tikla' || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return;
      io.disconnect();
      (window.requestIdleCallback || function (fn) { setTimeout(fn, 200); })(function () { yerinde(root); });
    }, { threshold: 0.5 });
    io.observe(root);
  });
})();
