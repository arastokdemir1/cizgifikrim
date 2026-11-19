// V6 proje sergi sayfası verisi (Frontend-2): src/_data/projeler.json'daki her proje için /tr/urunler/<slug>/ (proje.njk).
// Üstte "← Ürünler" + müze etiketi; ardından bölümler (görsel | metin, sırayla sol/sağ; dar ekranda görsel üstte); altta önceki/sonraki + iletişim.
const KOK = '/tr/urunler/';
const liste = (d) => (Array.isArray(d) ? d : []).filter((x) => x && x.slug && x.ad);
const nokta = (s) => (s || '').trim().replace(/[.。]+$/, '');
const kucukBas = (s) => (s && /^\p{Lu}\p{Ll}/u.test(s) ? s[0].toLocaleLowerCase('tr') + s.slice(1) : s || '');

// SEO açıklaması 120–155 karakter: proje.aciklama varsa o; yoksa yalnız sayfadaki olgulardan kurulur.
function aciklama(p) {
  if (p.aciklama) return p.aciklama;
  let s = `${p.ad}: ${kucukBas(nokta(p.ne))}.`;
  if (s.length > 155) return s.slice(0, 154).replace(/\s+\S*$/, '').replace(/[,;:·]$/, '') + '…';
  const ekler = [`Durum: ${p.durum}.`, p.platform ? `Platform: ${p.platform}.` : ''].filter(Boolean);
  for (const ek of ekler) if ((s + ' ' + ek).length <= 155) s += ' ' + ek;
  if (s.length < 120) {
    const dolgu = ['CizgiFikrim projeleri arasında; tüm ürünleri Ürünler sayfasında görebilirsiniz.', 'CizgiFikrim ürün ve proje sergisi.', 'CizgiFikrim projesi.'];
    const uyan = dolgu.find((d) => (s + ' ' + d).length <= 155);
    if (uyan) s += ' ' + uyan;
  }
  return s;
}

// Sergi bölümleri: plaka bölümünde müze etiketini tekrar eden başlık ("ne" ile aynı) ve "Durum: X." öneki gösterilmez.
// Panel (V5 ürün bloklarındaki yüzey paneli): telefon, App Store görseli ve dikey (en<boy) görseller açık yüzey panelinde ortalanır; geniş görseller sütunu kendisi doldurur.
function dar(b, tur, boyut) {
  if (tur === 'telefon' || tur === 'tanitim' || tur === 'demo') return true;
  const o = (boyut || {})[b.sonra || b.gorsel];
  return !!(o && o[0] / o[1] < 1);
}
function bolumler(p, boyut) {
  return (p.bolumler || []).map((b) => {
    const tur = b.tur || (b.gorsel ? 'foto' : 'plaka');
    if (tur !== 'plaka') return { ...b, tur, pano: dar(b, tur, boyut) };
    const baslik = nokta(b.baslik) && nokta(b.baslik) !== nokta(p.ne) ? b.baslik : '';
    const metin = (b.metin || '').replace(new RegExp('^\\s*Durum:\\s*' + (p.durum || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.?\\s*'), '').trim();
    return { ...b, tur, baslik, metin };
  });
}

export default {
  layout: 'layouts/v5.njk',
  pagination: { data: 'projeler', size: 1, alias: 'p', before: liste, addAllPagesToCollections: true },
  permalink: KOK + '{{ p.slug }}/',
  kok: KOK,
  v5Sayfa: 'urunler',
  v5MainSinif: 'v6p',
  v5Css: ['v6-proje'],
  eleventyComputed: {
    title: (d) => `${d.p.ad} | CizgiFikrim`,
    description: (d) => aciklama(d.p),
    og: (d) => d.p.og || '/assets/v1/img/og/tr-products.png',
    sergi: (d) => bolumler(d.p, d.gorselBoyut),
    // canlı demo bölümü varsa ölçekli iframe betiği yüklenir
    v5Js: (d) => ((d.p.bolumler || []).some((b) => b.tur === 'demo') ? ['v6-demo'] : []),
    // detay: başlık + metin ya da liste; boş satırlar atlanır
    // müze etiketindeki cümleyi aynen tekrar eden satır (ör. "Ne") gösterilmez
    detay: (d) => (Array.isArray(d.p.detay) ? d.p.detay : []).filter((x) => x && x.baslik && ((x.metin && String(x.metin).trim()) || (Array.isArray(x.liste) && x.liste.length))).filter((x) => x.liste || nokta(x.metin) !== nokta(d.p.ne)),
    // Görseli olmayan proje: tüm bölümler başlıksız levha ise müze etiketinin kendisi levha olur (ad tekrar edilmez), levha metinleri etikete not olarak eklenir.
    levha: (d) => { const b = bolumler(d.p); return b.length === 0 || b.every((x) => x.tur === 'plaka' && !x.baslik); },
    kunyeSayisi: (d) => [d.p.platform, d.p.durum, d.p.yil, d.p.baglanti && d.p.baglanti.url, d.p.cip].filter(Boolean).length,
    levhaNot: (d) => bolumler(d.p).filter((x) => x.tur === 'plaka' && !x.baslik && x.metin).map((x) => x.metin),
    komsu: (d) => {
      const l = liste(d.projeler); const n = l.length; const i = l.findIndex((x) => x.slug === d.p.slug);
      if (n < 2 || i < 0) return null;
      return { onceki: l[(i - 1 + n) % n], sonraki: l[(i + 1) % n] };
    },
  },
};
