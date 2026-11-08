// Sitemap: her URL gerçek dosyaya gider; korunan/yönlendirilen/noindex yollar yok; lastmod gerçek tarih; robots.txt sitemap satırı.
import fs from 'node:fs';
import path from 'node:path';
import { KORUNAN_KLASORLER, ESKI_VARLIKLAR } from '../.eleventy.js';
import { arg, Rapor } from './ortak.mjs';

const site = arg('site', '_site');
const r = new Rapor(`Sitemap (${site})`);
const SITE_URL = JSON.parse(fs.readFileSync('src/_data/site.json', 'utf8')).url;
const dosya = path.join(site, 'sitemap.xml');
if (!fs.existsSync(dosya)) { r.hata('sitemap.xml üretilmemiş'); r.bitir(); }
const xml = fs.readFileSync(dosya, 'utf8');
const girisler = [...xml.matchAll(/<url><loc>([^<]*)<\/loc><lastmod>([^<]*)<\/lastmod><\/url>/g)];
const yasak = [...KORUNAN_KLASORLER, ESKI_VARLIKLAR, 'tr'];
const gorulen = new Set();
for (const [, loc, lastmod] of girisler) {
  if (!loc.startsWith(SITE_URL + '/')) { r.hata(`yanlış köken: ${loc}`); continue; }
  const yol = loc.slice(SITE_URL.length);
  if (gorulen.has(yol)) r.hata(`yinelenen URL: ${yol}`); gorulen.add(yol);
  const f = path.join(site, yol.endsWith('/') ? yol + 'index.html' : yol);
  if (!fs.existsSync(f)) { r.hata(`dosya yok: ${yol}`); continue; }
  if (yasak.some((k) => yol.startsWith(`/${k}/`))) r.hata(`sitemap'te olmaması gereken yol: ${yol}`);
  const html = fs.readFileSync(f, 'utf8');
  if (/<meta name="robots" content="noindex/.test(html)) r.hata(`noindex sayfa sitemap'te: ${yol}`);
  if (/<meta http-equiv="refresh"/.test(html)) r.hata(`yönlendirme stub'ı sitemap'te: ${yol}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod) || Number.isNaN(Date.parse(lastmod))) r.hata(`lastmod geçersiz: ${yol} ${lastmod}`);
  else if (Date.parse(lastmod) > Date.now() + 86400000) r.hata(`lastmod gelecekte: ${yol} ${lastmod}`);
}
const robots = fs.existsSync(path.join(site, 'robots.txt')) ? fs.readFileSync(path.join(site, 'robots.txt'), 'utf8') : '';
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) r.hata('robots.txt sitemap satırı yok');
r.not(`${girisler.length} URL`);
r.bitir();
