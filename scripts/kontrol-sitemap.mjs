// Sitemap: her URL gerçek dosyaya gider; korunan/yönlendirilen/noindex yollar yok; lastmod gerçek tarih; robots.txt sitemap satırı.
import fs from 'node:fs';
import path from 'node:path';
import { KORUNAN_KLASORLER, ESKI_VARLIKLAR } from '../.eleventy.js';
import { arg, git, Rapor } from './ortak.mjs';
import rules from '../src/_data/yonlendirmeler.js';

const site = arg('site', '_site');
const r = new Rapor(`Sitemap (${site})`);
const SITE_URL = JSON.parse(fs.readFileSync('src/_data/site.json', 'utf8')).url;
const dosya = path.join(site, 'sitemap.xml');
if (!fs.existsSync(dosya)) { r.hata('sitemap.xml üretilmemiş'); r.bitir(); }
const xml = fs.readFileSync(dosya, 'utf8');
const girisler = [...xml.matchAll(/<url><loc>([^<]*)<\/loc><lastmod>([^<]*)<\/lastmod>(?:<xhtml:link[^>]*\/>)*<\/url>/g)];
if (!girisler.length) r.hata('Sitemap boş: hiçbir gerçek URL denetlenemedi');
const yasak = [...KORUNAN_KLASORLER, ESKI_VARLIKLAR];
const gorulen = new Set();
const korunanListe = new Set(JSON.parse(fs.readFileSync('src/_data/korunanSitemap.json', 'utf8')).sayfalar.map((x) => x.path));
for (const [, loc, lastmod] of girisler) {
  if (!loc.startsWith(SITE_URL + '/')) { r.hata(`yanlış köken: ${loc}`); continue; }
  const yol = loc.slice(SITE_URL.length);
  if (gorulen.has(yol)) r.hata(`yinelenen URL: ${yol}`); gorulen.add(yol);
  const f = path.join(site, yol.endsWith('/') ? yol + 'index.html' : yol);
  if (!fs.existsSync(f)) { r.hata(`dosya yok: ${yol}`); continue; }
  if (!korunanListe.has(yol) && yasak.some((k) => yol.startsWith(`/${k}/`))) r.hata(`sitemap'te olmaması gereken yol: ${yol}`);
  const html = fs.readFileSync(f, 'utf8');
  if (/<meta name="robots" content="noindex/.test(html)) r.hata(`noindex sayfa sitemap'te: ${yol}`);
  if (/<meta http-equiv="refresh"/.test(html)) r.hata(`yönlendirme stub'ı sitemap'te: ${yol}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod) || Number.isNaN(Date.parse(lastmod))) r.hata(`lastmod geçersiz: ${yol} ${lastmod}`);
  else if (Date.parse(lastmod) > Date.now() + 86400000) r.hata(`lastmod gelecekte: ${yol} ${lastmod}`);
}
// Gerileme yok: canlı sitemap'teki (baz) her URL, hâlâ sunuluyorsa yeni sitemap'te KALIR (yalnız artık yönlendirilenler hariç)
const baz = arg('base', 'origin/main');
let eskiXml = '';
try { eskiXml = git('show', `${baz}:sitemap.xml`); } catch { r.hata(`baz sitemap okunamadı: ${baz}:sitemap.xml`); }
const yonlenen = new Set(rules.flatMap((x) => [x.from, x.from.endsWith('/') ? x.from + 'index.html' : null, x.from.endsWith('.html') ? x.from.slice(0, -5) : null].filter(Boolean)));
let eskiSay = 0, yonSay = 0;
for (const [, loc] of eskiXml.matchAll(/<loc>([^<]*)<\/loc>/g)) {
  const yol = loc.slice(SITE_URL.length); eskiSay++;
  if (yonlenen.has(yol)) { yonSay++; continue; }
  if (!gorulen.has(yol)) r.hata(`canlı sitemap'te olan URL yeni sitemap'ten düşmüş (gerileme): ${yol}`);
}
r.not(`canlı sitemap ⊆ yeni: ${eskiSay} URL, ${yonSay} yönlendirilen, ${eskiSay - yonSay} aynen kalan`);
const robots = fs.existsSync(path.join(site, 'robots.txt')) ? fs.readFileSync(path.join(site, 'robots.txt'), 'utf8') : '';
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) r.hata('robots.txt sitemap satırı yok');
r.not(`${girisler.length} URL`);
r.bitir();
