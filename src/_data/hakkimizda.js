// Hakkımızda sayıları ve zaman çizgisi. HİÇBİR DEĞER ELLE YAZILMAZ: hepsi derleme anında src/_data/projeler.json'dan hesaplanır.
// Nasıl hesaplanır:
//  - sayilar[0] Ürün ve proje  = projeler.json kayıt sayısı
//  - sayilar[1] App Store'da   = durum === "App Store'da" olanlar
//  - sayilar[2] Web'de yayında = durum === "Yayında" olanlar
//  - sayilar[3] Geliştirilen   = durum === "Geliştiriliyor" olanlar (Ar-Ge ve Bakımda ayrıca `ayrinti` içinde)
//  - sayilar[4] Platform       = projelerin `platform` alanındaki platform adlarının tekil listesi (iOS, Web, macOS, Chrome eklentisi); platform alanı olmayan proje sayılmaz
//  - zaman = yalnız KAYNAKLI `cikis` alanı olan projeler (cikis.kaynak projeler.json'da), tarihe göre sıralı
import fs from 'node:fs';
const projeler = JSON.parse(fs.readFileSync(new URL('./projeler.json', import.meta.url), 'utf8'));
const say = (durum) => projeler.filter((p) => p.durum === durum).length;
const PLATFORMLAR = [['iOS', /\biOS\b/], ['Web', /(^|[\s·(])Web\b/], ['macOS', /macOS/], ['Chrome eklentisi', /Chrome eklentisi/]];
const platformlar = PLATFORMLAR.filter(([, re]) => projeler.some((p) => p.platform && re.test(p.platform))).map(([ad]) => ad);
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const gorunen = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${AY[m - 1]} ${y}`; };
export default {
  sayilar: [
    { deger: projeler.length, etiket: 'Ürün ve proje' },
    { deger: say("App Store'da"), etiket: "App Store'da" },
    { deger: say('Yayında'), etiket: "Web'de yayında" },
    { deger: say('Geliştiriliyor'), etiket: 'Geliştirilen' },
    { deger: platformlar.length, etiket: 'Platform', liste: platformlar },
  ],
  ayrinti: { arge: say('Ar-Ge'), bakimda: say('Bakımda') },
  zaman: projeler.filter((p) => p.cikis && p.cikis.tarih && p.cikis.kaynak)
    .sort((a, b) => a.cikis.tarih.localeCompare(b.cikis.tarih))
    .map((p) => ({ slug: p.slug, ad: p.ad, tarih: gorunen(p.cikis.tarih), tarih_iso: p.cikis.tarih, etiket: p.cikis.etiket, metin: `${p.ad} ${p.cikis.etiket}`, kaynak: p.cikis.kaynak })),
};
