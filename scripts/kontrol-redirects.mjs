// Yönlendirme verisi ve çıktısı: tek atlama, zincir/döngü yok, joker yok, korunan yol yakalanmaz, tüm eski /tr/ sayfaları kapsanır,
// bayraklar (k2b, k6b, istasyon) ve istasyonCanli kuralı doğru, gh modunda stub dosyaları / cf modunda _redirects doğru.
import fs from 'node:fs';
import path from 'node:path';
import { KORUNAN_KLASORLER, KORUNAN_DOSYALAR } from '../.eleventy.js';
import yonlendirmeler from '../src/_data/yonlendirmeler.js';
import nav from '../src/_data/nav.js';
import { agacDosyalari, arg, Rapor } from './ortak.mjs';

const site = arg('site', '_site'), baz = arg('base', 'origin/main');
const r = new Rapor(`Yönlendirmeler (${site})`);
const siteVeri = JSON.parse(fs.readFileSync('src/_data/site.json', 'utf8'));
const ham = JSON.parse(fs.readFileSync('src/_data/redirects.json', 'utf8')).redirects;
const veri = yonlendirmeler; // etkin liste (istasyon bayrağı uygulanmış)
const froms = new Set(), parcasiz = (p) => p.split('#')[0];
const IST = `${siteVeri.istasyonUrl}/`;

// Hedef izin listesi: yeni sitenin planlı sayfaları + korunan yollar. Yeni hedef eklenirse buraya (ve uygulama planına) yazılır; yazım hatalarını yakalar.
const IZINLI = new Set(['/', '/calismalar/', '/calismalar/carlog/', '/hakkinda/', '/gorusme/', '/hizmetler/', '/hizmetler/web-sitesi-ve-e-ticaret/',
  '/gizlilik/', '/kosullar/', '/istasyon-yakinda/', '/piyasa/']);
if (typeof siteVeri.istasyonCanli !== 'boolean') r.hata('site.json istasyonCanli boolean olmalı');

for (const x of veri) {
  const { from, to, status } = x;
  if (froms.has(from)) r.hata(`yinelenen from: ${from}`); froms.add(from);
  if (!from.startsWith('/tr/')) r.hata(`from /tr/ ile başlamıyor (joker/korunan yol riski): ${from}`);
  if (from.includes('*')) r.hata(`joker yasak: ${from}`);
  const korunan = [...KORUNAN_KLASORLER.map((k) => `/${k}/`), ...KORUNAN_DOSYALAR.map((f) => `/${f}`)];
  if (korunan.some((k) => from === k || from.startsWith(k))) r.hata(`korunan yol yönlendirilemez: ${from}`);
  if (to === IST) { if (!siteVeri.istasyonCanli) r.hata(`İstasyon canlı değilken İstasyon hedefi: ${from} -> ${to}`); }
  else if (!IZINLI.has(parcasiz(to))) r.hata(`hedef izinli listede değil: ${from} -> ${to}`);
  if (status !== 301) r.hata(`status 301 olmalı: ${from}`);
  if (/#/.test(to)) r.hata(`hedefte parça (#) yok olmalı (_redirects parçayı korumaz): ${from} -> ${to}`);
}
for (const { from, to } of veri) if (froms.has(parcasiz(to))) r.hata(`zincir/döngü: ${from} -> ${to} (hedef de bir from)`);

// Bayraklar (Teknik-1 kararları, uygulama_plani.md §4.1)
const h = (f) => ham.find((x) => x.from === f);
for (const s of ['sano', 'ultron', 'focusgrid', 'flowgraph', 'aka', 'arda', 'better_motors', 'ersoy', 'gnomon', 'radar']) {
  const k = h(`/tr/projects/${s}.html`);
  if (!k || k.k2b !== true || k.to !== '/calismalar/') r.hata(`/tr/projects/${s}.html: k2b:true ve hedef /calismalar/ olmalı`);
}
const pz = h('/tr/projects/piyasa.html'); if (!pz || pz.k2b !== true || pz.to !== '/piyasa/') r.hata('/tr/projects/piyasa.html: k2b:true, hedef /piyasa/ olmalı');
const cl = h('/tr/projects/carlog.html'); if (!cl || cl.to !== '/calismalar/carlog/') r.hata('/tr/projects/carlog.html: hedef /calismalar/carlog/ olmalı');
const ec = h('/tr/eticaret-paketi.html'); if (!ec || ec.k6b !== true || ec.to !== '/hizmetler/web-sitesi-ve-e-ticaret/') r.hata('/tr/eticaret-paketi.html: k6b:true, hedef /hizmetler/web-sitesi-ve-e-ticaret/ olmalı');
for (const s of ['giris', 'panel', 'admin']) { const k = h(`/tr/${s}.html`); if (!k || k.istasyon !== true) r.hata(`/tr/${s}.html: istasyon:true olmalı`); }
const ky = h('/tr/kayit.html'); if (!ky || ky.to !== '/gorusme/') r.hata('/tr/kayit.html: hedef /gorusme/ olmalı');
// İstasyon bayrağı ↔ menü/footer "Giriş"
if (siteVeri.istasyonCanli === false && nav.giris !== null) r.hata('istasyonCanli:false iken nav.giris null olmalı (menü/footer Giriş gösterilmez)');
if (siteVeri.istasyonCanli === true && !nav.giris) r.hata('istasyonCanli:true iken nav.giris tanımlı olmalı');

// Kapsam: baz ağaçtaki her eski tr/*.html bir yönlendirmeye sahip; tr/*.txt yönlendirilmez
const eskiSayfalar = agacDosyalari(baz, ['tr']).map((a) => '/' + a.yol).filter((p) => p.endsWith('.html'));
const kapsanmayan = eskiSayfalar.filter((p) => !froms.has(p));
r.not(`eski /tr/ sayfaları: ${eskiSayfalar.length}, yönlendirme: ${veri.length}, kapsanmayan: ${kapsanmayan.length}`);
for (const p of kapsanmayan) r.hata(`yönlendirmesi yok: ${p}`);
for (const { from } of veri) if (from.endsWith('.txt')) r.hata(`.txt yönlendirilmez: ${from}`);

// Çıktı
const cf = fs.existsSync(path.join(site, '_redirects'));
if (cf) {
  const satirlar = fs.readFileSync(path.join(site, '_redirects'), 'utf8').split('\n').filter(Boolean);
  for (const { from, to } of veri) if (!satirlar.some((s) => s.startsWith(`${from} ${to} 301`))) r.hata(`_redirects eksik: ${from}`);
  if (!siteVeri.istasyonCanli && satirlar.some((s) => s.includes(siteVeri.istasyonUrl))) r.hata('_redirects İstasyon adresini içeriyor (istasyonCanli:false)');
  if (satirlar.some((s) => s.startsWith('/tr/*'))) r.hata('/tr/* catch-all yasak (soft-404)');
  r.not(`mod: cf (_redirects: ${satirlar.length} satır)`);
} else {
  const stubDosyalar = new Set(veri.map((x) => (x.from.endsWith('/') ? x.from + 'index.html' : x.from)));
  let n = 0;
  for (const d of stubDosyalar) {
    const f = path.join(site, d);
    if (!fs.existsSync(f)) { r.hata(`stub yok: ${d}`); continue; }
    const html = fs.readFileSync(f, 'utf8'); n++;
    const to = veri.find((x) => x.from === d || x.from === d.replace(/index\.html$/, ''))?.to;
    if (!html.includes(`<meta http-equiv="refresh" content="0; url=${to}">`)) r.hata(`stub hedefi yanlış: ${d} (beklenen ${to})`);
    if (!/<meta name="robots" content="noindex">/.test(html)) r.hata(`stub noindex değil: ${d}`);
    if (!siteVeri.istasyonCanli && html.includes(siteVeri.istasyonUrl)) r.hata(`stub İstasyon adresini içeriyor (istasyonCanli:false): ${d}`);
  }
  r.not(`mod: gh (${n} stub doğrulandı)`);
  const fazla = [];
  (function yuru(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yuru(p); else if (e.name.endsWith('.html') && fs.readFileSync(p, 'utf8').includes('Sayfa taşındı') && !path.relative(site, p).startsWith('tr' + path.sep)) fazla.push(p); } })(site);
  for (const f of fazla) r.hata(`/tr/ dışında stub: ${f}`);
}
r.not(`bayraklar: k2b ${ham.filter((x) => x.k2b).length}, k6b ${ham.filter((x) => x.k6b).length}, istasyon ${ham.filter((x) => x.istasyon).length}; istasyonCanli=${siteVeri.istasyonCanli}`);
r.bitir();
