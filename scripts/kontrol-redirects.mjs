// Yönlendirme verisi ve çıktısı: tek atlama, zincir/döngü yok, joker yalnız /tr/*, korunan yol yakalanmaz,
// tüm eski /tr/ sayfaları kapsanır, gh modunda stub dosyaları ve cf modunda _redirects doğru.
import fs from 'node:fs';
import path from 'node:path';
import { KORUNAN_KLASORLER, KORUNAN_DOSYALAR } from '../.eleventy.js';
import { agacDosyalari, arg, Rapor } from './ortak.mjs';

const site = arg('site', '_site'), baz = arg('base', 'origin/main');
const r = new Rapor(`Yönlendirmeler (${site})`);
const veri = JSON.parse(fs.readFileSync('src/_data/redirects.json', 'utf8')).redirects;
const froms = new Set(), tr = (p) => p.split('#')[0];
const DIS = 'https://istasyon.cizgifikrim.net/';

for (const { from, to, status } of veri) {
  if (froms.has(from)) r.hata(`yinelenen from: ${from}`); froms.add(from);
  if (!from.startsWith('/tr/')) r.hata(`from /tr/ ile başlamıyor (joker/korunan yol riski): ${from}`);
  if (from.includes('*')) r.hata(`joker yasak: ${from}`);
  const korunan = [...KORUNAN_KLASORLER.map((k) => `/${k}/`), ...KORUNAN_DOSYALAR.map((f) => `/${f}`)];
  if (korunan.some((k) => from === k || from.startsWith(k))) r.hata(`korunan yol yönlendirilemez: ${from}`);
  if (!(to.startsWith('/') || to === DIS)) r.hata(`to geçersiz (iç yol ya da ${DIS}): ${from} -> ${to}`);
  if (status !== 301) r.hata(`status 301 olmalı: ${from}`);
}
for (const { from, to } of veri) if (froms.has(tr(to))) r.hata(`zincir/döngü: ${from} -> ${to} (hedef de bir from)`);

// Kapsam: baz ağaçtaki her eski tr/*.html bir yönlendirmeye sahip
const eskiSayfalar = agacDosyalari(baz, ['tr']).map((a) => '/' + a.yol).filter((p) => p.endsWith('.html'));
const kapsanmayan = eskiSayfalar.filter((p) => !froms.has(p));
r.not(`eski /tr/ sayfaları: ${eskiSayfalar.length}, yönlendirme: ${veri.length}, kapsanmayan: ${kapsanmayan.length}`);
for (const p of kapsanmayan) r.hata(`yönlendirmesi yok: ${p}`);

// Çıktı
const cf = fs.existsSync(path.join(site, '_redirects'));
if (cf) {
  const satirlar = fs.readFileSync(path.join(site, '_redirects'), 'utf8').split('\n').filter(Boolean);
  for (const { from, to } of veri) if (!satirlar.some((s) => s.startsWith(`${from} ${to} 301`))) r.hata(`_redirects eksik: ${from}`);
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
  }
  r.not(`mod: gh (${n} stub doğrulandı)`);
  // Stub yalnız /tr/ altında üretilir
  const fazla = [];
  (function yuru(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yuru(p); else if (e.name.endsWith('.html') && fs.readFileSync(p, 'utf8').includes('Sayfa taşındı') && !path.relative(site, p).startsWith('tr' + path.sep)) fazla.push(p); } })(site);
  for (const f of fazla) r.hata(`/tr/ dışında stub: ${f}`);
}
r.bitir();
