// Hizmet detay sayfaları verisi (mobil uygulama, yapay zekâ ve otomasyon): şablon partials/hizmet-detay.njk.
// Metin kaynağı: icerik_ortak B4 4.2/4.3 + PART C9 (onaylı "Nasıl çalışırız" cümleleri; /hizmetler/ ile aynı dil), tasarim_sartnamesi_2 §6.
// Kurallar: süre aralığı/fiyat/sıralama sözü yok; telefon/CarPlay/widget imgesi yok; projeye yalnız metin linki; "Yayın sonrası destek" kapsamı teklifte yazılır.
const adimIkon = {
  gorusme: '<path d="M6 9h20a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H17l-6 5v-5H6a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3z" class="l"/><path d="M10 15h14M10 19h8" class="l"/>',
  kapsam: '<rect x="7" y="4" width="26" height="32" rx="6" class="l"/><path d="M13 13h14M13 20h14M13 27h8" class="l"/>',
  yapim: '<path d="M20 5l15 8-15 8L5 13z" class="l"/><path d="M5 20l15 8 15-8M5 27l15 8 15-8" class="l"/>',
  yayin: '<circle cx="20" cy="20" r="15" class="l"/><path d="M5 20h30M20 5c-8 8-8 22 0 30M20 5c8 8 8 22 0 30" class="l"/>',
};
const ikonlar = {
  tasarim: '<rect x="6" y="6" width="28" height="28" rx="8" class="l"/><path d="M6 16h28M16 16v18" class="l"/>',
  gelistirme: '<path d="M14 12L5 20l9 8M26 12l9 8-9 8M23 8l-6 24" class="l"/>',
  yayin: '<path d="M20 5v22M12 13l8-8 8 8" class="l"/><path d="M7 29v4a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2v-4" class="l"/>',
  karar: '<circle cx="20" cy="14" r="7" class="l"/><path d="M7 35c0-8 6-12 13-12s13 4 13 12" class="l"/>',
  denetim: '<circle cx="18" cy="18" r="11" class="l"/><path d="M26 26l9 9M13 18l4 4 7-8" class="l"/>',
  kontrol: '<path d="M8 20l8 8L33 11" class="l"/><rect x="4" y="4" width="32" height="32" rx="9" class="l"/>',
};
const adimlar = (a) => a.map((x, i) => ({ ad: x[0], metin: x[1], satirlar: x[2], ikon: adimIkon[['gorusme', 'kapsam', 'yapim', 'yayin'][i]] }));
const NASIL = 'Nasıl başlarız?';
const BASLA = 'Ücretsiz keşif görüşmesi ayırın ya da formu doldurun. Kısa bir görüşmede ne istediğinizi dinler, nasıl yapılacağını söyleriz.';
const SURE = ['Ne kadar sürer?', 'Kapsama bağlıdır; süreyi görüşmede netleştiririz.'];
const FIYAT = ['Fiyat nasıl belirlenir?', 'Kapsama göre, yazılı teklifle.'];
const DESTEK = ['Yayından sonra destek var mı?', 'Evet. Kapsamı teklifte ayrıca yazılır.'];

export default {
  mobil: {
    slug: 'mobil-uygulama', ad: 'Mobil', vurgu: 'uygulama', sema: 's2b-detay', kirinti: 'Mobil uygulama',
    baslik: 'Mobil uygulama — iOS uygulaması | CizgiFikrim',
    aciklama: 'Fikirden App Store yayınına iOS uygulaması: tasarım, geliştirme, veri altyapısı ve mağaza süreci tek elde. Ücretsiz keşif görüşmesi ayırın.',
    lead: 'Fikirden App Store yayınına iOS uygulaması. Tasarım, geliştirme, veri altyapısı ve mağaza süreci tek elde.',
    ek: 'Uygulamayı tek elden yürütürüz: arayüz, veri ve mağaza süreci birlikte ilerler. Önce kullanıcının ne yapacağını yazarız, sonra yaparız.',
    etiketler: ['Tasarım', 'Geliştirme', 'Yayın'],
    notlar: ['Arayüz tasarımı', 'Veri katmanı', 'Sistem entegrasyonu', 'Mağaza yayını'],
    kime: 'Fikrini mağazada yayınlamak isteyen girişimler ve işletmeler.',
    kimeEk: 'Elinizde net bir ürün fikri de olabilir, yalnızca bir başlangıç noktası da. İkisinde de önce ihtiyacı ve kullanıcıyı yazıya geçiririz; sonra neyin ilk sürümde olacağını birlikte belirleriz.',
    profiller: [
      ['Fikrini ilk ürüne çevirmek isteyen girişim', 'Ne yapacağını, kimin kullanacağını ve ilk sürümde nelerin olacağını netleştirip yayına taşırız.'],
      ['Mevcut işine mobil uygulama eklemek isteyen işletme', 'Müşterilerinize ya da ekibinize hizmet eden, işinizle uyumlu bir uygulama.'],
      ['Önce kapsamı netleştirmek isteyen ekip', 'Kısa bir görüşmeyle fikrin sınırlarını yazıya geçirir, ardından kapsam ve teklifi hazırlarız.'],
    ],
    teslim: [
      ['Arayüz tasarımı', 'Ekranlar, akış ve görsel dil, kullanıcının işini en az adımda yapmasına göre tasarlanır.'],
      ['iOS uygulaması (SwiftUI)', 'iPhone için çalışan uygulama.'],
      ['Veri ve altyapı', 'Verinin cihazda mı sunucuda mı duracağı ihtiyaca göre belirlenir; neyin neden tutulduğunu yazıya geçiririz.'],
      ['Sistem entegrasyonları (gerekirse)', 'Konum ve harita, bildirim, CarPlay ve widget, uygulama içi satın alma gibi. Kapsamda ne olacağı teklifte yazılır.'],
      ['Test ve yayın öncesi kontrol', 'Yayına çıkmadan önce uygulama gözden geçirilir ve düzeltilir.'],
      ['App Store hazırlığı ve yayın', 'Mağaza kaydı, gizlilik bilgileri ve sürüm gönderimi hazırlanır. Apple\'ın inceleme sonucu ve süresi bizim kontrolümüzde değildir.'],
      ['Kullanım ve bakım notu', 'Uygulamanın nasıl çalıştığını ve nasıl güncelleneceğini anlatan kısa not.'],
      ['Yayın sonrası destek', 'Bakım ve geliştirme kapsamı teklifte ayrıca yazılır.'],
    ],
    teslimNot: 'Kapsamın tamamı görüşmeden sonra yazılı teklifte netleşir; süreyi görüşmede netleştiririz.',
    nasilCumle: 'Görüşmede fikri ve kullanıcıyı, kapsamda ekranları ve veriyi yazıya geçiririz; ara sürümlerle yapar, mağaza hazırlığı ve yayınla tamamlarız.',
    adimlar: adimlar([
      ['Görüşme', 'Fikir ve kullanıcı', [['Sizden', 'fikir, kullanıcı ve varsa örnek uygulamalar.'], ['Bizden', 'sorular ve görüşme özeti.'], ['Çıktı', 'konuşulanların yazılı özeti.']]],
      ['Kapsam', 'Ekranlar ve veri', [['Sizden', 'öncelikler ve onay.'], ['Bizden', 'ekranların ve verinin listesi, ilk sürümün sınırı.'], ['Çıktı', 'yazılı kapsam ve teklif.']]],
      ['Yapım', 'Ara sürümler', [['Sizden', 'geri bildirim.'], ['Bizden', 'ara sürümler ve ilerleme paylaşımı.'], ['Çıktı', 'gözden geçirebileceğiniz çalışan sürümler.']]],
      ['Yayın', 'Mağaza hazırlığı ve yayın', [['Sizden', 'mağaza hesabı bilgileri ve son onay.'], ['Bizden', 'mağaza hazırlığı, yayın ve kullanım/bakım notu.'], ['Çıktı', 'yayın için gönderilmiş uygulama; destek kapsamı teklifteki gibidir.']]],
    ]),
    ozel: {
      kicker: 'PLATFORM VE TEKNOLOJİ', baslik: 'Platform ve <em>teknoloji</em>',
      lead: 'iOS ağırlıklı çalışıyoruz; teknolojiyi ihtiyaca göre seçeriz.',
      kartlar: [
        { ad: 'Platform', maddeler: ['iPhone için iOS uygulaması.', 'Arayüz SwiftUI ile yazılır.', 'Başka platform ihtiyacınızı görüşmede konuşuruz.'], ikon: ikonlar.tasarim },
        { ad: 'Sistem entegrasyonları', maddeler: ['Konum ve harita, bildirim.', 'CarPlay ve widget gibi sistem özellikleri.', 'Uygulama içi satın alma ve abonelik.', 'Hepsi yalnız gerektiğinde, kapsamda yazılı olarak.'], ikon: ikonlar.gelistirme },
        { ad: 'Veri ve gizlilik', maddeler: ['Veri ihtiyaca göre cihazda ya da sunucuda tutulur.', 'Neyin neden toplandığı yazıya geçirilir.', 'Gerekenden fazla kişisel veri toplanmaz.'], ikon: ikonlar.yayin },
      ],
      not: 'Teknoloji seçimini ve kapsamı teklifte yazılı olarak veririz.',
      cipler: ['Swift', 'SwiftUI'],
    },
    ornek: { onek: 'Örnek iş:', link: [{ ad: 'CarLog', href: '/calismalar/carlog/' }], cumle: 'CarLog\'u fikirden App Store yayınına kadar baştan sona biz yaptık.' },
    sss: [
      [NASIL, BASLA], SURE, FIYAT,
      ['Android da yapıyor musunuz?', 'iOS ağırlıklı çalışıyoruz; ihtiyacınızı görüşmede konuşuruz.'],
      ['App Store sürecini siz mi yönetirsiniz?', 'Mağaza hazırlığı ve yayın teslimata dahildir; kapsam teklifte yazılır. Apple\'ın inceleme sonucu ve süresi bizim kontrolümüzde değildir.'],
      ['Mağazada yayınlanacağının garantisi var mı?', 'Hayır; yayın Apple\'ın incelemesine bağlıdır. Mağaza kurallarına uygun hazırlık yaparız.'],
      DESTEK,
      ['Uygulama verilerimi nasıl kullanır?', 'Veri ihtiyaca göre tutulur; neyin neden toplandığını yazıya geçiririz. Kişisel veriyi gerekenden fazla toplamayız.'],
    ],
  },
  yapayZeka: {
    slug: 'yapay-zeka-ve-otomasyon', ad: 'Yapay zekâ ve', vurgu: 'otomasyon', sema: 's2c-detay', kirinti: 'Yapay zekâ ve otomasyon',
    baslik: 'Yapay zekâ ve otomasyon | CizgiFikrim',
    aciklama: 'Tekrar eden işi azaltan asistanlar ve araçlar: yapay zekâyı denetlenebilir bir bileşen olarak kurarız, karar insanda kalır. Ücretsiz keşif görüşmesi.',
    lead: 'Tekrar eden işi azaltan asistanlar ve araçlar. Yapay zekâyı sihir değil, denetlenebilir bir mühendislik bileşeni olarak kurarız; karar insanda kalır.',
    ek: 'Her işe aynı yerden başlarız: hangi iş tekrar ediyor, nerede insanın kararı gerekiyor? Bunu yazmadan modele geçmeyiz.',
    etiketler: ['Sorun tanımı', 'Çalışan araç', 'İnsan kontrolü'],
    notlar: ['Sorun tanımı', 'Denetlenebilir model', 'İnsan kontrolü', 'Çıktı ve geri bildirim'],
    kime: 'Tekrar eden işleri azaltmak ya da yapay zekâyı ürününe katmak isteyen ekipler.',
    kimeEk: 'Yapay zekâ her sorunun cevabı değildir. Önce işin yapay zekâ gerektirip gerektirmediğine bakarız; gerektirmiyorsa söyleriz.',
    profiller: [
      ['Tekrar eden işi azaltmak isteyen ekip', 'Düzenli yapılan, kurala bağlanabilen işleri bir asistan ya da otomasyon akışına taşırız.'],
      ['Ürününe yapay zekâ özelliği katmak isteyen girişim', 'Özelliği ürünün içine, insan kontrolüyle birlikte tasarlarız.'],
      ['Önce ne mümkün olduğunu anlamak isteyen ekip', 'Kısa bir görüşmeyle işi yazıya geçirir, yapay zekânın nerede yardımcı olabileceğini ve olamayacağını söyleriz.'],
    ],
    teslim: [
      ['Sorunun yazılı tanımı', 'Hangi iş, kim için, ne zaman yapılıyor ve başarı neye göre ölçülecek.'],
      ['Çalışan asistan, otomasyon akışı ya da araç', 'İşe uygun biçim: kurum içi asistan, otomasyon akışı ya da ürüne gömülü özellik.'],
      ['İnsan kontrol adımı', 'Kararın insanda kaldığı yer tasarlanır ve arayüze konur.'],
      ['Veri ve güvenlik sınırları', 'Hangi verinin kullanıldığı, nereye gitmediği ve kimin görebildiği yazılır.'],
      ['Sınırların tanımı', 'Aracın neyi yapabildiği ve neyi yapamadığı açıkça yazılır; belirsizlik saklanmaz.'],
      ['Deneme ve gözden geçirme', 'Gerçek örneklerle denenir, sonuçlar birlikte incelenir; doğruluk için garanti verilmez.'],
      ['Kullanım ve bakım notu', 'Nasıl kullanılacağı, nasıl izleneceği ve ne zaman insana başvurulacağı.'],
      ['Yayın sonrası destek', 'Bakım ve geliştirme kapsamı teklifte ayrıca yazılır.'],
    ],
    teslimNot: 'Kapsamın tamamı görüşmeden sonra yazılı teklifte netleşir; süreyi görüşmede netleştiririz.',
    nasilCumle: 'Önce sorunu ve insanın nerede karar verdiğini yazarız; çalışan bir sürümü ara çıktılarla geliştirir, kullanım notuyla teslim ederiz.',
    adimlar: adimlar([
      ['Görüşme', 'Sorun ve karar noktası', [['Sizden', 'işi ve nerede insanın karar verdiğini anlatmanız.'], ['Bizden', 'sorular, işin yapay zekâ gerektirip gerektirmediği.'], ['Çıktı', 'sorun ve karar noktası özeti.']]],
      ['Kapsam', 'Girdi, çıktı ve insan kontrol adımı', [['Sizden', 'örnek girdi/çıktılar ve onay.'], ['Bizden', 'girdi, çıktı ve insan kontrol adımının tanımı.'], ['Çıktı', 'yazılı kapsam ve teklif.']]],
      ['Yapım', 'Çalışan sürüm, ara çıktılar', [['Sizden', 'sonuçlar üzerinde geri bildirim.'], ['Bizden', 'çalışan sürüm ve ara çıktılar.'], ['Çıktı', 'denenebilir sürümler.']]],
      ['Yayın', 'Kullanım ve bakım notu', [['Sizden', 'son onay.'], ['Bizden', 'yayın, kullanım ve bakım notu.'], ['Çıktı', 'çalışan araç; destek kapsamı teklifteki gibidir.']]],
    ]),
    ozel: {
      kicker: 'İNSAN KONTROLÜ', baslik: 'İnsan <em>kontrolü</em>',
      lead: 'Yapay zekâ bir araçtır; karar insanda kalır.',
      kartlar: [
        { ad: 'Karar insanda kalır', maddeler: ['Karar destek akışlarında yetki ve bağlam kullanıcıdadır.', 'Kontrol adımı arayüzde görünür.', 'Önemli işlerde son onay insandan gelir.'], ikon: ikonlar.karar },
        { ad: 'Denetlenebilir yapı', maddeler: ['Modelin yanında veri, arayüz ve güvenlik sınırları birlikte tasarlanır.', 'Sonucun nereden geldiği izlenebilir tutulur.', 'Yapay zekâ "sihir" değil, mühendislik bileşenidir.'], ikon: ikonlar.denetim },
        { ad: 'Sınırları yazarız', maddeler: ['Aracın neyi yapabildiği ve neyi yapamadığı açıkça yazılır.', 'Belirsizlik saklanmaz.', 'Doğruluk ve sonuç için garanti verilmez; sonucu insan kontrol eder.'], ikon: ikonlar.kontrol },
      ],
      not: 'Veri sınırları ve kullanım ilkeleri teklifte yazılı olarak verilir.',
      cipler: [],
    },
    ornek: { onek: 'Örnek iş:', link: [{ ad: 'Vesira', href: '/calismalar/vesira/' }], cumle: 'Vesira\'nın oda fotoğrafını okuyup tasarım kararı veren yapay zekâ akışını baştan sona biz tasarlayıp geliştirdik.' },
    sss: [
      [NASIL, BASLA], SURE, FIYAT,
      ['İşimiz için yapay zekâ gerekli mi?', 'Her zaman değil. Önce işe bakar, gerekmiyorsa söyleriz.'],
      ['Sonuçların doğruluğunu garanti ediyor musunuz?', 'Hayır. Aracın sınırlarını açıkça yazarız ve kararı insanda bırakırız; sonucu insan kontrol eder.'],
      ['Verilerimiz nereye gider?', 'Hangi verinin kullanıldığı, nereye gitmediği ve kimin görebildiği teklifte yazılı olarak belirtilir.'],
      DESTEK,
      ['Hangi yapay zekâ modellerini kullanırsınız?', 'İşe uygun olanı seçeriz; kullandığımız araçları ve nedenini isterseniz söyleriz.'],
    ],
  },
};
