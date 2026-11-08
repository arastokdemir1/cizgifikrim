// Etkin yönlendirme listesi: redirects.json + site.json bayrakları.
// istasyon:true olan kuralların hedefi İstasyon canlı olana dek geçici /istasyon-yakinda/ sayfasıdır (kırık link olmaz).
import fs from 'node:fs';
const oku = (ad) => JSON.parse(fs.readFileSync(new URL(ad, import.meta.url), 'utf8'));
const site = oku('./site.json');
const { redirects } = oku('./redirects.json');
export default redirects.map((r) => ({
  ...r,
  to: r.istasyon ? (site.istasyonCanli ? `${site.istasyonUrl}/` : '/istasyon-yakinda/') : r.to,
}));
