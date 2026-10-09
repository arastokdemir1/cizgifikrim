// CizgiFikrim: talep formu istemcisi (submit-lead edge function sözleşmesi).
// Taslak kaynağı: ekip/backend-guvenlik assets/js/lead-client.js. Fark: uç nokta ve anahtar `lead-config.js`ten gelir
// (Supabase kütüphanesi yüklemeden her sayfada çalışır) ve sahte uç noktaya yönlendirilebilir.
//
// Sözleşme (supabase/functions/submit-lead/handler.ts):
//   GET  → { ok, token }                       form açılınca bir kez; jeton IP'ye bağlı, en az MIN_FILL_SECONDS (3 sn) sonra geçerli, ≤ 2 saat
//   POST → { kind, name, email, phone?, message?, consent: true, consent_version, website (honeypot, boş), form_token, source_page, utm? }
//          → 200 { ok: true, ref }  |  400 token_* | 422 invalid_input | 429 too_fast | rate_limited | busy | 5xx
// Dışa açılan: window.CizgiLead = { enabled(), opened(), submit(fields), minWaitMs() }
(function () {
  'use strict';
  var MIN_WAIT_MS = 3600;                 // sunucu 3 sn ister; saat farkı payı ile
  var tokenPromise = null, tokenAt = 0;

  function cfg() { return window.CIZGI_LEAD || {}; }
  function endpoint() { return cfg().endpoint || ''; }
  function enabled() { return !!(cfg().enabled && endpoint()); }
  function headers(json) {
    var h = {}, c = cfg();
    if (json) h['Content-Type'] = 'application/json';
    if (c.apikey) { h.apikey = c.apikey; h.Authorization = 'Bearer ' + c.apikey; }
    return h;
  }

  function opened() {
    if (!enabled()) return Promise.resolve(null);
    tokenAt = 0;
    tokenPromise = fetch(endpoint(), { headers: headers(false), cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (json) { var t = (json && json.token) || null; if (t) tokenAt = performance.now(); return t; })
      .catch(function () { return null; });
    return tokenPromise;
  }
  function minWaitMs() { return tokenAt ? Math.max(0, MIN_WAIT_MS - (performance.now() - tokenAt)) : MIN_WAIT_MS; }

  function utmParams() {
    var utm = {};
    try {
      var p = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (p.get(k)) utm[k] = p.get(k).slice(0, 100); });
    } catch (e) { /* eski tarayıcı */ }
    return utm;
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function postOnce(fields) {
    return (tokenPromise || opened()).then(function (token) {
      if (!token) return { ok: false, error: 'token_unavailable' };
      return sleep(minWaitMs()).then(function () {   // sunucu en az 3 sn doldurma süresi ister: kullanıcı hızlı yollarsa sessizce bekleriz
        var utm = utmParams(), c = cfg(), body = {};
        body.kind = c.kind || 'contact';
        body.source_page = location.pathname.slice(0, 200);
        if (Object.keys(utm).length) body.utm = utm;
        Object.keys(fields).forEach(function (k) { body[k] = fields[k]; });
        body.consent_version = c.consentVersion;
        body.form_token = token;
        return fetch(endpoint(), { method: 'POST', headers: headers(true), body: JSON.stringify(body) })
          .then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (json) {
              if (res.status === 400 && json.error && String(json.error).indexOf('token') === 0) tokenPromise = null;   // jeton yenilenmeli
              return { ok: res.ok && json.ok === true, error: json.error || null, status: res.status };
            });
          })
          .catch(function () { return { ok: false, error: 'network' }; });
      });
    });
  }

  // fields: { name, email, phone?, message, consent: true, website }. kind/consent_version/source_page/utm/form_token eklenir.
  // too_fast ve jeton hataları için bir kez otomatik yeniden dener.
  function submit(fields) {
    if (!enabled()) return Promise.resolve({ ok: false, error: 'disabled' });
    return postOnce(fields).then(function (r) {
      if (r.ok || !r.error) return r;
      if (r.error === 'too_fast') return sleep(1500).then(function () { return postOnce(fields); });
      if (String(r.error).indexOf('token') === 0) { tokenPromise = null; return opened().then(function () { return postOnce(fields); }); }
      return r;
    });
  }

  window.CizgiLead = { enabled: enabled, opened: opened, submit: submit, minWaitMs: minWaitMs };
})();
