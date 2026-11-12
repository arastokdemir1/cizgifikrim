// /nasil-calisiyoruz/ verisi (sahip: Frontend-2). Metin: icerik_ortak PART H1 (çelişkide H > G > F > C). Süre/fiyat yok.
import home from './index.11tydata.js';
const detay = [
  { yapariz: 'Ne istediğinizi, neyi kısıtlamak gerektiğini ve ürünü kimin kullanacağını dinleriz; ihtiyacı yazıya geçiririz.', teslim: 'Görüşme özeti ve sorular.', sizden: 'Fikir ya da iş tanımı; varsa mevcut ürün ve beğendiğiniz örnekler.',
    soru: 'Görüşmeye hazırlanmam gerekir mi?', cevap: 'Hayır; bir fikir ya da sorun yeterli, gerisini birlikte netleştiririz.' },
  { yapariz: "Neyin hangi sırayla yapılacağını yazıya geçiririz. Web'de sayfalar ve içerik, mobilde ekranlar ve veri, yapay zekâda girdi, çıktı ve insan kontrol adımı.", teslim: 'Yazılı kapsam ve teklif; teslim koşulları bunda netleşir.', sizden: 'Öncelikler ve onay.',
    soru: 'Kapsam sonradan değişir mi?', cevap: 'Teklifte yazılmayan iş kapsam dışıdır; kapsam değişirse teklifi birlikte güncelleriz.' },
  { yapariz: 'Ara çıktılar ve ara sürümlerle ilerleriz; ilerlemeyi sizinle paylaşırız.', teslim: 'Gözden geçirebileceğiniz çalışan sürümler.', sizden: 'Geri bildirim.',
    soru: 'Yapım sırasında ne görürüm?', cevap: 'Ara çıktıları ve çalışan sürümleri; geri bildirimlerinizi geri bildirim turlarında alırız.' },
  { yapariz: "Ürünü yayına alırız (web'de alan adı ve yayın, mobilde mağaza hazırlığı ve yayın); kullanım ve bakım notunu veririz.", teslim: 'Yayında çalışan ürün ve kullanım/bakım notu.', sizden: 'Son onay; mobilde mağaza hesabı bilgileri.',
    soru: 'Yayından sonra ne olur?', cevap: 'Bakım ve geliştirme kapsamı teklifte ayrıca yazılır.' },
];
const adimlar = home.adimlar.map((a, i) => ({ ...a, ...detay[i] }));
const hizmeteGore = {
  basliklar: [
    { ad: 'Web sitesi ve e-ticaret', href: '/hizmetler/web-sitesi-ve-e-ticaret/' },
    { ad: 'Mobil uygulama', href: '/hizmetler/mobil-uygulama/' },
    { ad: 'Yapay zekâ ve otomasyon', href: '/hizmetler/yapay-zeka-ve-otomasyon/' },
  ],
  satirlar: [
    ['Görüşme', 'Hedef ve kitle', 'Fikir ve kullanıcı', 'Sorun ve karar noktası'],
    ['Kapsam', 'Sayfalar ve içerik', 'Ekranlar ve veri', 'Girdi, çıktı ve insan kontrol adımı'],
    ['Yapım', 'Ara çıktılar', 'Ara sürümler', 'Çalışan sürüm, ara çıktılar'],
    ['Yayın', 'Alan adı ve yayın', 'Mağaza hazırlığı ve yayın', 'Kullanım ve bakım notu'],
  ],
};
const sss = [
  home.sss[0],
  ['Ne kadar sürer?', 'Kapsama bağlıdır; süreyi görüşmede netleştiririz.'],
  ['Fiyat nasıl belirlenir?', 'Kapsama göre, yazılı teklifle.'],
  ['Birden fazla hizmeti birlikte alabilir miyim?', 'Evet; kapsam teklifte birlikte yazılır.'],
];
export default {
  adimlar, hizmeteGore, ilkeler: home.ilkeler, kunye: home.kunye, sss,
  eleventyComputed: {
    jsonld: (d) => [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Nasıl çalışıyoruz', item: d.site.url + '/nasil-calisiyoruz/' }] },
      { '@type': 'FAQPage', mainEntity: d.sss.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  },
};
