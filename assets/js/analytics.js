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

  const send = (method, path, body) => fetch(`${REST}/${path}`, {
    method,
    keepalive: true,
    headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });

  // ── Sayfa görüntüleme + süre ────────────────────────────────────────────
  // Görüntüleme satırı sayfa yüklenir yüklenmez eklenir (page kesin canlı,
  // bu yüzden garanti ulaşır). Süre ise ancak sayfadan AYRILIRKEN belli olur;
  // o an başlatılan istekler tarayıcı tarafından güvenilir şekilde
  // tamamlanmayabilir (ölçüldü), bu yüzden süreyi ayrı bir UPDATE olarak,
  // en iyi çaba ile deniyoruz — başarısız olursa yalnızca o satırın süresi
  // boş kalır, görüntüleme kaydı hiçbir zaman kaybolmaz veya çiftlenmez.
  // id'yi kendimiz üretiyoruz (id: rid() ile insert ediyoruz) ki PATCH için
  // sunucudan geri okumaya (return=representation → SELECT izni gerektirir,
  // anon'a bunu vermek istemiyoruz — sadece admin okuyabilsin) ihtiyaç olmasın.
  const currentPage = page();
  const currentReferrer = referrer();
  const currentViewport = viewport();
  const visitId = rid();
  send('POST', 'site_visits', {
    id: visitId, visitor_id: visitorId, session_id: sessionId, page: currentPage,
    referrer: currentReferrer, viewport: currentViewport,
  }).catch(() => {});

  const start = Date.now();
  let durationSent = false;
  const sendDuration = () => {
    if (durationSent) return;
    durationSent = true;
    const duration = Math.min(14400, Math.max(0, Math.round((Date.now() - start) / 1000)));
    send('PATCH', `site_visits?id=eq.${visitId}`, { duration_seconds: duration }).catch(() => {});
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sendDuration(); });
  addEventListener('pagehide', sendDuration);

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
    send('POST', 'site_clicks', { visitor_id: visitorId, session_id: sessionId, page: currentPage, label: labelOf(el) }).catch(() => {});
  }, { capture: true });
})();
