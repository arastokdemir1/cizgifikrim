// CizgiFikrim: "Projeyi anlat" formu arayüzü. lead-config.js + lead-client.js'ten sonra yüklenir.
// Uç nokta kapalıyken (CIZGI_LEAD.enabled=false) hiçbir şey yapmaz: sayfadaki e-posta/takvim yedeği görünür kalır, form gizli kalır.
(function () {
  'use strict';
  var root = document.querySelector('[data-lead]');
  var L = window.CizgiLead;
  if (!root || !L || !L.enabled()) return;
  var form = root.querySelector('[data-lead-form]'), fallback = root.querySelector('[data-lead-fallback]'), done = root.querySelector('[data-lead-done]');
  var summary = root.querySelector('[data-lead-summary]'), status = root.querySelector('[data-lead-status]'), btn = root.querySelector('[data-lead-submit]');
  if (!form) return;
  var sec = root.closest('[data-lead-section]'); if (sec) sec.hidden = false;
  if (fallback) fallback.hidden = true;
  form.hidden = false;

  var busy = false, started = false;
  var f = function (n) { return form.elements[n]; };
  var FIELDS = {
    name: { label: 'Ad soyad', check: function (v) { return v.length >= 2 && v.length <= 120 ? '' : 'Adınızı yazın.'; } },
    email: { label: 'E-posta', check: function (v) { return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Geçerli bir e-posta adresi yazın.'; } },
    phone: { label: 'Telefon', check: function (v) { return !v || /^[0-9 +()\-]{7,30}$/.test(v) ? '' : 'Telefonu rakam, boşluk, + ve - ile yazın ya da boş bırakın.'; } },
    message: { label: 'Mesaj', check: function (v) { return v.length >= 10 && v.length <= 2000 ? '' : 'Mesajınızı birkaç cümleyle yazın (en az 10 karakter).'; } }
  };

  // Jeton: form görünür olunca ya da ilk odakta bir kez alınır (sunucu en az 3 sn doldurma süresi ister; istemci gerekirse bekler).
  function open() { if (started) return; started = true; L.opened(); }
  form.addEventListener('focusin', open);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { open(); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(form);
  }

  function errEl(name) { return form.querySelector('[data-err="' + name + '"]'); }
  function setErr(name, msg) {
    var el = f(name), e = errEl(name); if (!el || !e) return;
    e.textContent = msg || ''; e.hidden = !msg;
    if (msg) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', e.id); } else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  }
  function clearSummary() { summary.hidden = true; summary.innerHTML = ''; }
  function validate() {
    var bad = [];
    Object.keys(FIELDS).forEach(function (n) { var v = (f(n).value || '').trim(), m = FIELDS[n].check(v); setErr(n, m); if (m) bad.push(n); });
    var c = f('consent'), ce = errEl('consent');
    var cm = c.checked ? '' : 'Devam etmek için onay kutusunu işaretleyin.';
    ce.textContent = cm; ce.hidden = !cm;
    if (cm) { c.setAttribute('aria-invalid', 'true'); c.setAttribute('aria-describedby', ce.id); bad.push('consent'); } else { c.removeAttribute('aria-invalid'); c.removeAttribute('aria-describedby'); }
    if (bad.length) {
      summary.innerHTML = '<strong>Gönderilemedi: ' + bad.length + ' alanı düzeltin.</strong> ' + bad.map(function (n) { return '<a href="#lead-' + n + '">' + (FIELDS[n] ? FIELDS[n].label : 'Onay') + '</a>'; }).join(', ');
      summary.hidden = false;
      f(bad[0]).focus();
      return false;
    }
    clearSummary();
    return true;
  }
  ['name', 'email', 'phone', 'message'].forEach(function (n) { f(n).addEventListener('input', function () { if (errEl(n) && !errEl(n).hidden) setErr(n, FIELDS[n].check((f(n).value || '').trim())); }); });

  function alt() { return (root.getAttribute('data-lead-cal') || 'randevu.html'); }
  function fail(r) {
    var code = r && r.error, msg;
    if (code === 'invalid_input') msg = 'Gönderilemedi: bilgilerden biri kabul edilmedi. Alanları kontrol edip tekrar deneyin.';
    else if (code === 'rate_limited' || code === 'busy') msg = 'Kısa sürede çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.';
    else msg = 'Şu an gönderemedik; mesajınız kaydedilmedi.';
    summary.innerHTML = '<strong>' + msg + '</strong> Şunları kullanabilirsiniz: <span class="cz-lead-links"><a href="mailto:cizgifikrimnet@gmail.com">E-posta ile yazın</a><a href="' + alt() + '">Takvimden görüşme seçin</a></span>';
    summary.hidden = false; summary.focus();
  }
  function success() {
    form.reset(); started = false;
    form.hidden = true; done.hidden = false; done.focus();
  }
  function busyState(on) {
    busy = on; btn.setAttribute('aria-disabled', on ? 'true' : 'false'); btn.classList.toggle('is-busy', on);
    btn.firstChild.nodeValue = on ? 'Gönderiliyor… ' : 'Gönder ';
    status.textContent = on ? 'Gönderiliyor…' : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    if (!validate()) return;
    busyState(true);
    var fields = { name: f('name').value.trim(), email: f('email').value.trim(), message: f('message').value.trim(), consent: true, website: f('website').value };
    var ph = f('phone').value.trim(); if (ph) fields.phone = ph;
    L.submit(fields).then(function (r) {
      busyState(false);
      if (r.ok) success(); else fail(r);
    });
  });
})();
