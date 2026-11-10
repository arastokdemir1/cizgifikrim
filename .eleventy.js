// CizgiFikrim vitrin: Eleventy 3 yapılandırması (altyapı sahibi: Frontend-1, S0-B).
// Girdi: src/ (yeni vitrin). Çıktı: _site/.
// Eski klasörler (sanayi, piyasa, carlog, sano, zihinustasi, p, demo, baupilotaj, CNAME, ikonlar) BAYT AYNEN kopyalanır:
// işlenmez, küçültülmez, başlık/betik eklenmez. scripts/kontrol-passthrough.mjs bunu origin/main ile SHA-256 karşılaştırır.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Image from '@11ty/eleventy-img';

const PLATFORM = (process.env.PLATFORM || 'gh').toLowerCase(); // gh = GitHub Pages (stub'lar), cf = Cloudflare Pages (_redirects/_headers)
if (!['gh', 'cf'].includes(PLATFORM)) throw new Error(`PLATFORM gh ya da cf olmalı, verilen: ${PLATFORM}`);

// Korunan yollar: sahibi başka ekipler olan ya da paylaşılan bağlantı taşıyan yollar. Build bunlara dokunmaz.
export const KORUNAN_KLASORLER = ['sanayi', 'piyasa', 'carlog', 'sano', 'zihinustasi', 'p', 'demo', 'baupilotaj'];
export const KORUNAN_DOSYALAR = ['CNAME', 'favicon.ico', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'site.webmanifest'];
// Eski site varlıkları: demo/ ve p/ sayfaları /assets/... yoluna başvurur, bu yüzden aynen kalır. Yeni varlıklar /assets/v1/ altına gider.
export const ESKI_VARLIKLAR = 'assets';


// Görsel boyutunu SENKRON okur (PNG, JPEG, WebP). eleventy-img 7'de statsSync yok; kısa kod senkron kalsın diye başlık okunur.
function gorselBoyut(dosya) {
  const b = fs.readFileSync(dosya);
  if (b.length > 24 && b.toString('latin1', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  if (b.length > 30 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const f = b.toString('latin1', 12, 16);
    if (f === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (f === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (f === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
  }
  throw new Error(`gorsel: desteklenmeyen görsel biçimi ya da bozuk dosya: ${dosya}`);
}
const icerikKarmasi = (dosya) => createHash('sha256').update(fs.readFileSync(dosya)).digest('hex').slice(0, 8);

const xmlEsc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

function sonDegisiklik(girdiYolu) {
  // Gerçek lastmod: dosyanın son commit tarihi; git yoksa/commit yoksa dosya zamanı.
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', girdiYolu], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (out) return out.slice(0, 10);
  } catch (_) { /* git yok */ }
  try { return fs.statSync(girdiYolu).mtime.toISOString().slice(0, 10); } catch (_) { return new Date().toISOString().slice(0, 10); }
}

export default function (eleventyConfig) {
  // ── Bayt aynı kopya (passthrough) ───────────────────────────────────────
  const var_ = (p) => fs.existsSync(p);
  for (const d of KORUNAN_KLASORLER) if (var_(d)) eleventyConfig.addPassthroughCopy({ [d]: d });
  for (const f of KORUNAN_DOSYALAR) if (var_(f)) eleventyConfig.addPassthroughCopy({ [f]: f });
  if (var_(ESKI_VARLIKLAR)) eleventyConfig.addPassthroughCopy({ [ESKI_VARLIKLAR]: ESKI_VARLIKLAR });
  if (var_('src/assets')) eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets/v1' });

  // Altyapı test sayfası yalnız ELEVENTY_FIXTURE=1 iken derlenir (aksi halde şablon hiç işlenmez: yan etki, örn. görsel üretimi, olmaz).
  if (process.env.ELEVENTY_FIXTURE !== '1') eleventyConfig.ignores.add('src/_fixture/**');

  // ── Filtreler ───────────────────────────────────────────────────────────
  // JSON-LD: '<' kaçırılır, </script> ile erken kapanma olmaz.
  eleventyConfig.addFilter('jsonld', (obj) => JSON.stringify(obj).replace(/</g, '\\u003c'));
  eleventyConfig.addFilter('xml', xmlEsc);
  // Sitemap: yalnız indekslenebilir, gerçek sayfalar. noindex, 404, stub, alt çizgili (iç) yollar ve sitemap:false dışarıda.
  eleventyConfig.addFilter('sitemapSayfalari', (sayfalar) => sayfalar
    .filter((p) => typeof p.url === 'string' && p.url.length > 0)
    .filter((p) => !p.data.noindex && p.data.sitemap !== false && p.data.stub !== true)
    .filter((p) => !p.url.startsWith('/_') && !/^\/(404\.html|sitemap\.xml|robots\.txt)$/.test(p.url))
    .filter((p) => p.url.endsWith('/') || p.url.endsWith('.html'))
    .sort((a, b) => a.url.localeCompare(b.url)));
  eleventyConfig.addFilter('lastmod', (sayfa) => sonDegisiklik(sayfa.inputPath.replace(/^\.\//, '')));
  // projeler.liste içinden slug ile tek proje: {% set p = projeler.liste | projeBul('vesira') %} (Nunjucks selectattr tek argüman alır, equalto çalışmaz)
  eleventyConfig.addFilter('projeBul', (liste, slug) => (liste || []).find((p) => p.slug === slug));
  eleventyConfig.addFilter('mutlakUrl', (yol, site) => (/^https?:\/\//.test(yol) ? yol : site.url + yol));

  // ── Görsel işleme: AVIF + WebP, width/height, alt ZORUNLU ──────────────
  // Kullanım: {% gorsel "src/assets/img/ornek.jpg", "Açıklama", "(min-width: 900px) 50vw, 100vw", [480, 960], "eager" %}  (genişlikler ve yükleme isteğe bağlı)
  // SENKRON kısa kod: Nunjucks'ta döngü/include içinde asenkron kısa kod sessizce çıktıyı keser; bu yüzden meta anında (statsSync) hesaplanır,
  // dosya üretimi arka planda başlar ve build bitmeden eleventy.after'da beklenir. Her şablonda (for, include, macro) güvenle kullanılır.
  const bekleyenGorseller = [];
  eleventyConfig.addShortcode('gorsel', function (kaynak, alt, sizes = '100vw', genislikler = [480, 960, 1440], yukleme = 'lazy') {
    if (alt === undefined || alt === null) throw new Error(`gorsel kısa kodu: alt metin zorunlu (${kaynak}). Süs görseli ise alt="" verin.`);
    const { w: kw, h: kh } = gorselBoyut(kaynak);
    const karma = icerikKarmasi(kaynak), ad = path.basename(kaynak, path.extname(kaynak));
    const dosyaAdi = (_id, _src, width, format) => `${ad}-${karma}-${width}.${format}`;   // deterministik: HTML burada, dosya Image() ile aynı adla yazılır
    const gen = [...new Set(genislikler.filter((w) => w <= kw))];                          // büyütme yok
    if (!gen.length) gen.push(kw);
    const secenek = {
      widths: gen, formats: ['avif', 'webp'], filenameFormat: dosyaAdi,
      outputDir: path.join(this.eleventy?.directories?.output || '_site', 'assets/v1/img/'), urlPath: '/assets/v1/img/',
      cacheOptions: { duration: '1d', directory: '.cache' },
    };
    bekleyenGorseller.push(Image(kaynak, secenek));
    const meta = {};
    for (const [format, tip] of [['avif', 'image/avif'], ['webp', 'image/webp']]) {
      meta[format] = gen.map((width) => {
        const url = `/assets/v1/img/${dosyaAdi(null, null, width, format)}`;
        return { format, width, height: Math.round((kh * width) / kw), url, sourceType: tip, srcset: `${url} ${width}w` };
      });
    }
    return Image.generateHTML(meta, { alt, sizes, loading: yukleme, decoding: 'async' });
  });
  eleventyConfig.on('eleventy.after', async () => { await Promise.all(bekleyenGorseller.splice(0)); });

  eleventyConfig.setServerOptions({ showVersion: false });

  return {
    dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' },
    templateFormats: ['njk', 'md', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
