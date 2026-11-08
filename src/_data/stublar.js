// PLATFORM=gh için 'taşındı' stub dosyalarının listesi (etkin liste: yonlendirmeler.js). cf modunda boş: stub üretilmez.
import veri from './yonlendirmeler.js';
const gh = (process.env.PLATFORM || 'gh').toLowerCase() === 'gh';
export default gh
  ? [...new Map(veri.map((r) => {
      const dosya = r.from.endsWith('/') ? r.from + 'index.html' : r.from; // /tr/ ile /tr/index.html aynı dosya
      return [dosya, { dosya, to: r.to, dis: /^https?:\/\//.test(r.to) }];
    })).values()]
  : [];
