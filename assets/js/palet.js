/* Çizgi v4 palet önizleyicisi. YALNIZ önizleme: sayfa başındaki kanca ?palet=… ya da yerel adres olmadıkça bu dosyayı yüklemez.
   Üretimde (cizgifikrim.net) yüklenmez; palet seçilince bu dosya, palet.css ve kanca satırı silinir.
   ?palet=a..e | v3 → anında uygula + localStorage'da hatırla; ?palet=off → temizle; &sel=0 → seçiciyi gizle (ekran görüntüsü için). */
(function () {
  'use strict';
  var D = document, root = D.documentElement, KEY = 'cz-palet';
  var LIST = [['v3', 'v3', '#B9D27C'], ['a', 'a', '#E3A24F'], ['b', 'b', '#F0562B'], ['c', 'c', '#1F5A3C'], ['d', 'd', '#F38C80'], ['e', 'e', '#B9A8F2']];
  var NAMES = { v3: 'v3 mevcut: limon-yeşil', a: 'a: grafit + amber', b: 'b: kömür + kemik + kırmızı-turuncu', c: 'c: açık, kâğıt + orman yeşili', d: 'd: koyu + mercan', e: 'e: koyu + lavanta' };
  function get() { try { return root.getAttribute('data-palet') || localStorage.getItem(KEY) || 'v3'; } catch (e) { return 'v3'; } }
  function apply(v, persist) {
    root.setAttribute('data-palet', v);
    if (persist) { try { localStorage.setItem(KEY, v); } catch (e) {} }
    var bg = getComputedStyle(root).getPropertyValue('--k-bg').trim();
    var m = D.querySelector('meta[name="theme-color"]'); if (m && bg) m.setAttribute('content', bg);
    if (window.czRecolor) window.czRecolor();
    try { window.dispatchEvent(new Event('cz-palet')); } catch (e) {}
    [].forEach.call(D.querySelectorAll('.cz-palet button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === v)); });
    if (root.classList.contains('cz-simple') && persist) location.reload();   // sabit çizim modunda tuval yeniden kurulur
  }
  function build() {
    if (/[?&]sel=0\b/.test(location.search)) return;
    var st = D.createElement('style');
    st.textContent = '.cz-palet{position:fixed;right:10px;bottom:10px;z-index:99999;display:flex;gap:4px;align-items:center;padding:5px;border:1px solid var(--k-hair2);border-radius:10px;background:rgb(var(--k-bg-rgb) / .92);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font:600 11px/1 var(--k-sans)}' +
      '.cz-palet button{display:inline-flex;align-items:center;gap:4px;min-width:30px;min-height:30px;padding:0 7px;border:1px solid var(--k-hair2);border-radius:7px;background:transparent;color:var(--k-text);font:inherit;cursor:pointer}' +
      '.cz-palet button i{width:9px;height:9px;border-radius:50%}.cz-palet button[aria-pressed="true"]{border-color:var(--k-text);background:rgb(var(--k-fg-rgb) / .12)}' +
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
