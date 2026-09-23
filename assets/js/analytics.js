// CizgiFikrim — birinci taraf ziyaretçi analitiği.
// Üçüncü taraf reklam/analitik servisi YOK; veri yalnızca kendi Supabase
// projemize gider, kimseyle paylaşılmaz. Çerez kullanmaz (localStorage/
// sessionStorage). Ziyaretçi kimliği rastgele bir dizedir, ada/e-postaya
// hiç bağlanmaz. "Do Not Track" / "Global Privacy Control" açıksa hiçbir
// şey kaydedilmez. Ayrıntı: /tr/gizlilik.html
(() => {
  'use strict';
  try {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  } catch (_) { /* eski tarayıcı — devam et */ }

  const REST = `${(typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) || 'https://iekdktdhhryqewvcrnmr.supabase.co'}/rest/v1`;
  const KEY = (typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY)
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlla2RrdGRoaHJ5cWV3dmNybm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTA4NjIsImV4cCI6MjA5OTg4Njg2Mn0.1R70BzCmDdXbTpVGGk19y9ThY9n7dDJ7SMcJWc5Uhl4';

  const rid = () => {
    try { return crypto.randomUUID().replace(/-/g, ''); } catch (_) { return `${Date.now()}${Math.random()}`.replace(/\D/g, '').slice(0, 24); }
  };
  const store = (get, set) => { try { return get(); } catch (_) { try { return set(); } catch (__) { return null; } } };
  const visitorId = store(
    () => localStorage.getItem('cf_vid') || (() => { const v = rid(); localStorage.setItem('cf_vid', v); return v; })(),
    () => rid(),
  );
  const sessionId = store(
    () => sessionStorage.getItem('cf_sid') || (() => { const v = rid(); sessionStorage.setItem('cf_sid', v); return v; })(),
    () => rid(),
  );
  if (!visitorId || !sessionId) return;

  const page = () => (location.pathname.replace(/^\/+/, '/') + location.search).slice(0, 200);
  const referrer = () => {
    if (!document.referrer) return null;
    try {
      const r = new URL(document.referrer);
      // Kendi sitemizden gelen geçişlerde referrer'ı boş bırakıyoruz;
      // yalnızca dış kaynak (arama, sosyal, başka site) ilginç.
      return r.origin === location.origin ? null : document.referrer.slice(0, 300);
    } catch (_) { return document.referrer.slice(0, 300); }
  };
  const viewport = () => (matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop');

  const send = (table, body, useBeacon) => {
    const url = `${REST}/${table}`;
    const payload = JSON.stringify(body);
    if (useBeacon && navigator.sendBeacon) {
      // sendBeacon özel başlık taşıyamaz; apikey'i sorgu dizesine ekliyoruz
      // (anon key zaten herkese açık, tarayıcıda gömülü — bkz. supabase-client.js).
      const ok = navigator.sendBeacon(`${url}?apikey=${KEY}`, new Blob([payload], { type: 'application/json' }));
      if (ok) return;
    }
    fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'return=minimal' },
      body: payload,
    }).catch(() => {});
  };

  // ── Sayfa görüntüleme + süre ────────────────────────────────────────────
  // Tek satır: sayfadan ayrılınca (sekme gizlenince/kapanınca) o ana kadar
  // geçen süreyle birlikte gönderilir. Böylece "hangi sayfada ne kadar
  // kaldı" tek kayıtta netleşir; ara güncelleme/UPDATE izni gerekmez.
  const start = Date.now();
  const currentPage = page();
  const currentReferrer = referrer();
  const currentViewport = viewport();
  let sent = false;
  const finish = () => {
    if (sent) return;
    sent = true;
    const duration = Math.min(14400, Math.max(0, Math.round((Date.now() - start) / 1000)));
    send('site_visits', {
      visitor_id: visitorId, session_id: sessionId, page: currentPage,
      referrer: currentReferrer, duration_seconds: duration, viewport: currentViewport,
    }, true);
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') finish(); });
  addEventListener('pagehide', finish);

  // ── Tıklamalar ──────────────────────────────────────────────────────────
  // Yalnızca bağlantı ve düğmeler; form alanlarına ya da serbest metne hiç
  // dokunulmaz (mesaj içeriği bu şekilde asla yakalanmaz).
  const labelOf = (el) => {
    const explicit = el.getAttribute('data-track');
    if (explicit) return explicit.slice(0, 120);
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) return text.slice(0, 80);
    const href = el.getAttribute('href');
    if (href) return `link:${href.slice(0, 100)}`;
    return el.tagName.toLowerCase();
  };
  document.addEventListener('click', (event) => {
    const el = event.target.closest('a, button');
    if (!el || el.closest('[data-no-track]')) return;
    send('site_clicks', { visitor_id: visitorId, session_id: sessionId, page: currentPage, label: labelOf(el) }, false);
  }, { capture: true });
})();
