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

// V6.2 şablon v2 (opt-in: proje.sablon === 'v2'): ürünün kendi rengi + anlatı akışı. Kahraman = ilk manşet + hemen ardındaki görsel/telefonlar.
const parlaklik = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return 1; const n = parseInt(m[1], 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
function v2(p) {
  if (p.sablon !== 'v2' || !Array.isArray(p.anlati) || !p.anlati.length) return null;
  const r = p.renk || {};
  const zemin = r.zemin || '#0d0d0d'; const zeminKoyu = r.zemin_koyu || zemin;
  const tonA = parlaklik(zemin) > 0.4 ? 'acik' : 'koyu'; const tonK = parlaklik(zeminKoyu) > 0.4 ? 'acik' : 'koyu';
  const stil = [`--u-zemin:${zemin}`, `--u-zemin-k:${zeminKoyu}`, `--u-vurgu:${r.vurgu || '#888888'}`, `--u-mv:${r.metin_vurgu || r.vurgu || 'currentColor'}`, `--u-mv-k:${r.metin_vurgu_koyu || r.metin_vurgu || r.vurgu || 'currentColor'}`].join(';');
  const a = p.anlati.filter((x) => x && x.tur);
  let hero = null; let i = 0;
  if (a[0] && a[0].tur === 'manset') { hero = { manset: a[0], gorsel: null }; i = 1; if (a[1] && (a[1].tur === 'telefonlar' || a[1].tur === 'gorsel')) { hero.gorsel = a[1]; i = 2; } }
  const akis = [];
  for (const x of a.slice(i)) {
    const son = akis[akis.length - 1];
    if (x.tur === 'gorsel' && x.genislik === 'yarim') { if (son && son.tur === 'ikili') son.ogeler.push(x); else akis.push({ tur: 'ikili', ogeler: [x] }); }
    else akis.push(x);
  }
  return { stil, sinif: `v2--${tonA} v2-k--${tonK}`, hero, akis, demo: a.some((x) => x.tur === 'demo') };
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
    // canlı demo en değerli etkileşimli bölüm: ilk sıraya alınır (detay bloğundan hemen sonra), diğerleri kendi sırasında
    sergi: (d) => { const b = bolumler(d.p, d.gorselBoyut); return [...b.filter((x) => x.tur === 'demo'), ...b.filter((x) => x.tur !== 'demo')]; },
    // canlı demo bölümü varsa ölçekli iframe betiği yüklenir
    v2: (d) => v2(d.p),
    v5Css: (d) => (v2(d.p) ? ['v6-proje', 'v6-proje-v2'] : ['v6-proje']),
    v5MainSinif: (d) => (v2(d.p) ? 'v6p v6p2' : 'v6p'),
    v5Js: (d) => (((v2(d.p) ? d.p.anlati : d.p.bolumler) || []).some((b) => b && b.tur === 'demo') ? ['v6-demo'] : []),
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
