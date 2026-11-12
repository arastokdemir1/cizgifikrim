// Yapay zekâ ve otomasyon detay sayfası: JSON-LD (BreadcrumbList + Service + FAQPage); metin kaynağı _data/hizmetDetay.js.
import { hizmetJsonld } from './hizmet-jsonld.js';
export default { eleventyComputed: { jsonld: (data) => hizmetJsonld(data.hizmetDetay.yapayZeka) } };
