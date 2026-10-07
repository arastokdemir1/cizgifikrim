/* Çizgi v7 palet önizleyicisi. YALNIZ önizleme: sayfa başındaki kanca ?palet=… ya da yerel adres olmadıkça bu dosyayı yüklemez.
   Üretimde (cizgifikrim.net) yüklenmez; palet seçilince bu dosya, palet.css ve kanca satırı silinir.
   ?palet=l1|l2|l3|v6 → anında uygula + localStorage'da hatırla; ?palet=off → temizle; &sel=0 → seçiciyi gizle (ekran görüntüsü için). */
(function () {
  'use strict';
  var D = document, root = D.documentElement, KEY = 'cz-palet';
  var LIST = [['l1', 'L1', '#8E520D'], ['l2', 'L2', '#1F5A3C'], ['l3', 'L3', '#7A1F2B'], ['v6', 'v6', '#E3A24F']];
  var NAMES = { l1: 'L1: sıcak kum + grafit + amber/bakır', l2: 'L2: nötr ışık-gri + orman yeşili', l3: 'L3: sıcak taş + bordo', v6: 'v6: önceki koyu amber (karşılaştırma)' };
  function apply(v, persist) {
    root.setAttribute('data-palet', v);
    if (persist) { try { localStorage.setItem(KEY, v); } catch (e) {} }
    var bg = getComputedStyle(root).getPropertyValue('--k-bg').trim();
    var m = D.querySelector('meta[name="theme-color"]'); if (m && bg) m.setAttribute('content', bg);
    root.style.colorScheme = getComputedStyle(root).getPropertyValue('--k-scheme').trim() || 'light';
    if (window.czRecolor) window.czRecolor();
    try { window.dispatchEvent(new Event('cz-palet')); } catch (e) {}
    [].forEach.call(D.querySelectorAll('.cz-palet button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === v)); });
    if (root.classList.contains('cz-static') && persist) location.reload();
  }
  function get() { try { return root.getAttribute('data-palet') || localStorage.getItem(KEY) || 'l1'; } catch (e) { return 'l1'; } }
  function build() {
    if (/[?&]sel=0\b/.test(location.search)) { apply(get(), false); return; }
    var st = D.createElement('style');
    st.textContent = '.cz-palet{position:fixed;right:10px;bottom:10px;z-index:99999;display:flex;gap:4px;align-items:center;padding:5px;border:1px solid rgb(128 128 128 / .5);border-radius:10px;background:rgb(24 24 24 / .86);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font:600 11px/1 system-ui,sans-serif;color:#fff}' +
      '.cz-palet button{display:inline-flex;align-items:center;gap:4px;min-width:30px;min-height:30px;padding:0 7px;border:1px solid rgb(255 255 255 / .35);border-radius:7px;background:transparent;color:#fff;font:inherit;cursor:pointer}' +
      '.cz-palet button i{width:9px;height:9px;border-radius:50%;border:1px solid rgb(255 255 255 / .5)}.cz-palet button[aria-pressed="true"]{border-color:#fff;background:rgb(255 255 255 / .22)}' +
      '@media (max-width:780px){.cz-palet{bottom:78px}.cz-palet button{min-height:36px;min-width:36px}}';
    D.head.appendChild(st);
    var box = D.createElement('div'); box.className = 'cz-palet'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Palet önizleme (yalnız geliştirme)');
    LIST.forEach(function (it) {
      var b = D.createElement('button'); b.type = 'button'; b.dataset.p = it[0]; b.title = NAMES[it[0]]; b.setAttribute('aria-label', 'Palet ' + NAMES[it[0]]);
      b.innerHTML = '<i style="background:' + it[2] + '"></i>' + it[1];
      b.addEventListener('click', function () { apply(it[0], true); });
      box.appendChild(b);
    });
    D.body.appendChild(box);
    apply(get(), false);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', build); else build();
})();
