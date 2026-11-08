// Faz 1'de ölçülen/indekslenen URL listesi (Backend-2'ye iletilir, T18). Sitemap'ten üretilir; analytics page regex'ine uyar mı denetlenir.
// Kullanım: node scripts/kontrol-url-listesi.mjs [--site _site] [--out url-listesi.txt]
import fs from 'node:fs';
import path from 'node:path';
import { arg, Rapor } from './ortak.mjs';

const site = arg('site', '_site');
const r = new Rapor(`URL listesi / analytics page regex (${site})`);
const SITE_URL = JSON.parse(fs.readFileSync('src/_data/site.json', 'utf8')).url;
const RE = /^\/[A-Za-z0-9._~%/-]{0,200}$/;
const xml = fs.existsSync(path.join(site, 'sitemap.xml')) ? fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8') : '';
const urller = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1].slice(SITE_URL.length));
if (fs.existsSync(path.join(site, '404.html'))) urller.push('/404.html');
for (const u of urller) if (!RE.test(u)) r.hata(`regex'e uymuyor: ${u}`);
const liste = [...new Set(urller)].sort();
r.not(`${liste.length} URL`);
for (const u of liste) r.not(`  ${u}`);
if (arg('out')) fs.writeFileSync(arg('out'), liste.join('\n') + '\n');
r.bitir();
