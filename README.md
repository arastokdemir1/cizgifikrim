# CizgiFikrim — ürün odaklı web sitesi

Eleventy 3 ile üretilen, Türkçe/İngilizce ve cihaz temasına uyumlu çok sayfalı site. Ana ürünler: Vesira, PolishReel, CarLog. Yönetim paneli veya yeni backend yoktur.

## Yerelde çalıştırma

Node.js 20 veya üzeri gerekir.

```sh
npm ci
npm run build:gh
python3 -m http.server 4173 --bind 127.0.0.1 --directory _site
```

Türkçe: `http://127.0.0.1:4173/tr/` · İngilizce: `http://127.0.0.1:4173/en/`. Kök adres kayıtlı dil tercihini, yoksa tarayıcı dilini kullanır. JavaScript kapalıysa iki dil bağlantısı sunulur.

Geliştirme sunucusu için `npm run serve` de kullanılabilir. Otomatik tema CSS `prefers-color-scheme` ile uygulanır; tema tercihi depolanmaz.

## İçerik ve tasarım

- `src/_data/modern.js`: iki dilin metinleri, ürünler, çözümler, gerçek güncellemeler, diğer çalışmalar, adres/dil eşlemeleri ve SEO açıklamaları.
- `src/_includes/modern/`, `src/_includes/layouts/modern.njk`: aktif sayfalar ve ortak bileşenler.
- `src/assets/css/modern.css`: aktif tokenler, iki tema ve responsive düzen. Kalıcı tasarım kaydı `DESIGN.md` ve `.impeccable/design.json`.
- `src/assets/js/modern.js`: menüler, dil geçişi, önce/sonra karşılaştırması ve açıkça işaretli önizleme başarı ekranı.
- `src/_data/redirects.json`: eski bağlantılardan yeni sayfalara açık yönlendirme listesi. Joker kural yoktur.

Önceki sunum şablonları geçiş kaydı olarak korunur, `.eleventy.js` içindeki açık listeyle derleme dışında bırakılır. Yeni siteyi değiştirmek için eski `base.njk`, `index.njk`, eski sayfa CSS'leri veya `projeler.json` yerine yukarıdaki modern dosyaları düzenleyin.

Ürün fotoğrafları, Vesira örnek karşılaştırmaları ve CarLog mağaza ekranları mevcut orijinal kaynaklardır. PolishReel videosu kendi test bilekliğinin düzeltilmiş örneğinden sıkıştırılmıştır; otomatik başlamaz. Sahte müşteri, kullanım ya da gelir verisi yoktur. Ürün fiyatları kendi sitelerinde kalır.

Paylaşım görselleri `src/assets/img/og/` altındadır. Metin veya ürün görsellerini değiştirdikten sonra yeniden üretin:

```sh
npm run assets:social
npm run build:gh
```

## Form ve takvim

Mevcut Supabase `submit-lead` GET jeton/POST gönderim sözleşmesi korunur. Alan adları, hizmet slug'ları ve `gizlilik-2026-11` rıza sürümü değiştirilmemiştir. Yeni API veya anahtar oluşturulmamıştır.

`cizgifikrim.net` ve `www.cizgifikrim.net` dışındaki tüm ortamlarda form **yerel simülasyondur**: ağa mesaj göndermez. Gerçek alan adında da `?lead=mock` aynı güvenli test kipini açar. Başarı ekranına `?preview=1` taşınır ve açıkça hiçbir mesaj gönderilmediği yazılır. Dil geçişi bu parametreyi korur.

Test e-postaları: `fail@example.test` sunucu hatası, `busy@example.test` yoğunluk, `rate@example.test` hız sınırı; başka bir `@example.test` adresi simülasyon başarısı verir. Gerçek canlı kaydı bu testlerin geçtiği anlamına gelmez. JavaScript kullanılamazsa form gönderme düğmesi kapalıdır; e-posta bağlantısı yedektir.

Cal.com yalnız ziyaretçi takvimi açınca yüklenir; mevcut profil adresi korunur. Gerçek rezervasyon yapılmamıştır. Birinci taraf analitik yalnız gerçek üretim alan adlarında çalışır; DNT/GPC tercihlerine uyar.

## Kontroller

```sh
npm test
npm run test:fixture
npm run build:cf
node scripts/kontrol-hepsi.mjs --site _site --no-audit
```

`npm test` önce GitHub Pages çıktısını üretir, ardından korunan dosyalar, yönlendirmeler, sitemap, SEO, iki dil, kaynaklar, parçalar, paylaşım görselleri ve rıza sözleşmesini kontrol eder. Korunan dosya karşılaştırması `origin/main` Git referansını gerektirir; ZIP kopyasında `.git` bulunmadığından bu kontrol asıl depoda çalıştırılmalıdır. Fixture çıktısı `_site-test/` ana yayın çıktısını silmez.

## Yayın

- GitHub Pages: `npm run build:gh`, çıktı `_site/`. Eski adresler noindex HTML/JS yönlendirme sayfalarıdır; bunlar HTTP 301 değildir.
- Cloudflare Pages: `npm run build:cf`, çıktı `_site/`. `_redirects` ve `_headers` üretilir; eski adresler HTTP 301 kurallarıyla taşınır.
- `carlog/`, `piyasa/`, `sano/`, `zihinustasi/`, `demo/` ve diğer korunan ürün dosyaları aynı kalır.

Bu çalışma canlı siteye dağıtım veya Git push yapmaz. Yayın sonrası üretim formunun alınma ve geri dönüş akışı ile Cal.com yüklemesi ayrıca doğrulanmalıdır. Yerel LCP/CLS ölçümü üretim performansı garantisi değildir.
