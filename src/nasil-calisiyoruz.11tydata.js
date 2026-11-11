// /nasil-calisiyoruz/ verisi (sahip: Frontend-2). Metin: icerik_ortak B1.5 + C1.4/C1.5; adım ayrıntıları tasarim_sartnamesi_2 §8 (Teknik-1). Süre/fiyat yok.
import home from './index.11tydata.js';
const detay = [
  { yapariz: 'Ne istediğinizi, kimin kullanacağını ve neyi kısıtlamak gerektiğini dinleriz.', teslim: 'Görüşme özeti.', sizden: 'Hedef ve bildiğiniz kısıtlar.' },
  { yapariz: 'Neyin hangi sırayla yapılacağını yazıya geçiririz.', teslim: 'Yazılı kapsam ve teklif.', sizden: 'Onay ve içerik/erişim.' },
  { yapariz: 'İlerlemeyi ve ara çıktıları paylaşarak üretiriz.', teslim: 'Düzenli ara çıktılar.', sizden: 'Geri bildirim.' },
  { yapariz: 'Ürünü yayına alırız.', teslim: 'Yayında çalışan ürün ve kullanım/bakım notu.', sizden: 'Son onay. Bakım ve geliştirme kapsamı teklifte ayrıca yazılır.' },
];
const adimlar = home.adimlar.map((a, i) => ({ ...a, ...detay[i] }));
const sss = [home.sss[0], home.sss[2], home.sss[1], home.sss[3]];
export default {
  adimlar, ilkeler: home.ilkeler, kunye: home.kunye, sss,
  eleventyComputed: {
    jsonld: (d) => [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Nasıl çalışıyoruz', item: d.site.url + '/nasil-calisiyoruz/' }] },
      { '@type': 'FAQPage', mainEntity: d.sss.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  },
};
