// Cloudflare Pages `_headers` davranışını taklit eden yerel sunucu (yalnız doğrulama için).
// Kullanım: node scripts/baslik-sunucu.mjs [port] [dizin]    (varsayılan 8791 ve _site; dizinde `_headers` bulunmalı: PLATFORM=cf derlemesi)
// Kurallar (Cloudflare belgesi): eşleşen TÜM kurallar dosya sırasıyla uygulanır; aynı başlığın ikinci değeri EKLENİR (virgülle birleşir);
// "! Başlık" öncekileri siler; `*` her şeyle eşleşir (eğik çizgi dahil). Dizin istekleri index.html'e, bulunmayan yollar 404.html'e (404) gider.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const port = Number(process.argv[2] || 8791), kok = path.resolve(process.argv[3] || '_site');
const kurallar = [];
for (const satir of fs.readFileSync(path.join(kok, '_headers'), 'utf8').split('\n')) {
  if (!satir.trim() || satir.trim().startsWith('#')) continue;
  if (!/^\s/.test(satir)) { kurallar.push({ yol: satir.trim(), islemler: [] }); continue; }
  const s = satir.trim(), son = kurallar[kurallar.length - 1];
  if (s.startsWith('!')) son.islemler.push(['sil', s.slice(1).trim().toLowerCase()]);
  else { const i = s.indexOf(':'); son.islemler.push(['ekle', s.slice(0, i).trim().toLowerCase(), s.slice(i + 1).trim()]); }
}
const eslesir = (kalip, yol) => new RegExp('^' + kalip.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(yol);
export function basliklar(yol) {
  const h = new Map();
  for (const k of kurallar) if (eslesir(k.yol, yol)) for (const [t, ad, v] of k.islemler) { if (t === 'sil') h.delete(ad); else h.set(ad, [...(h.get(ad) || []), v]); }
  return Object.fromEntries([...h].map(([a, v]) => [a, v.join(', ')]));
}
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'); let yol = decodeURIComponent(url.pathname), dosya = path.join(kok, yol), durum = 200;
  if (fs.existsSync(dosya) && fs.statSync(dosya).isDirectory()) {
    if (!yol.endsWith('/')) { res.writeHead(308, { Location: yol + '/' + url.search }); return res.end(); }
    dosya = path.join(dosya, 'index.html');
  }
  if (!fs.existsSync(dosya) || !dosya.startsWith(kok)) { dosya = path.join(kok, '404.html'); durum = 404; }
  const b = { 'content-type': MIME[path.extname(dosya)] || 'application/octet-stream', 'cache-control': 'no-store', ...basliklar(yol) };
  if (!dosya.endsWith('404.html') || durum === 404) { /* başlıklar istenen yola göre */ }
  res.writeHead(durum, b); res.end(fs.existsSync(dosya) ? fs.readFileSync(dosya) : 'yok');
}).listen(port, '127.0.0.1', () => console.log(`baslik-sunucu http://127.0.0.1:${port} (${kok})`));
