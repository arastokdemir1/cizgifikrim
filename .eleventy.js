// CizgiFikrim vitrin: Eleventy 3 yapılandırması (altyapı sahibi: Frontend-1, S0-B).
// Girdi: src/ (yeni vitrin). Çıktı: _site/.
// Eski klasörler (sanayi, piyasa, carlog, sano, zihinustasi, p, demo, baupilotaj, CNAME, ikonlar) BAYT AYNEN kopyalanır:
// işlenmez, küçültülmez, başlık/betik eklenmez. scripts/kontrol-passthrough.mjs bunu origin/main ile SHA-256 karşılaştırır.
import { execFileSync } from 'node:child_process';
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
  eleventyConfig.addFilter('mutlakUrl', (yol, site) => (/^https?:\/\//.test(yol) ? yol : site.url + yol));

  // ── Görsel işleme: AVIF + WebP, width/height, alt ZORUNLU ──────────────
  // Kullanım: {% gorsel "src/assets/img/ornek.jpg", "Açıklama", "(min-width: 900px) 50vw, 100vw" %}
  eleventyConfig.addAsyncShortcode('gorsel', async function (kaynak, alt, sizes = '100vw', genislikler = [480, 960, 1440]) {
    if (alt === undefined || alt === null) throw new Error(`gorsel kısa kodu: alt metin zorunlu (${kaynak}). Süs görseli ise alt="" verin.`);
    const meta = await Image(kaynak, {
      widths: genislikler,                 // kaynaktan büyük çıktı üretilmez (büyütme yok)
      formats: ['avif', 'webp'],
      outputDir: path.join(this.eleventy?.directories?.output || '_site', 'assets/v1/img/'),
      urlPath: '/assets/v1/img/',
      filenameFormat: (id, src, width, format) => `${path.basename(src, path.extname(src))}-${id.slice(0, 8)}-${width}.${format}`,
      cacheOptions: { duration: '1d', directory: '.cache' },
    });
    return Image.generateHTML(meta, { alt, sizes, loading: 'lazy', decoding: 'async' });
  });

  eleventyConfig.setServerOptions({ showVersion: false });

  return {
    dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' },
    templateFormats: ['njk', 'md', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
