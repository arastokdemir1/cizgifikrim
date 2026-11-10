// /hizmetler/ verisi (sahip: Frontend-2). Metin: icerik_ortak.md PART C5 (B4 yapısı; çelişkide C kazanır). Süre/fiyat yok.
import home from '../index.11tydata.js';
const bloklar = [
  { slug: 'web-sitesi-ve-e-ticaret', anahtar: 'web', ad: 'Web sitesi ve e-ticaret', sahne: 's2a', tema: 'light',
    giris: 'İşinizi anlatan, hızlı açılan, telefonda düzgün çalışan bir web sitesi ya da satış akışı. Gösterişten önce okunurluk ve hız.',
    kime: 'Hizmetini ya da ürününü internette göstermek ve satmak isteyen işletmeler ve girişimler.',
    teslim: ['Tasarım ve yapım', 'Telefonda hızlı açılma ve erişilebilirlik', 'Alan adı ve yayın kurulumu', 'Temel arama (SEO) hazırlığı: başlıklar, açıklamalar, site haritası', 'Yayın sonrası destek; kapsamı teklifte ayrıca yazılır'],
    nasil: 'Görüşmede hedefi ve kitleyi, kapsamda sayfaları ve içeriği yazıya geçiririz; ara çıktılarla yapar, alan adı ve yayınla tamamlarız.',
    ornek: [{ onek: 'Örnek iş:', link: [{ ad: 'Vesira', href: '/calismalar/vesira/' }, { ad: 'PolishReel', href: 'https://polishreel.com', dis: true }], son: 'web siteleri' }] },
  { slug: 'mobil-uygulama', anahtar: 'mobil', ad: 'Mobil uygulama', sahne: 's2b', tema: 'dark',
    giris: 'Fikirden App Store yayınına iOS uygulaması. Tasarım, geliştirme, veri altyapısı ve mağaza süreci tek elde.',
    kime: 'Fikrini mağazada yayınlamak isteyen girişimler ve işletmeler.',
    teslim: ['Arayüz tasarımı', 'iOS uygulaması (SwiftUI)', 'Gerekirse CarPlay, widget gibi sistem entegrasyonları', 'App Store hazırlığı ve yayın', 'Yayın sonrası destek; kapsamı teklifte ayrıca yazılır'],
    nasil: 'Görüşmede fikri ve kullanıcıyı, kapsamda ekranları ve veriyi yazıya geçiririz; ara sürümlerle yapar, mağaza hazırlığı ve yayınla tamamlarız.',
    ornek: [{ onek: 'Örnek iş:', link: [{ ad: 'CarLog', href: '/calismalar/carlog/' }], son: '' }] },
  { slug: 'yapay-zeka-ve-otomasyon', anahtar: 'yapay-zeka', ad: 'Yapay zekâ ve otomasyon', sahne: 's2c', tema: 'light',
    giris: 'Tekrar eden işi azaltan asistanlar ve araçlar. Yapay zekâyı sihir değil, denetlenebilir bir mühendislik bileşeni olarak kurarız; karar insanda kalır.',
    kime: 'Tekrar eden işleri azaltmak ya da yapay zekâyı ürününe katmak isteyen ekipler.',
    teslim: ['Sorunun yazılı tanımı', 'Çalışan asistan, otomasyon akışı ya da araç', 'İnsan kontrol adımı', 'Kullanım ve bakım notu'],
    nasil: 'Önce sorunu ve insanın nerede karar verdiğini yazarız; çalışan bir sürümü ara çıktılarla geliştirir, kullanım notuyla teslim ederiz.',
    ornek: [{ onek: 'Örnek iş:', link: [{ ad: 'Vesira', href: '/calismalar/vesira/' }], son: '' }] },
];
const yonlendirici = [
  { soru: 'İşinizi internette göstermek ve satmak istiyorsanız', cevap: 'Web sitesi ve e-ticaret', href: '/hizmetler/web-sitesi-ve-e-ticaret/' },
  { soru: 'Fikrinizi mağazada yayınlamak istiyorsanız', cevap: 'Mobil uygulama', href: '/hizmetler/mobil-uygulama/' },
  { soru: 'Tekrar eden işi azaltmak istiyorsanız', cevap: 'Yapay zekâ ve otomasyon', href: '/hizmetler/yapay-zeka-ve-otomasyon/' },
];
const sss = [
  ...home.sss,
  ['Hangi platformlarda çalışıyorsunuz?', 'iOS ve web.'],
  ['Başka bir ekiple başlanmış işi devralır mısınız?', 'Duruma bakarız; görüşmede kodu ve durumu birlikte değerlendiririz.'],
];
export default {
  bloklar, yonlendirici, sss, adimlar: home.adimlar,
  eleventyComputed: {
    jsonld: (d) => [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Hizmetler', item: d.site.url + '/hizmetler/' }] },
      { '@type': 'FAQPage', mainEntity: d.sss.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      ...d.bloklar.map((h) => ({ '@type': 'Service', name: h.ad, description: h.giris, provider: { '@id': d.site.url + '/#org' }, url: d.site.url + '/hizmetler/' + h.slug + '/' })),
    ],
  },
};
