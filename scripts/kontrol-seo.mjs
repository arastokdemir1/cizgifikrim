// İndekslenebilir sayfalarda SEO etiketleri: tek canonical (kendine), og:*, twitter:*, geçerli JSON-LD, title<=60, description 120-155, tek h1.
import fs from 'node:fs';
import path from 'node:path';
import { KORUNAN_KLASORLER, ESKI_VARLIKLAR } from '../.eleventy.js';
import { arg, dosyalar, Rapor } from './ortak.mjs';

const site = arg('site', '_site');
const r = new Rapor(`SEO etiketleri (${site})`);
const SITE_URL = JSON.parse(fs.readFileSync('src/_data/site.json', 'utf8')).url;
const atla = [...KORUNAN_KLASORLER, ESKI_VARLIKLAR, 'tr'];
let sayi = 0;
for (const f of dosyalar(site).filter((x) => x.endsWith('.html'))) {
  const goreli = path.relative(site, f).split(path.sep).join('/');
  if (atla.some((a) => goreli.startsWith(a + '/'))) continue;
  const html = fs.readFileSync(f, 'utf8');
  if (/<meta http-equiv="refresh"/.test(html)) continue; // stub
  const noindex = /<meta name="robots" content="noindex/.test(html);
  sayi++;
  const url = '/' + goreli.replace(/index\.html$/, '');
  const say = (re) => (html.match(re) || []).length;
  const al = (re) => (html.match(re) || [])[1];
  const baslik = al(/<title>([^<]*)<\/title>/), aciklama = al(/<meta name="description" content="([^"]*)"/);
  const ad = `${url}${noindex ? ' (noindex)' : ''}`;
  if (!baslik) r.hata(`${ad}: <title> yok`); else if ([...baslik].length > 60) r.hata(`${ad}: title ${[...baslik].length} > 60 karakter`);
  if (!aciklama) r.hata(`${ad}: description yok`); else { const n = [...aciklama].length; if (n < 120 || n > 155) r.hata(`${ad}: description ${n} karakter (120–155 olmalı)`); }
  if (say(/<link rel="canonical"/g) !== 1) r.hata(`${ad}: tam olarak 1 canonical olmalı (${say(/<link rel="canonical"/g)})`);
  else if (!noindex && al(/<link rel="canonical" href="([^"]*)"/) !== SITE_URL + url) r.hata(`${ad}: canonical kendine değil: ${al(/<link rel="canonical" href="([^"]*)"/)}`);
  for (const p of ['og:title', 'og:description', 'og:url', 'og:type', 'og:site_name']) if (!html.includes(`property="${p}"`)) r.hata(`${ad}: ${p} yok`);
  for (const p of ['twitter:card', 'twitter:title', 'twitter:description']) if (!html.includes(`name="${p}"`)) r.hata(`${ad}: ${p} yok`);
  if (say(/<h1[\s>]/g) !== 1 && !/^\/404\.html$/.test(url)) r.hata(`${ad}: tam olarak 1 <h1> olmalı (${say(/<h1[\s>]/g)})`);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length) r.hata(`${ad}: JSON-LD yok`);
  for (const m of ld) { try { const j = JSON.parse(m[1]); if (!JSON.stringify(j).includes('"Organization"')) r.hata(`${ad}: JSON-LD'de Organization yok`); } catch (e) { r.hata(`${ad}: JSON-LD geçersiz: ${e.message}`); } }
}
r.not(sayi ? `${sayi} sayfa denetlendi` : 'denetlenecek sayfa yok (0): tasarım katmanı sayfaları geldiğinde devreye girer');
r.bitir();
