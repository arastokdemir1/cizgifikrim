// V5: sitede iletişim formu YOK (iletişim yalnız mailto + harici cal.com bağlantısı). Gizlilik/koşullar metni bununla tutarlı olmalı.
// Denetler: korunan olmayan hiçbir sayfada <form> ya da lead-form.js yok; gizlilik/koşullar form, rıza sürümü, cf_language anlatmıyor.
import fs from 'node:fs';
import path from 'node:path';
import { KORUNAN_KLASORLER } from '../.eleventy.js';
import { arg, dosyalar, Rapor } from './ortak.mjs';

const site = arg('site', '_site');
const r = new Rapor(`Form yok / yasal metin tutarlılığı (${site})`);
let say = 0;
for (const f of dosyalar(site).filter((x) => x.endsWith('.html'))) {
  const g = path.relative(site, f).split(path.sep).join('/');
  if (KORUNAN_KLASORLER.some((k) => g.startsWith(k + '/'))) continue;
  const h = fs.readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/.test(h)) continue;
  say++;
  if (/<form[\s>]/.test(h)) r.hata(`${g}: <form> var (sitede form olmamalı)`);
  if (/lead-form\.js|language\.js|data-lead/.test(h)) r.hata(`${g}: form/dil betiği yükleniyor`);
}
for (const s of ['gizlilik', 'kosullar']) {
  const f = path.join(site, 'tr', s, 'index.html');
  if (!fs.existsSync(f)) { r.hata(`${f} yok`); continue; }
  const h = fs.readFileSync(f, 'utf8');
  for (const [re, ad] of [[/cf_language/, 'cf_language'], [/consent_version/, 'consent_version'], [/Görüşme formu|proje talebi formu|Proje talebi formu|iletişim formu/i, 'form anlatımı'], [/Dil tercihi/, 'Dil tercihi bölümü']]) if (re.test(h)) r.hata(`/tr/${s}/: eski ifade var: ${ad}`);
}
r.not(`${say} sayfa form/dil betiği için tarandı`);
r.bitir();
