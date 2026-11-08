// PLATFORM=gh için 'taşındı' stub dosyalarının listesi (redirects.json'dan). cf modunda boş: stub üretilmez.
import fs from 'node:fs';
const veri = JSON.parse(fs.readFileSync(new URL('./redirects.json', import.meta.url), 'utf8')).redirects;
const gh = (process.env.PLATFORM || 'gh').toLowerCase() === 'gh';
export default gh
  ? [...new Map(veri.map((r) => {
      const dosya = r.from.endsWith('/') ? r.from + 'index.html' : r.from; // /tr/ ile /tr/index.html aynı dosya
      return [dosya, { dosya, to: r.to, dis: /^https?:\/\//.test(r.to) }];
    })).values()]
  : [];
