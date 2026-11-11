// T9: form rıza sürümü ile Gizlilik sayfası eşit mi? lead-form.js consentVersion === /gizlilik/ "Sürüm: <değer>" === consent_version metni.
// Ayrıca: form kaynağında turnstile site anahtarı boş (TURNSTILE_MODE=off), `ref` kullanımı yok, subject gönderilmiyor.
import fs from 'node:fs';
import path from 'node:path';
import { arg, Rapor } from './ortak.mjs';

const site = arg('site', '_site');
const r = new Rapor(`Rıza sürümü ve form sözleşmesi (${site})`);
const js = fs.readFileSync('src/assets/js/lead-form.js', 'utf8');
const kod = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');   // açıklamalar hariç
const m = js.match(/consentVersion:\s*'([^']+)'/);
const surum = m && m[1];
if (!surum) r.hata('lead-form.js consentVersion bulunamadı');
const dosya = path.join(site, 'gizlilik', 'index.html');
if (!fs.existsSync(dosya)) r.hata(`${dosya} yok (gh/cf derlemesi gerekli)`);
else if (surum) {
  const html = fs.readFileSync(dosya, 'utf8');
  const s1 = html.match(/Sürüm:\s*([a-z0-9-]+)/i), s2 = html.match(/consent_version<\/code>:\s*([a-z0-9-]+)/i);
  if (!s1 || s1[1] !== surum) r.hata(`Gizlilik "Sürüm:" (${s1 && s1[1]}) ≠ lead-form.js (${surum})`);
  if (!s2 || s2[1] !== surum) r.hata(`Gizlilik consent_version metni (${s2 && s2[1]}) ≠ lead-form.js (${surum})`);
  if (!/id="iletisim-formu"/.test(html)) r.hata('Gizlilik sayfasında #iletisim-formu bölümü yok (form onay bağlantısı kırılır)');
  r.not(`consent_version = ${surum} (lead-form.js, Gizlilik "Sürüm:" ve consent_version metni eşit)`);
}
if (/turnstileSiteKey:\s*'[^']+'/.test(kod)) r.hata('turnstileSiteKey dolu: TURNSTILE_MODE=off iken boş olmalı');
if (/\.ref\b|json\.ref|j\.ref/.test(kod)) r.hata('lead-form.js yanıttaki ref alanını kullanıyor (kullanılmamalı)');
if (/body\.subject\s*=/.test(kod)) r.hata('subject gönderiliyor (gönderilmemeli)');
if (/sb_publishable_/.test(kod)) r.hata('sb_publishable_ anahtarı kullanılamaz (verify_jwt=true)');
r.bitir();
