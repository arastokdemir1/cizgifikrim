// /hizmetler/ verisi (sahip: Frontend-2). Metin: icerik_ortak.md PART G1 (çelişkide G > F > C). Süre/fiyat yok.
import home from '../index.11tydata.js';
const bloklar = [
  { slug: 'web-sitesi-ve-e-ticaret', anahtar: 'web', ad: 'Web sitesi ve e-ticaret', sahne: 's2a', tema: 'dark',
    kime: 'Hizmetini ya da ürününü internette göstermek ve satmak isteyen işletmeler ve girişimler.',
    teslim: ['Tasarım ve yapım', 'Telefonda hızlı açılma ve erişilebilirlik', 'Alan adı ve yayın kurulumu', 'Temel arama (SEO) hazırlığı'],
    nasil: 'Görüşmede hedefi ve kitleyi, kapsamda sayfaları ve içeriği yazıya geçiririz; ara çıktılarla yapar, alan adı ve yayınla tamamlarız.' },
  { slug: 'mobil-uygulama', anahtar: 'mobil', ad: 'Mobil uygulama', sahne: 's2b', tema: 'light',
    kime: 'Fikrini mağazada yayınlamak isteyen girişimler ve işletmeler.',
    teslim: ['Arayüz tasarımı', 'iOS uygulaması (SwiftUI)', 'Veri ve altyapı', 'Mağaza hazırlığı ve yayın'],
    nasil: 'Görüşmede fikri ve kullanıcıyı, kapsamda ekranları ve veriyi yazıya geçiririz; ara sürümlerle yapar, mağaza hazırlığı ve yayınla tamamlarız.' },
  { slug: 'yapay-zeka-ve-otomasyon', anahtar: 'yapay-zeka', ad: 'Yapay zekâ ve otomasyon', sahne: 's2c', tema: 'dark',
    kime: 'Tekrar eden işleri azaltmak ya da yapay zekâyı ürününe katmak isteyen ekipler.',
    teslim: ['Sorunun yazılı tanımı', 'Çalışan asistan, otomasyon akışı ya da araç', 'İnsan kontrol adımı', 'Kullanım ve bakım notu'],
    nasil: 'Önce sorunu ve insanın nerede karar verdiğini yazarız; çalışan bir sürümü ara çıktılarla geliştirir, kullanım notuyla teslim ederiz.' },
];
const yonlendirici = [
  { soru: 'Hizmetinizi ya da ürününüzü internette göstermek ve satmak istiyorsunuz', cevap: 'Web sitesi ve e-ticaret', href: '/hizmetler/web-sitesi-ve-e-ticaret/' },
  { soru: 'Fikrinizi mağazada yayınlanan bir uygulamaya çevirmek istiyorsunuz', cevap: 'Mobil uygulama', href: '/hizmetler/mobil-uygulama/' },
  { soru: 'Tekrar eden bir işi azaltmak ya da ürününüze yapay zekâ katmak istiyorsunuz', cevap: 'Yapay zekâ ve otomasyon', href: '/hizmetler/yapay-zeka-ve-otomasyon/' },
];
const ortak = [
  ['Yazılı kapsam ve teklif', 'Neyin hangi sırayla yapılacağı yazıya geçer.'],
  ['Ara çıktılar', 'Yapım sürerken ilerlemeyi sizinle paylaşırız.'],
  ['Kullanım ve bakım notu', 'Teslim edilen şeyin nasıl çalıştığı ve nasıl bakılacağı yazılır.'],
  ['Yayın sonrası destek', 'Bakım ve geliştirme kapsamı teklifte ayrıca yazılır.'],
];
const sss = [
  ['Nasıl başlarız?', 'Ücretsiz keşif görüşmesi ayırın ya da formu doldurun. Kısa bir görüşmede ne istediğinizi dinler, nasıl yapılacağını söyleriz.'],
  ['Hangi hizmet bana uygun?', 'Emin değilseniz görüşmede ihtiyacınızı birlikte netleştiririz.'],
  ['Birden fazla hizmeti birlikte alabilir miyim?', 'Evet; kapsam teklifte birlikte yazılır.'],
  ['Ne kadar sürer?', 'Kapsama bağlıdır; süreyi görüşmede netleştiririz.'],
  ['Fiyat nasıl belirlenir?', 'Kapsama göre, yazılı teklifle.'],
  ['Yayından sonra destek var mı?', 'Evet. Kapsamı teklifte ayrıca yazılır.'],
  ['Yapay zekâ kullanıyor musunuz?', 'Gerektiği yerde, denetlenebilir bir bileşen olarak; sonucu insan kontrol eder.'],
  ['Verilerim ne olur?', 'Yalnız talebinizi yanıtlamak için kullanılır. Ayrıntılar gizlilik sayfasında.'],
];
export default {
  bloklar, yonlendirici, ortak, sss, adimlar: home.adimlar,
  eleventyComputed: {
    jsonld: (d) => [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Hizmetler', item: d.site.url + '/hizmetler/' }] },
      { '@type': 'FAQPage', mainEntity: d.sss.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      ...d.bloklar.map((h) => ({ '@type': 'Service', name: h.ad, description: h.kime, provider: { '@id': d.site.url + '/#org' }, url: d.site.url + '/hizmetler/' + h.slug + '/' })),
    ],
  },
};
