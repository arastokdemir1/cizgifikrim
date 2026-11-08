// Gezinme verisi. "Giriş" bağlantısı yalnız İstasyon canlıyken (site.json istasyonCanli) vardır; aksi halde nav.giris = null
// ve menü ile footer şablonları bağlantıyı göstermez ({% if nav.giris %}).
import fs from 'node:fs';
const site = JSON.parse(fs.readFileSync(new URL('./site.json', import.meta.url), 'utf8'));
export default {
  ana: [
    { etiket: 'Çalışmalar', href: '/calismalar/' },
    { etiket: 'Hizmetler', href: '/hizmetler/' },
    { etiket: 'Hakkında', href: '/hakkinda/' },
    { etiket: 'Görüşme', href: '/gorusme/' },
  ],
  cta: { etiket: 'Ücretsiz keşif görüşmesi', href: '/gorusme/' },
  giris: site.istasyonCanli ? { etiket: 'Giriş', href: site.istasyonUrl, dis: true } : null,
  alt: { yasal: [{ etiket: 'Gizlilik', href: '/gizlilik/' }, { etiket: 'Koşullar', href: '/kosullar/' }] },
};
