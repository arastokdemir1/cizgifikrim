// Kırık link taraması: derlenen sitede (korunan klasörler hariç kaynak sayfalar) her iç href/src/srcset ve CSS url() gerçek dosyaya gider;
// #parça hedefleri hedef sayfada id olarak vardır; sayfa içi '#' (boş) yalnız atla bağlantısıdır.
import fs from 'node:fs';
import path from 'node:path';
import { KORUNAN_KLASORLER } from '../.eleventy.js';
import { arg, dosyalar, Rapor } from './ortak.mjs';

const site = arg('site', '_site');
const r = new Rapor(`Kırık link taraması (${site})`);
const SITE_URL = JSON.parse(fs.readFileSync('src/_data/site.json', 'utf8')).url;
const kaynakDisi = (g) => KORUNAN_KLASORLER.some((k) => g.startsWith(k + '/')) || g.startsWith('assets/') && !g.startsWith('assets/v1/');
const cozum = (yol) => { // /x/y/ → _site/x/y/index.html; /x.html → dosya
  const p = path.join(site, decodeURIComponent(yol));
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  if (fs.existsSync(p) && fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'index.html'))) return path.join(p, 'index.html');
  return null;
};
const idler = new Map();
const idVar = (f, id) => {
  if (!idler.has(f)) idler.set(f, new Set([...fs.readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idler.get(f).has(id);
};
let say = 0, sayfa = 0;
const kontrol = (kaynak, ham, bagil) => {
  let u = ham.trim();
  if (!u || /^(mailto:|tel:|data:|javascript:|blob:)/i.test(u)) return;
  if (u.startsWith(SITE_URL)) u = u.slice(SITE_URL.length) || '/';
  if (/^(https?:)?\/\//i.test(u)) return; // dış
  const [yolHam, parca] = (() => { const i = u.indexOf('#'); return i < 0 ? [u, ''] : [u.slice(0, i), u.slice(i + 1)]; })();
  const yolSorgusuz = yolHam.split('?')[0];
  say++;
  if (!yolSorgusuz) { if (parca && !idVar(path.join(site, bagil), parca)) r.hata(`${kaynak}: sayfa içi #${parca} hedefi yok`); return; }
  let mutlak = yolSorgusuz.startsWith('/') ? yolSorgusuz : path.posix.join(path.posix.dirname('/' + bagil), yolSorgusuz);
  if (yolSorgusuz.endsWith('/') && !mutlak.endsWith('/')) mutlak += '/';
  const f = cozum(mutlak);
  if (!f) { r.hata(`${kaynak}: kırık link ${ham}`); return; }
  if (parca && f.endsWith('.html') && !idVar(f, parca)) r.hata(`${kaynak}: ${ham}: hedefte #${parca} id'si yok`);
};
for (const f of dosyalar(site)) {
  const g = path.relative(site, f).split(path.sep).join('/');
  if (kaynakDisi(g)) continue;
  if (g.endsWith('.html')) {
    sayfa++;
    const h = fs.readFileSync(f, 'utf8').replace(/<script[^>]*>[\s\S]*?<\/script>/g, (m) => m.match(/<script[^>]*\bsrc=/) ? m.replace(/>[\s\S]*<\/script>/, '></script>') : '').replace(/<!--[\s\S]*?-->/g, '');
    for (const m of h.matchAll(/\b(?:href|src|poster|data-target)="([^"]*)"/g)) kontrol(g, m[1], g);
    for (const m of h.matchAll(/\bsrcset="([^"]*)"/g)) for (const s of m[1].split(',')) kontrol(g, s.trim().split(/\s+/)[0], g);
    for (const m of h.matchAll(/<meta http-equiv="refresh" content="[^"]*url=([^"]*)"/g)) kontrol(g, m[1], g);
    for (const m of h.matchAll(/<meta (?:property|name)="(?:og:image|twitter:image)" content="([^"]*)"/g)) kontrol(g, m[1], g);
  } else if (g.endsWith('.css')) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/url\(\s*['"]?([^)'"]+)['"]?\s*\)/g)) kontrol(g, m[1], g);
  }
}
r.not(`${sayfa} sayfa, ${say} iç bağlantı/varlık denetlendi`);
r.bitir();
