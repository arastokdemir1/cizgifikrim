// V6.1 /tr/urunler/ katalog verisi (Frontend-2): tüm projeler tek düzende, duruma göre gruplar (one_cikan düzende kullanılmaz). Kaynak: src/_data/projeler.json.
const SIRA = ['Yayında', "App Store'da", 'Geliştiriliyor', 'Ar-Ge', 'Bakımda'];
const liste = (d) => (Array.isArray(d) ? d : []).filter((x) => x && x.slug && x.ad);
// Kart görselinin nasıl gösterileceği: App Store mağaza görseli çerçevesiz (tanitim), gerçek uygulama ekranı telefon çerçevesinde, diğeri fotoğraf, yoksa levha.
function kartTur(p, boyut) {
  if (!p.kart_gorsel) return 'plaka';
  const o = (boyut || {})[p.kart_gorsel];
  const telefonBoyu = o ? o[0] / o[1] < 0.6 : false; // yalnız ekran oranındaki görsel telefon/tanıtım olabilir
  const turler = (p.bolumler || []).map((b) => b.tur);
  const ayni = (p.bolumler || []).find((b) => b.gorsel === p.kart_gorsel || b.sonra === p.kart_gorsel);
  if (ayni) return ayni.tur === 'oncesonra' ? 'foto' : ayni.tur;
  if (!telefonBoyu) return 'foto';
  if (turler.includes('tanitim')) return 'tanitim';
  if (turler.includes('telefon')) return 'telefon';
  return 'foto';
}
export default {
  eleventyComputed: {
    katalog: (d) => {
      const l = liste(d.projeler).map((p) => ({ ...p, kartTur: kartTur(p, d.gorselBoyut) }));
      // V7: işletmelere yönelik ürünler (proje.kitle === 'isletme'; veri gelene kadar sanayi) en üstte tek grup, durum satırda gösterilir
      const isletme = l.filter((p) => p.kitle === 'isletme' || (!l.some((x) => x.kitle) && p.slug === 'sanayi'));
      const kalan = l.filter((p) => !isletme.includes(p));
      const adlar = [...SIRA, ...kalan.map((p) => p.durum).filter((x) => x && !SIRA.includes(x))];
      const gruplar = [...new Set(adlar)].map((ad) => ({ ad, projeler: kalan.filter((p) => p.durum === ad) })).filter((g) => g.projeler.length);
      const durumsuz = kalan.filter((p) => !p.durum);
      if (durumsuz.length) gruplar.push({ ad: 'Diğer', projeler: durumsuz });
      if (isletme.length) gruplar.unshift({ ad: 'İşletmeler için', projeler: isletme, durumGoster: true });
      return { gruplar };
    },
  },
};
