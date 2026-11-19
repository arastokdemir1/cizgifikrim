// Cloudflare `_headers` (PLATFORM=cf) güvenlik başlıkları kontrolü (F2-H). gh derlemesinde `_headers` olmaz: atlanır.
// Kontroller: yer tutucu kalmadı, satır ≤2000 karakter, /* kuralında zorunlu başlıklar, HSTS includeSubDomains YOK, script-src'de 'unsafe-inline' YOK,
// frame-ancestors 'self', ikinci CSP yalnız "! Content-Security-Policy" ile, /demo/* ve korunan eski yollar CSP'den ayrılmış, hash'ler çıktıdaki satır içi betiklerle eşleşiyor.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { KORUNAN_KLASORLER } from '../.eleventy.js';
import { arg, Rapor } from './ortak.mjs';

const site = arg('site', '_site');
const r = new Rapor(`Güvenlik başlıkları (${site}/_headers)`);
const f = path.join(site, '_headers');
if (!fs.existsSync(f)) { r.not('_headers yok (PLATFORM=gh derlemesi): atlandı'); r.bitir(); }
const metin = fs.readFileSync(f, 'utf8'), satirlar = metin.split('\n');
if (metin.includes('__SCRIPT_HASHLERI__')) r.hata('__SCRIPT_HASHLERI__ yer tutucusu doldurulmamış');
satirlar.forEach((s, i) => { if (s.length > 2000) r.hata(`satır ${i + 1} 2000 karakteri aşıyor (${s.length})`); });
const kurallar = []; for (const s of satirlar) { if (!s.trim() || s.trim().startsWith('#')) continue; if (!/^\s/.test(s)) kurallar.push({ yol: s.trim(), h: [] }); else kurallar[kurallar.length - 1].h.push(s.trim()); }
if (kurallar.length > 100) r.hata(`kural sayısı ${kurallar.length} > 100 (Cloudflare sınırı)`);
const tum = kurallar.find((k) => k.yol === '/*');
if (!tum) r.hata('/* kuralı yok');
else {
  for (const g of ['Strict-Transport-Security', 'X-Content-Type-Options: nosniff', 'Referrer-Policy: strict-origin-when-cross-origin', 'Permissions-Policy', 'Content-Security-Policy']) if (!tum.h.some((x) => x.startsWith(g))) r.hata(`/* kuralında ${g} yok`);
  const hsts = tum.h.find((x) => x.startsWith('Strict-Transport-Security')) || ''; if (/includeSubDomains|preload/i.test(hsts)) r.hata('HSTS includeSubDomains/preload içermemeli (demo alt alanları GitHub Pages)');
  const pp = tum.h.find((x) => x.startsWith('Permissions-Policy')) || ''; for (const a of ['camera=()', 'microphone=()', 'geolocation=()']) if (!pp.includes(a)) r.hata(`Permissions-Policy ${a} yok`);
}
const cspler = kurallar.flatMap((k) => k.h.filter((x) => x.startsWith('Content-Security-Policy:')).map((x) => ({ yol: k.yol, csp: x, ayir: k.h.includes('! Content-Security-Policy') })));
for (const c of cspler) {
  const sc = (c.csp.match(/script-src ([^;]*)/) || [])[1] || '';
  if (/'unsafe-inline'|'unsafe-eval'/.test(sc)) r.hata(`${c.yol}: script-src güvensiz anahtar içeriyor`);
  if (!/frame-ancestors 'self'/.test(c.csp)) r.hata(`${c.yol}: frame-ancestors 'self' yok`);
  if (!/default-src 'none'/.test(c.csp) || !/object-src 'none'/.test(c.csp) || !/base-uri 'none'/.test(c.csp)) r.hata(`${c.yol}: default-src/object-src/base-uri 'none' eksik`);
  if (c.yol !== '/*' && !c.ayir) r.hata(`${c.yol}: ikinci CSP "! Content-Security-Policy" ile ayrılmamış (iki CSP kesişir)`);
}
const ayriYollar = ['/demo/*', ...KORUNAN_KLASORLER.filter((k) => k !== 'demo').map((k) => `/${k}/*`)];
for (const y of ayriYollar) { const k = kurallar.find((x) => x.yol === y); if (!k || !k.h.includes('! Content-Security-Policy')) r.hata(`${y}: site CSP'sinden ayrılmamış`); }
// Hash'ler çıktıdaki satır içi betiklerle birebir
const hashler = new Set();
(function yuru(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name), g = path.relative(site, p).split(path.sep).join('/');
  if (e.isDirectory()) { if (!KORUNAN_KLASORLER.includes(g.split('/')[0]) && g !== 'assets') yuru(p); }
  else if (e.name.endsWith('.html')) for (const m of fs.readFileSync(p, 'utf8').matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) { if (/\bsrc=/.test(m[1]) || /ld\+json/.test(m[1])) continue; hashler.add(`'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`); } } })(site);
const ana = (tum?.h.find((x) => x.startsWith('Content-Security-Policy')) || '');
for (const h of hashler) if (!ana.includes(h)) r.hata(`satır içi betik hash'i CSP'de yok: ${h}`);
r.not(`${kurallar.length} kural, ${cspler.length} CSP, ${hashler.size} satır içi betik hash'i doğrulandı`);
r.bitir();
