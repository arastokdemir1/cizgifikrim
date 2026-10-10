// CizgiFikrim: talep formu yapılandırması. YAYIN ANAHTARI: `enabled` true iken sayfalar talep formunu gösterir (talep formu tek yoldur);
// false yapılırsa form gizlenir ve yalnız e-posta ve takvim (randevu) yedeği görünür. submit-lead function'ı canlıdayken açık tutulur.
window.CIZGI_LEAD = {
  enabled: true,
  // Uç nokta adresi (yapılandırılabilir). Varsayılan: Supabase submit-lead function'ı.
  endpoint: 'https://iekdktdhhryqewvcrnmr.supabase.co/functions/v1/submit-lead',
  // Supabase anon anahtarı public'tir (supabase-client.js ile aynı); function ağ geçidi için gerekli. Sahte uç noktada kullanılmaz.
  apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlla2RrdGRoaHJ5cWV3dmNybm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTA4NjIsImV4cCI6MjA5OTg4Njg2Mn0.1R70BzCmDdXbTpVGGk19y9ThY9n7dDJ7SMcJWc5Uhl4',
  kind: 'contact',
  // Aydınlatma metni sürümü: gizlilik.html "8. Proje talebi formu" bölümündeki sürümle eşleşmeli; metin değişince ikisi birlikte güncellenir.
  consentVersion: 'bekleme-2026-10'
};
// Yerel geliştirme: `python3 scripts/dev-server.py` ile açılan sayfalarda ?lead=mock formu açar ve sahte uç noktaya (/__lead) bağlar.
// Yalnız localhost/127.0.0.1'de çalışır; canlı sitede etkisizdir.
(function () {
  try {
    var h = location.hostname;
    if ((h === 'localhost' || h === '127.0.0.1') && /[?&]lead=mock\b/.test(location.search)) {
      window.CIZGI_LEAD.enabled = true; window.CIZGI_LEAD.endpoint = location.origin + '/__lead'; window.CIZGI_LEAD.apikey = ''; window.CIZGI_LEAD.mock = true;
    }
  } catch (e) { /* yok say */ }
})();
