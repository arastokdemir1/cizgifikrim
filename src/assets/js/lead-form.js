/* Görüşme formu (Frontend-1): submit-lead sözleşmesi, bkz. faz1/form_sozlesmesi.md (Backend-2).
   - GET jeton (form görününce/ilk odakta) → POST; yanıtta yalnız ok===true başarıdır; `ref` okunmaz/gösterilmez/kullanılmaz.
   - Her başarısız yanıttan sonra yeni form_token; too_fast ve token_* için bir kez otomatik yeniden deneme.
   - Önizleme/yerel (cizgifikrim.net dışı) ve ?lead=mock: MOCK modu, hiçbir ağ isteği yapılmaz (pages.dev CORS listesinde yok, canlıya yazılmaz).
   - TURNSTILE_MODE=off: site anahtarı boş → widget çizilmez, turnstile_token gönderilmez.
   - apikey: yalnız eski JWT anon anahtarı (sb_publishable_ bu function'a konamaz). consent_version /gizlilik/ "8. Proje talebi formu: rıza metni" sürümüyle birebir. */
(function () {
  'use strict';
  var root = document.querySelector('[data-lead]');
  if (!root) return;
  var CFG = {
    endpoint: 'https://iekdktdhhryqewvcrnmr.supabase.co/functions/v1/submit-lead',
    apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlla2RrdGRoaHJ5cWV3dmNybm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTA4NjIsImV4cCI6MjA5OTg4Njg2Mn0.1R70BzCmDdXbTpVGGk19y9ThY9n7dDJ7SMcJWc5Uhl4',
    consentVersion: 'gizlilik-2026-11',
    turnstileSiteKey: '',                       // TURNSTILE_MODE=off
    eposta: 'cizgifikrimnet@gmail.com', calUrl: 'https://cal.com/cizgifikrim',
    tesekkur: '/gorusme/tesekkurler/', minWaitMs: 3600
  };
  var PROD = { 'cizgifikrim.net': 1, 'www.cizgifikrim.net': 1 };
  var mock = !PROD[location.hostname] || /[?&]lead=mock\b/.test(location.search);
  var SLUGS = ['web-sitesi-ve-e-ticaret', 'mobil-uygulama', 'yapay-zeka-ve-otomasyon', 'carlog', 'vesira', 'polishreel'];
  var KONU_ESLE = { carlog: 'mobil-uygulama', vesira: 'yapay-zeka-ve-otomasyon', polishreel: 'web-sitesi-ve-e-ticaret' };   // ?konu= proje ise Konu seçimi ilgili hizmete ön dolar
  var SLUG_RE = /^[a-z0-9._-]{1,80}$/;
  var LINK_RE = /https?:\/\/|www\./gi;

  // Hata tablosu (tek yer). Her hatada e-posta ve Cal.com yedeği görünür kalır.
  var ERR = {
    captcha_failed: 'Doğrulama tamamlanamadı, lütfen yeniden deneyin.',
    captcha_unavailable: 'Doğrulama servisine ulaşılamadı, birazdan tekrar deneyin.',
    invalid_input: 'Bilgilerden biri kabul edilmedi. Alanları kontrol edip tekrar deneyin.',
    too_large: 'Mesajınız çok uzun.',
    rate_limited: 'Kısa sürede çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.',
    busy: 'Şu an yoğunuz. Birazdan tekrar deneyin ya da e-posta/takvim kullanın.',
    server_error: 'Şu an gönderemedik; mesajınız kaydedilmedi.',
    unavailable: 'Şu an gönderemedik; mesajınız kaydedilmedi.',
    network: 'Şu an gönderemedik; mesajınız kaydedilmedi.',
    _genel: 'Gönderilemedi. Lütfen biraz sonra tekrar deneyin ya da e-posta ile yazın.'
  };

  var form = root.querySelector('[data-lead-form]'), summary = root.querySelector('[data-lead-summary]'), status = root.querySelector('[data-lead-status]');
  var btn = root.querySelector('[data-lead-submit]'), mockEl = root.querySelector('[data-lead-mock]');
  if (!form) return;
  if (mock && mockEl) mockEl.hidden = false;
  var f = function (n) { return form.elements[n]; };
  var busy = false, opened = false, tokenPromise = null, tokenAt = 0;

  // ── ?konu= ve kind/service_slug ──────────────────────────────────────────
  var slug = null;
  (function () {
    try {
      var q = new URLSearchParams(location.search).get('konu');
      if (q && SLUG_RE.test(q) && SLUGS.indexOf(q) > -1) { slug = q; f('konu').value = KONU_ESLE[q] || q; }
    } catch (e) { /* eski tarayıcı */ }
  })();
  f('konu').addEventListener('change', function () { var v = f('konu').value; slug = v === 'diger' ? null : v; });

  // ── Doğrulama ────────────────────────────────────────────────────────────
  var FIELDS = {
    name: { label: 'Ad soyad', check: function (v) { if (LINK_RE.test(v)) { LINK_RE.lastIndex = 0; return 'Ad alanına bağlantı yazmayın.'; } LINK_RE.lastIndex = 0; return v.length >= 2 && v.length <= 120 ? '' : 'Adınızı yazın.'; } },
    email: { label: 'E-posta', check: function (v) { return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Geçerli bir e-posta adresi yazın.'; } },
    message: { label: 'Mesaj', check: function (v) { var n = (v.match(LINK_RE) || []).length; LINK_RE.lastIndex = 0; if (n > 2) return 'Mesajda en fazla 2 bağlantı bırakın; fazlasını e-postayla paylaşabilirsiniz.'; return v.length >= 10 && v.length <= 2000 ? '' : 'Mesajınızı birkaç cümleyle yazın (en az 10 karakter).'; } }
  };
  function errEl(n) { return form.querySelector('[data-err="' + n + '"]'); }
  function setErr(n, msg) {
    var el = f(n), e = errEl(n); if (!el || !e) return;
    e.textContent = msg || ''; e.hidden = !msg;
    if (msg) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', e.id); } else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  }
  function yedekHtml() { return '<span class="gr-ozet__yedek"><a href="mailto:' + CFG.eposta + '">E-posta ile yazın</a><a href="' + CFG.calUrl + '" target="_blank" rel="noopener noreferrer">Takvimden görüşme seçin</a></span>'; }
  function validate() {
    var bad = [];
    Object.keys(FIELDS).forEach(function (n) { var m = FIELDS[n].check((f(n).value || '').trim()); setErr(n, m); if (m) bad.push(n); });
    var c = f('consent'), ce = errEl('consent'), cm = c.checked ? '' : 'Devam etmek için onay kutusunu işaretleyin.';
    ce.textContent = cm; ce.hidden = !cm;
    if (cm) { c.setAttribute('aria-invalid', 'true'); c.setAttribute('aria-describedby', ce.id); bad.push('consent'); } else { c.removeAttribute('aria-invalid'); c.removeAttribute('aria-describedby'); }
    if (bad.length) {
      summary.innerHTML = '<strong>Gönderilemedi: ' + bad.length + ' alanı düzeltin.</strong> ' + bad.map(function (n) { return '<a href="#lead-' + n + '">' + (FIELDS[n] ? FIELDS[n].label : 'Onay') + '</a>'; }).join(', ');
      summary.hidden = false; f(bad[0]).focus(); return false;
    }
    summary.hidden = true; summary.innerHTML = ''; return true;
  }
  Object.keys(FIELDS).forEach(function (n) { f(n).addEventListener('input', function () { var e = errEl(n); if (e && !e.hidden) setErr(n, FIELDS[n].check((f(n).value || '').trim())); }); });

  // ── Ağ: jeton ve gönderim (mock'ta ağ yok) ───────────────────────────────
  function headers(json) { var h = {}; if (json) h['Content-Type'] = 'application/json'; h.apikey = CFG.apikey; h.Authorization = 'Bearer ' + CFG.apikey; return h; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function jetonAl() {
    tokenAt = 0;
    tokenPromise = mock ? sleep(50).then(function () { return 'mock'; }) :
      fetch(CFG.endpoint, { headers: headers(false), cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return (j && j.token) || null; }).catch(function () { return null; });
    tokenPromise.then(function (t) { if (t) tokenAt = performance.now(); });
    return tokenPromise;
  }
  function acildi() { if (opened) return; opened = true; jetonAl(); }
  form.addEventListener('focusin', acildi);
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { acildi(); io.disconnect(); } }, { rootMargin: '200px' }); io.observe(form); }
  function beklemeMs() { return mock ? 0 : (tokenAt ? Math.max(0, CFG.minWaitMs - (performance.now() - tokenAt)) : CFG.minWaitMs); }
  function utm() { var u = {}; try { var p = new URLSearchParams(location.search); ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (p.get(k)) u[k] = p.get(k).slice(0, 100); }); } catch (e) { /* yok */ } return u; }

  function mockCevap(body) {   // sahte uç nokta: test e-postalarıyla hata durumları denenebilir
    var m = String(body.email || '').toLowerCase(), d = 600;
    if (m === 'slow@example.test') d = 4000;
    return sleep(d).then(function () {
      var tablo = { 'fail@example.test': [500, 'server_error'], 'busy@example.test': [429, 'busy'], 'rate@example.test': [429, 'rate_limited'], 'captcha@example.test': [400, 'captcha_failed'], 'large@example.test': [413, 'too_large'], 'invalid@example.test': [422, 'invalid_input'], 'unavailable@example.test': [503, 'unavailable'] };
      if (tablo[m]) return { ok: false, status: tablo[m][0], error: tablo[m][1] };
      return { ok: true, status: 200 };
    });
  }
  function postOnce(fields) {
    return (tokenPromise || jetonAl()).then(function (token) {
      if (!token) return { ok: false, error: 'network' };
      return sleep(beklemeMs()).then(function () {
        var body = {}, u = utm();
        body.kind = slug ? 'quote' : 'contact';
        if (slug) body.service_slug = slug;
        body.source_page = location.pathname.slice(0, 200);
        if (Object.keys(u).length) body.utm = u;
        Object.keys(fields).forEach(function (k) { body[k] = fields[k]; });
        body.consent_version = CFG.consentVersion; body.form_token = token;
        if (CFG.turnstileSiteKey && window.__turnstileToken) body.turnstile_token = window.__turnstileToken;
        if (mock) return mockCevap(body);
        return fetch(CFG.endpoint, { method: 'POST', headers: headers(true), body: JSON.stringify(body) })
          .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok && j.ok === true, status: res.status, error: j.error || null }; }); })
          .catch(function () { return { ok: false, error: 'network' }; });
      });
    });
  }
  function gonder(fields) {
    return postOnce(fields).then(function (r) {
      if (r.ok) return r;
      var kod = String(r.error || '');
      if (r.status === 429 && kod === 'too_fast') return sleep(1500).then(function () { jetonAl(); return postOnce(fields); });
      if (kod.indexOf('token') === 0) return jetonAl().then(function () { return postOnce(fields); });
      return r;
    }).then(function (r) { if (!r.ok) jetonAl(); return r; });   // her başarısız yanıttan sonra yeni jeton (Turnstile açıksa reset de burada)
  }

  function fail(r) {
    var kod = r && r.error, msg = ERR[kod] || (r && r.status >= 500 ? ERR.server_error : ERR._genel);
    summary.innerHTML = '<strong>' + msg + '</strong> Şunları kullanabilirsiniz:' + yedekHtml();
    summary.hidden = false; summary.focus();
  }
  function durumAyarla(on) {
    busy = on; btn.setAttribute('aria-disabled', on ? 'true' : 'false'); btn.setAttribute('aria-busy', on ? 'true' : 'false');
    status.textContent = on ? 'Gönderiliyor…' : '';
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy || !validate()) return;
    durumAyarla(true);
    var fields = { name: f('name').value.trim(), email: f('email').value.trim(), message: f('message').value.trim(), consent: true, website: f('website').value };
    gonder(fields).then(function (r) {
      durumAyarla(false);
      if (r.ok) { form.reset(); location.assign(CFG.tesekkur); } else fail(r);   // yalnız ok===true başarıdır; ref kullanılmaz
    });
  });
})();
