// Ana sayfa verisi (sahip: Frontend-2). Metin kaynağı: faz1/icerik_ortak.md PART E1 (çelişkide PART E kazanır) + PART C. adimlar/ilkeler/kunye/sss başka sayfalarca da kullanılır. Ana sayfada proje/ürün adı, mağaza rozeti, "kendi ürünlerimiz" YOK.
const hizmetler = [
  { slug: 'web-sitesi-ve-e-ticaret', ad: 'Web sitesi ve e-ticaret', sahne: 's2a', cumle: 'İşinizi anlatan, hızlı açılan, telefonda düzgün çalışan bir web sitesi ya da satış akışı.',
    maddeler: ['Tasarım ve yapım', 'Yayın ve alan adı kurulumu', 'Temel arama (SEO) hazırlığı'] },
  { slug: 'mobil-uygulama', ad: 'Mobil uygulama', sahne: 's2b', cumle: 'Fikirden App Store yayınına iOS uygulaması.',
    maddeler: ['Tasarım ve geliştirme', 'Mağaza hazırlığı ve yayın', 'Yayın sonrası destek'] },
  { slug: 'yapay-zeka-ve-otomasyon', ad: 'Yapay zekâ ve otomasyon', sahne: 's2c', cumle: 'Tekrar eden işi azaltan asistanlar ve araçlar; karar insanda kalır.',
    maddeler: ['Sorunun yazılı tanımı', 'Çalışan asistan/araç', 'Kullanım ve bakım notu'] },
];
const adimlar = [
  { ad: 'Görüşme', metin: 'Ne istediğinizi, neyi kısıtlamak gerektiğini ve ürünü kimin kullanacağını konuşuruz.', sema: 's3-1', etiket: 'GÖRÜŞME' },
  { ad: 'Kapsam ve teklif', metin: 'Neyin hangi sırayla yapılacağı yazıya geçer; teslim koşulları yazılı teklifte netleşir.', sema: 's3-2', etiket: 'KAPSAM' },
  { ad: 'Yapım', metin: 'Yapım sürerken ilerlemeyi ve ara çıktıları sizinle paylaşırız.', sema: 's3-3', etiket: 'YAPIM' },
  { ad: 'Yayın ve sonrası', metin: 'Ürün yayına alınır; bakım ve geliştirme kapsamı teklifte ayrıca yazılır.', sema: 's3-4', etiket: 'YAYIN' },
];
const adimOzet = ['Ne istediğinizi dinleriz.', 'Neyin hangi sırayla yapılacağını yazıya geçiririz.', 'İlerlemeyi ve ara çıktıları paylaşarak üretiriz.', 'Ürünü yayına alırız; bakım kapsamı teklifte yazılır.'];
const ilkeler = [
  { ad: 'Önce sorunu yazarız.', metin: 'Teknoloji, yazılı bir ihtiyacın aracıdır; kendi başına hedef değildir.', ikon: 'ikon-ilke1' },
  { ad: 'Bildiğimizi bilmediğimizden ayırırız.', metin: 'Durum, test ve olgunluk iddialarını ayrı tutarız; belirsizliği saklamayız.', ikon: 'ikon-ilke2' },
  { ad: 'Karar insanda kalır.', metin: 'Karar destek akışlarında yetki ve bağlam kullanıcıdadır.', ikon: 'ikon-ilke3' },
];
const kunye = [
  ['Kapsam', 'Görüşmede yazılı olarak belirlenir.'],
  ['Teslim', 'Çalışan ürün ve yayın; kullanım ve bakım notu.'],
  ['İletişim', 'Yapım boyunca ara çıktılar paylaşılır.'],
  ['Destek', 'Yayın sonrası bakım ve geliştirme kapsamı teklifte ayrıca yazılır.'],
];
const teknoloji = ['Swift', 'SwiftUI', 'Next.js', 'React', 'PostgreSQL', 'Supabase', 'Cloudflare', 'Yapay zekâ modelleri'];
const sss = [
  ['Nasıl başlarız?', 'Ücretsiz keşif görüşmesi ayırın ya da formu doldurun. Kısa bir görüşmede ne istediğinizi dinler, nasıl yapılacağını söyleriz.'],
  ['Fiyat nasıl belirlenir?', 'Kapsama göre, yazılı teklifle. Fiyat ve takvim görüşmede işinize göre netleşir.'],
  ['Ne kadar sürer?', 'Kapsama bağlıdır; süreyi görüşmede netleştiririz.'],
  ['Yayından sonra destek var mı?', 'Evet. Bakım ve geliştirme kapsamı teklifte ayrıca yazılır.'],
  ['Yapay zekâ kullanıyor musunuz?', 'Gerektiği yerde, denetlenebilir bir bileşen olarak. Yapay zekâyı sihir değil, mühendislik parçası olarak görürüz; sonucu insan kontrol eder.'],
  ['Verilerim ne olur?', 'Yalnız talebinizi yanıtlamak için kullanılır. Ayrıntılar gizlilik sayfasında.'],
];
export default {
  hizmetler, adimlar, adimOzet, ilkeler, kunye, teknoloji, sss,
  eleventyComputed: {
    // Ana sayfada SSS görünmez (v0.8): FAQPage yapılandırılmış verisi yok; yalnız hizmetler.
    jsonld: (d) => d.hizmetler.map((h) => ({ '@type': 'Service', name: h.ad, description: h.cumle, provider: { '@id': d.site.url + '/#org' }, url: d.site.url + '/hizmetler/' + h.slug + '/' })),
  },
};
