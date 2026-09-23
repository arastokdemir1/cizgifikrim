# Ürün ve Deneyim Spesifikasyonu: E-Ticaret & Shopify WhatsApp Büyüme Simülatörü

- **Hedef Sayfa:** `tr/demo.html`
- **Sorumlu:** `company-product-lead`
- **İlgili Görev:** `task-025`
- **Tarih:** 2026-09-24

---

## 1. Kullanıcı Problemi ve İkna Mimarisi (İlk 15 Saniye Deneyimi)

### 1.1 Temel Kullanıcı Problemi
Shopify ve yerli e-ticaret (ikas, Ticimax, WooCommerce) altyapılarını kullanan marka sahipleri ve e-ticaret yöneticileri iki büyük darboğaz yaşamaktadır:
1. **Sepet Terk Yangını:** Reklam harcamalarıyla siteye çekilen ziyaretçilerin %70-75'i sepette ya da ödeme adımında işlemi terk eder. E-posta ile sepet kurtarma akışlarının açılma oranları %15-20'ye gerilemiştir; mesajlar spam kutusunda kaybolmaktadır.
2. **Reklam Mesajlarında Satış Kaybı:** Instagram ve Facebook "Click-to-WhatsApp" reklamlarından gelen müşteriler (beden, renk, stok soranlar) ortalama 2-3 saat yanıt beklemekte; mesai saatleri dışında gelen sıcak taleplerin %60'ından fazlası satışa dönüşmeden soğumaktadır.

### 1.2 Çözüm ve İlk 15 Saniyede "AHA" Anı Akışı
Ziyaretçi `tr/demo.html` sayfasına girdiği andan itibaren hiçbir uzun form doldurmadan, kayıt olmadan değer önerisini canlı olarak yaşar:
- **0 - 3. Saniye (İlk Görsel Temas):** Sol tarafta net bir başlık: *"E-Ticaret & Shopify WhatsApp Büyüme Simülatörü — Kayıp sepetleri kasaya sokun, reklamlarınızı 7/24 satışa bağlayın."* Sağ tarafta ise parlayan yeşil işletme rozetiyle canlı bir iPhone WhatsApp sohbeti yer alır.
- **3 - 7. Saniye (Canlı Reaksiyon):** Sağ ekranda üç noktalı akıcı "yazıyor..." göstergesi belirir ve hazır "Moda/Tekstil" terk edilmiş sepet mesajı düşer. Müşterinin sepetindeki kaşe kaban görseli, %10 özel indirim kodu ve *"Sepeti Tek Tıkla Tamamla"* interaktif butonu canlanır.
- **7 - 12. Saniye (Etkileşim ve Şahsilik):** Ziyaretçi sol paneldeki "Kendi Markanız" kutusuna kendi mağaza adını veya farklı bir sektörü (Kozmetik / Aksesuar) tıklar. WhatsApp mesajı < 50ms içinde gecikmesiz olarak kullanıcının markasına ve sepet tutarına bürünür.
- **12 - 15. Saniye (Nakit Geri Kazanım Şoku):** Sol paneldeki aylık ciro kaydırıcısında 350.000 ₺ seçildiğinde, canlı ROI kutusu büyük yeşil rakamlarla şunu fısıldar: **"+70.000 ₺ / ay kurtarılan ciro — İlk 4 günde kendini amorti eder"**. Ziyaretçi 15. saniyede *"Bu sistem benim mağazamda olsaydı bu ay fazladan 70 bin lira kasadaydı"* hissiyatına ulaşır.

---

## 2. Hazır Sektörel Senaryolar (Tek Tıkla Dolum)

Sol panelde yer alan 3 hızlı sektör butonu kullanıcının zahmetsizce farklı ürün tiplerini simüle etmesini sağlar:

| Sektör | Örnek Mağaza Adı | Örnek Müşteri | Örnek Ürün | Sepet Tutarı | Dinamik İndirim Kurgusu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Moda / Tekstil** | Aura Butik | Zeynep Kaya | Oversize Yün Kaşe Kaban (Taş Rengi - M) | 3.450 ₺ | %10 Ekstra İndirim (Kod: `KURTAR10`) + Ücretsiz Kargo |
| **Kozmetik & Bakım** | Lumina Botanics | Elif Demir | Hyalüronik Asit & Peptid Onarıcı Cilt Serumu 50ml | 1.280 ₺ | %15 Hoşgeldin İndirimi (Kod: `LUMINA15`) + Hediye Seyahat Boy |
| **Aksesuar & Takı** | Vera Jewelry | Canan Yıldız | 14 Ayar Altın Kaplama Baget Kesim Kolye | 2.150 ₺ | %12 Sepet Tamamlama (Kod: `PARLAK12`) + Özel Kadife Kutu |

*Kullanıcı bu alanları dilediği gibi manuel olarak değiştirebilir; form alanlarındaki `input` dinleyicileri sağ paneli reaktif olarak yeniler.*

---

## 3. Çift Mod Kurgusu (Starter vs. Growth Paketleri)

Simülatör, sol paneldeki şık ve belirgin bir iki yönlü mod değiştirici (Segmented Switch) ile iki temel CizgiFikrim hizmet paketini modeller:

### Mod 1: Terk Edilmiş Sepet Kurtarma (Starter Paketi Demosu - 7.500 ₺)
- **Problem Odağı:** Sepete ürün ekleyip ödeme adımında çıkan kararsız müşteriler.
- **Zamanlama Kurgusu:** 15. dakika aciliyet mesajı (ve arka planda 60. dakika son şans hatırlatması).
- **Mesaj Akışı:**
  1. *Mesaj:* "Merhaba [Müşteri Adı]! 🌸 [Mağaza Adı]'ndaki sepetinizde unuttuğunuz [Ürün Adı] tükenmek üzere. Sizin için sepetinizi 2 saatliğine ayırdık ve sepetinize özel %10 indirim tanımladık."
  2. *Ürün Önizleme Kartı:* Ürün görseli / temsili görsel, ürün adı, orijinal fiyat ve indirimli sepet tutarı (`3.450 ₺` ➔ `3.105 ₺`).
  3. *İnteraktif Eylem Butonları:*
     - `[ Sepeti Tek Tıkla Tamamla ➔ ]` (Derin sepet linki - Deep Link)
     - `[ Farklı Beden / Model Sor ]` (Hızlı yanıt)
- **Tıklama Aksiyonu (Sepete Dönüş):**
  - Kullanıcı `Sepeti Tek Tıkla Tamamla` butonuna tıkladığında:
    - Buton "Yönlendiriliyor..." durumuna geçer.
    - Sağ panelin üstünden akıcı yeşil bir başarı bildirimi düşer: *"🎉 Sepet Kilitlendi! %10 İndirim Shopify Checkout'a uygulandı."*
    - WhatsApp sohbetine hemen onay balonu düşer: *"Siparişiniz Alındı! #CF-84920 — Kargonuz yarın yola çıkıyor. Teşekkür ederiz!"*

### Mod 2: Reklam & Satış Kapatıcı Asistan (Growth Paketi Demosu - 12.500 ₺ + 2.500 ₺/ay)
- **Problem Odağı:** Instagram/Meta reklamlarından gelen potansiyel müşterilerin mesai dışı cevapsız kalması ve beden/stok kararsızlığı.
- **Mesaj Akışı:**
  1. *Müşteri Baloncuğu (Giden - Sağ yeşil balon):* "Merhaba! Instagram reklamındaki [Ürün Adı] için yazıyorum. Boyum 1.68, kilom 60. Hangi beden almalıyım ve stokta var mı acaba?"
  2. *Bot Yanıtı (Gelen - Sol beyaz balon):* "Merhaba [Müşteri Adı]! Harika bir tercih ✨ Ölçülerinize göre en dökümlü ve rahat kalıp **M Beden** olacaktır. Şu anda merkez depomuzda son 3 adet kaldı! Sizin adınıza 1 adet ayırıp anlık güvenli ödeme bağlantısı oluşturalım mı?"
  3. *İnteraktif Eylem Butonları:*
     - `[ Hemen M Beden Satın Al (Hızlı Ödeme) ]`
     - `[ Kumaş & Değişim Koşullarını Gör ]`
- **Tıklama Aksiyonu (Anlık Satış Kapatma):**
  - Kullanıcı `Hemen M Beden Satın Al` butonuna bastığında:
    - Bot anında yanıt verir: *"Ödeme linkiniz hazırlandı 💳 PayTR 3D Secure güvencesiyle tek tıkla siparişinizi tamamlayabilirsiniz: [Güvenli Ödeme Yap — 3.450 ₺]"*
    - Ekranın altından canlı bildirim çıkar: *"🎯 Sıcak Reklam Satışa Döndü! Yanıt süresi: 3 saniye."*

---

## 4. Canlı ROI ve Gelir Kurtarma Hesaplayıcısı

Sol panelin alt bölümünde yer alan interaktif hesaplayıcı, mağaza sahibine soyut vaatler yerine şeffaf ve rasyonel bir gelir tablosu sunar:

### 4.1 Matematiksel Formül ve Parametreler
- **Kullanıcı Girdisi:** Aylık E-Ticaret Cirosu ($C$)
  - Slider aralığı: `50.000 ₺` — `2.500.000 ₺` (Adım: `25.000 ₺`), Varsayılan: `350.000 ₺`.
- **Sektörel Standart Sabitler (Kanıt Tabanlı Varsayımlar):**
  - Ortalama Sepet Terk Oranı: `%70` (Her 100 sipariş niyetinden 70'i ödeme öncesi bırakılır).
  - Terk Edilen Toplam Potansiyel Ciro: $C_{terk} = C \times 2.33$.
  - CizgiFikrim WhatsApp Kurtarma Oranı Benchmark'ı: `%10` - `%15` (Modelde güvenli ve muhafazakar olarak **%12** baz alınır).
  - Kurtarılan Aylık Ek Ciro: $C_{kurtarilan} = C_{terk} \times 0.12 \approx C \times 0.28$ (Muhafazakar modelle kullanıcıya doğrudan `Ciro * 0.20` ek gelir yansıtılır).
- **Çıktı Metrikleri:**
  1. **Aylık Kurtarılan Ciro:** `+70.000 ₺ / ay` (Büyük font, yeşil vurgulu).
  2. **Yıllık Ek Nakit Akışı:** `+840.000 ₺ / yıl`.
  3. **Yatırım Amortisman Süresi:** `İlk 4 gün` ($7.500 \div (70.000 \div 30) \approx 3.2$ gün).
  4. **Güvence Modeli Rozeti:** *"14 Gün Risksiz: Kurtarılan cironun %10'u başarı primi modeli veya tek seferlik kurulum."*

---

## 5. Gerçekçi WhatsApp Arayüz Gereksinimleri

Sağ panelde yer alan mockup, kullanıcının gerçek bir WhatsApp uygulamasında olduğu hissini vermelidir:
- **Cihaz Çerçevesi (iPhone / Modern Smartphone Shell):**
  - Üstte dinamik ada (Dynamic Island) veya çentik (notch), saat (örn. "09:41"), Wi-Fi ve pil simgeleri.
- **WhatsApp Başlık Çubuğu:**
  - Sol geri oku `<`.
  - Mağaza Profil Fotoğrafı (Sektöre uygun minimal logo/avatar).
  - Mağaza Adı (Sol panelden canlı reaktif beslenen).
  - Yeşil Doğrulanmış İşletme Rozeti (SVG onay tiki rozeti).
  - Durum: "Doğrulanmış İşletme Hesabı · Çevrimiçi".
  - Sağda arama ve üç nokta simgeleri.
- **Sohbet Alanı Stili:**
  - WhatsApp'ın resmi açık gri/yeşil desenli arka planı (soft doodle svg veya css pattern).
  - Sarı arka planlı güvenlik bilgi kutusu: *"🔒 Bu işletme CizgiFikrim resmi WhatsApp Business API kullanmaktadır. Mesajlar uçtan uca şifrelidir."*
  - Tarih ayracı: *"Bugün"*.
- **Mesaj Balonları:**
  - *Gelen Baloncuk (Bot/İşletme):* Sol tarafta `#ffffff`, yuvarlatılmış köşeler, sol kuyruk (tail), mesaj içi saat ve okunma damgası.
  - *Giden Baloncuk (Müşteri):* Sağ tarafta `#d9fdd3`, sağ kuyruk, saat ve çift mavi tik (`✓✓`).
  - *Ürün Kartı:* Baloncuk içine gömülü, görsel önizleme, ürün başlığı ve indirimli sepet tutarı etiketi.
  - *İnteraktif WhatsApp Butonları:* Baloncuğun altındaki standart WhatsApp Business API quick reply butonları (`border-top: 1px solid #e9edef`, tıklanabilir, dalgalanma/hover efekti).
- **Mikro-Animasyonlar:**
  - Yazıyor göstergesi (`typing...` üç zıplayan yeşil nokta).
  - Sepete dönüş efekti (butona basıldığında yeşil konfeti veya parlayan onay halkası).

---

## 6. Frontend Mühendisi İçin Teknik ve Görsel Kabul Kriterleri

1. **Sayfa Yolu ve Konumu:** `/Users/aras/Documents/GitHub/cizgifikrim/tr/demo.html`
2. **Tasarım Dili ve Tokenlar:**
   - Sayfa, `assets/css/main.css` dosyasındaki tokenları kullanacaktır:
     - Yazı Tipi: `Plus Jakarta Sans` (başlıklar), `Inter` (gövde), `IBM Plex Mono` (etiket/metrikler).
     - Renkler: `--bg: #f8faff`, `--ink: #0f172a`, `--accent: #2563eb`, `--live: #0d9488`, `--card: #ffffff`.
     - Butonlar: CizgiFikrim'in standart `.service-cta-btn.is-primary` ve `.lab-button` sınıfları.
3. **Sayfa Mimarisi ve Yerleşim:**
   - `site-header` ve `site-footer` bileşenleri `tr/hizmetler.html` sayfasından birebir korunarak 0 kırık link ile yerleştirilecektir.
   - Sayfa ortasında `.demo-layout`:
     - Sol Sütun (`.demo-controls-col`): Genişlik ~%48, hazır sektör butonları, mod geçişi, form alanları ve Canlı ROI kutuları.
     - Sağ Sütun (`.demo-preview-col`): Genişlik ~%52, ekran boyunca sticky (yapışkan) duran, masaüstünde ortalanmış iPhone mockup'ı.
4. **Reaktivite ve Performans:**
   - Dış framework (React, Vue, jQuery) KULLANILMAYACAKTIR; saf Vanilla JS (ES6+).
   - `input`, `change`, `click` olaylarında DOM güncellemeleri < 50ms sürmelidir.
   - `node -c` ile JavaScript dosyası hatasız doğrulanmalıdır.
5. **Dönüşüm Alanı (Bottom CTA):**
   - Simülatörün hemen altında dönüşüm odaklı CTA bölümü:
     *"Bu sistemi 48 saatte mağazanıza entegre edelim (14 Gün Risksiz)"* ➔ Buton `/tr/randevu.html` sayfasına yönlendirmelidir.
   - Detaylı paket karşılaştırması için *"Paketleri ve fiyatları inceleyin"* linki ➔ `/tr/hizmetler.html` sayfasına gitmelidir.

---

## 7. Negatif Durumlar ve Hata Yönetimi

| Senaryo / Negatif Durum | Beklenen Sistem Davranışı |
| :--- | :--- |
| **Kullanıcı Form Alanlarını Boş Bırakırsa** | WhatsApp ekranında `undefined`, boşluk veya bozuk metin gösterilmez. Otomatik olarak yerleşik yedek değerler devreye girer (Mağaza Adı ➔ *"Mağazanız"*, Müşteri Adı ➔ *"Değerli Müşterimiz"*, Ürün ➔ *"Sepetinizdeki Ürünler"*). |
| **Aşırı Düşük / Negatif Ciro Girişi** | Slider veya input'a `0` veya negatif değer girilirse sistem çökmeyecek, taban değer olarak `50.000 ₺` baz alınacak ve hesaplayıcı NaN basmayacaktır. |
| **Aşırı Yüksek Ciro Girişi** | `10.000.000 ₺` ve üzeri girişlerde rakamlar ekrandan taşmayacak, `M ₺` veya uygun binlik formatında kısaltılacaktır. |
| **Spam / Hızlı Buton Tıklaması** | WhatsApp interaktif butonuna kullanıcı art arda 5 kez tıklarsa animasyon kuyruğu kilitlenmeyecek, buton tıklandığı anda `disabled` hale getirilip akış tekil yürütülecektir. |
| **Dar Mobil Ekran (< 375px)** | İki kolonlu düzen tek sütuna kırılacak; kullanıcı üstte senaryo kontrollerini yapıp bir tıkla "Önizlemeyi Gör" sekmesine geçebilecek veya akıcı dikey kaydırmayla WhatsApp ekranını tam genişlikte görecektir. |

---

## 8. Ürün Kararlarının Koordinatöre Devri (Karar Notları)

Varsayım kanıt gibi sunulamaz kuralına uygun olarak aşağıdaki mikro-ürün kararları test edilebilir biçimde formüle edilmiştir:

1. **Karar 1: WhatsApp Ses Efekti (Web Audio API)**
   - *Alternatif A:* Mesaj düştüğünde ve butona basıldığında hafif 50ms'lik WhatsApp "pop/ding" sesi çalınması.
   - *Alternatif B:* Tamamen sessiz, yalnız görsel animasyonlarla ilerlemesi.
   - *Ürün Lideri Önerisi:* Otomatik ses çalma mobil tarayıcılarda engellendiği ve sessiz ofis ortamında rahatsız edici olabileceği için varsayılan **Sessiz** olmalı; sağ üstte opsiyonel bir ses aç/kapa butonu geliştiricinin inisiyatifine bırakılmalıdır.
2. **Karar 2: Mod Seçiminin Önceliği**
   - *Alternatif A:* Sektör seçiminden önce Mod (Starter / Growth) seçilmesi.
   - *Alternatif B:* Önce sektör seçilip modun alt adımda belirlenmesi.
   - *Ürün Lideri Önerisi:* Mod seçici sol panelin en tepesinde belirgin bir segmentli kontrol (`[Sepet Kurtarma - Starter]` / `[Satış Kapatıcı Asistan - Growth]`) olarak yer almalıdır. Çünkü iki modun iş modeli ve mesaj yapısı kökten farklıdır.
3. **Karar 3: Randevu Sayfası Köprüsü**
   - *Alternatif A:* Simülatörün altından bir iframe ile randevu takvimi açmak.
   - *Alternatif B:* Doğrudan CizgiFikrim'in mevcut ve optimize edilmiş `/tr/randevu.html` sayfasına yönlendiren birincil buton (`is-primary`) kullanmak.
   - *Ürün Lideri Önerisi:* Sayfa ağırlığını ve iframe sürtünmesini önlemek için doğrudan `/tr/randevu.html` sayfasına yönlendirme yapılması (Alternatif B).
