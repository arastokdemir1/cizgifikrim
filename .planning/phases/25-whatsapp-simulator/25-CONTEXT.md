# Faz 25: E-Ticaret & Shopify WhatsApp Büyüme Simülatörü - Bağlam ve Kararlar (Context)

> **Konum:** `.planning/phases/25-whatsapp-simulator/25-CONTEXT.md`  
> **Sorumlu:** `company-product-lead`  
> **Amaç:** Bu fazda kilitlenen kararları, sınırları ve referansları sonraki teknik roller (`company-solution-architect`, `company-frontend-engineer`, `company-verifier`, `company-reviewer`) için netleştirmek.

**Tarih:** 2026-09-24  
**Durum:** Planlamaya Hazır (Ready for Planning)

---

<domain>
## Faz Sınırı (Boundary)

Bu faz, CizgiFikrim web sitesi için Shopify ve e-ticaret mağaza sahiplerinin terk edilmiş sepetleri kurtarma ve Meta reklamlarını doğrudan satışa çevirme potansiyelini ilk 15 saniyede deneyimleyebilecekleri interaktif simülatör sayfasının (`tr/demo.html`) ürün mimarisini, kullanıcı akışını ve teknik gereksinimlerini kapsar. Sayfa; Sol Panelde interaktif parametre kontrolü (hazır sektörler, sepet tutarı, indirim oranı) ile canlı ROI/kurtarılan gelir hesaplayıcısını; Sağ Panelde ise birebir gerçekçi, tepkisel (reaktif) ve tıklanabilir bir iOS / WhatsApp Web arayüz simülasyonunu barındırır.

Bu faz, gerçek bir WhatsApp Business Cloud API entegrasyonu, üçüncü parti ödeme altyapısı (PayTR/iyzico) canlı API çağrıları veya arka uç (backend) veritabanı kayıt sistemlerini KESİNLİKLE kapsamaz. Simülatör tamamen modern istemci taraflı (Pure Vanilla JS), dış bağımlılıksız ve statik olarak çalışır. Sayfa sonundaki CTA butonları ve randevu akışları mevcut `/tr/randevu.html` sayfasına bağlanır.
</domain>

<decisions>
## Uygulama Kararları (Implementation Decisions)

### 1. Sayfa Düzeni ve İkna Mimarisi (İlk 15 Saniye Deneyimi)
- **Çift Kolonlu Stüdyo Mimarisi**: Masaüstünde ekran bölünmüş iki ana sütundan oluşacaktır. Sol panel: Kontrol & Canlı ROI Paneli; Sağ panel: Sticky (sabit kalan) gerçekçi iOS WhatsApp ekranı.
- **İlk 15 Saniye Tetikleyicisi**: Sayfa açıldığında boş bir ekran yerine varsayılan "Moda & Tekstil" senaryosu yüklü gelir. İlk 400ms içinde "yazıyor..." animasyonu belirir ve ardından ilk WhatsApp mesaj balonu ürün önizleme kartıyla ekrana düşer.
- **Reaktif Güncelleme**: Sol paneldeki herhangi bir girdi (Mağaza Adı, Müşteri Adı, Ürün Adı, Sepet Tutarı, İndirim Oranı) değiştirildiğinde sağ paneldeki WhatsApp mesajı ve kartı < 50ms içinde anlık olarak güncellenir.
- **Tasarım Bütünlüğü**: Mevcut CizgiFikrim tasarım sistemine (`assets/css/main.css`) %100 sadık kalınacaktır. Tipografide `Plus Jakarta Sans` başlıklar, `Inter` gövde metinleri ve `IBM Plex Mono` etiketler kullanılacaktır.

### 2. Hazır Sektörel Senaryolar (Tek Tıkla Dolum)
- Sol panelin başında 3 hazır sektör butonu yer alacaktır:
  - **Moda / Tekstil**: Mağaza: *Aura Butik*, Müşteri: *Zeynep Kaya*, Ürün: *Oversize Yün Kaşe Kaban (Taş Rengi, Beden: M)*, Sepet Tutarı: *3.450 ₺*, İndirim: *%10 (Kod: KURTAR10)*.
  - **Kozmetik & Bakım**: Mağaza: *Lumina Botanics*, Müşteri: *Elif Demir*, Ürün: *Hyalüronik Asit & Peptid Onarıcı Cilt Serumu 50ml*, Sepet Tutarı: *1.280 ₺*, İndirim: *%15 (Kod: LUMINA15)*.
  - **Aksesuar & Takı**: Mağaza: *Vera Jewelry*, Müşteri: *Canan Yıldız*, Ürün: *14 Ayar Altın Kaplama Baget Kesim Kolye*, Sepet Tutarı: *2.150 ₺*, İndirim: *%12 (Kod: PARLAK12)*.
- Sektör seçildiğinde tüm form ve sağ WhatsApp ekranı tek seferde sıfırlanıp yeni senaryo ile canlandırılır.

### 3. Çift Mod Kurgusu
- **Mod 1: Terk Edilmiş Sepet Kurtarma (Starter Paketi - 7.500 ₺)**:
  - 15. ve 60. dakika sepet kurtarma akışı simülasyonu.
  - WhatsApp Mesajı: Mağaza adı, müşteri ismi, ürün kartı, süre kısıtı ve indirim kodu içerir.
  - Butonlar: `[Sepeti Tek Tıkla Tamamla ➔]` ve `[Beden/Model Değiştir]`.
  - Tıklama Aksiyonu: "Sepeti Tek Tıkla Tamamla" butonuna tıklandığında buton pasife geçer, ekranda yeşil sepete dönüş animasyonu patlar ve WhatsApp sohbetine sipariş onay mesajı düşer ("🎉 Harika seçim! Sepetiniz onaylandı").
- **Mod 2: Reklam & Satış Kapatıcı Asistan (Growth Paketi - 12.500 ₺ + 2.500 ₺/ay)**:
  - Instagram / Meta reklamından gelen potansiyel müşteriyi 7/24 karşılama senaryosu.
  - Müşteri Girdisi: "Merhaba, bu kaban için boyum 1.68 kilom 60 hangi beden uyar?"
  - Bot Yanıtı: "Harika seçim! 1.68 boy ve 60 kg için ideal kalıp M Beden'dir. Son 3 adet stok kaldı."
  - Butonlar: `[Hemen M Beden Satın Al]` ve `[Kumaş & İade Detayı Gör]`.
  - Tıklama Aksiyonu: Butona basıldığında anlık güvenli PayTR / Shopify Checkout ödeme linki baloncuğu simüle edilir.

### 4. Gerçekçi WhatsApp Arayüz Standartları
- Yeşil İşletme Doğrulanmış Rozeti (SVG verified badge).
- WhatsApp durum çubuğu: Profil avatarı, işletme başlığı, "Doğrulanmış İşletme Hesabı / Çevrimiçi" göstergesi.
- WhatsApp Web / iOS mesaj baloncuğu geometrisi, saat damgaları ve çift mavi tik simgesi.
- Tıklanabilir resmi WhatsApp buton şablonu (Quick reply / URL CTA formatı).

### 5. Canlı ROI ve Gelir Kurtarma Hesaplayıcısı
- Formül Parametreleri:
  - Aylık E-Ticaret Cirosu (Varsayılan: 350.000 ₺, Slider aralığı: 50.000 ₺ - 2.500.000 ₺).
  - Sektörel Ortalama Terk Edilme Oranı: %70.
  - WhatsApp Kurtarma Oranı Benchmark'ı: %12 (muhafazakar hesaplama).
  - Kurtarılan Aylık Ek Ciro: `Aylık Ciro * 0.20` (ortalama %20 ilave gelir etkisi).
  - Yıllık Ek Gelir: `Kurtarılan Aylık Ciro * 12`.
  - ROI Amortisman Süresi: Starter paketi için tipik amortisman süresi 4 gün olarak dinamik hesaplanır.

### 6. Teknoloji ve Kütüphane Kısıtlamaları
- Sıfır dış bağımlılık (No NPM build, No React/Vue/Tailwind runtime).
- %100 Pure Vanilla JavaScript (ES6+), W3C uyumlu HTML5 ve `assets/css/main.css` ile uyumlu yerel CSS sınıfları.
- Kırık link kesinlikle olmayacaktır; header ve footer bağlantıları mevcut CizgiFikrim sayfalarıyla birebir örtüşecektir.

### Serbest Bırakılan Alanlar (Agent Discretion)
- WhatsApp mesaj balonlarının giriş animasyon süreleri (300ms - 500ms arası geçişler).
- Slider bileşeninin CSS vurgu gradyanları ve başparmak (thumb) mikro-stilleri.
- Mobil ekranlarda sol ve sağ panellerin alt alta dizilimi veya sekmeli (tab) yapının hassas breakpoint seçimi (öneri: 1024px altı dikey veya sekmeli).
</decisions>

<canonical_refs>
## Kanonik Referanslar (Kritik Belgeler)

*Bu bölüm zorunludur. Boş bırakılamaz.*

- `~/.company_agent_control/cizgifikrim_services_launch_20260923/task-025/contract.json` — Task 025 sözleşmesi, kapsam ve doğrulama kriterleri
- `.planning/REQUIREMENTS.md` — Ölçülebilir gereksinimler ve kabul kriterleri tablosu
- `.planning/phases/25-whatsapp-simulator/25-PRODUCT-SPEC.md` — Detaylı ürün spesifikasyonu ve UX durum matrisi
- `/Users/aras/Documents/GitHub/cizgifikrim/tr/hizmetler.html` — Starter, Growth ve VIP paket tanımları ve kurumsal B2B tasarım dili
- `/Users/aras/Documents/GitHub/cizgifikrim/assets/css/main.css` — Renk tokenları (`--ink`, `--accent`, `--card`, `--live`), tipografi ve grid şablonları
</canonical_refs>

<code_context>
## Mevcut Kod Tabanı İpuçları

### Yeniden Kullanılabilir Varlıklar
- `site-header` ve `site-footer`: `tr/hizmetler.html` dosyasındaki sabit başlık ve alt bilgi blokları `tr/demo.html` sayfasına birebir aktarılacaktır.
- `assets/css/main.css`: CSS değişkenleri (`--serif`, `--sans`, `--mono`, `--accent`, `--live`), `.page`, `.folio`, `.service-cta-btn`, `.lab-button` stilleri doğrudan kullanılacaktır.
- `check-icon` SVG sembolü: Hizmetler sayfasında yer alan ortak SVG kütüphanesinden yararlanılacaktır.

### Entegrasyon Noktaları
- `tr/demo.html` sayfasındaki ana CTA butonları doğrudan `/tr/randevu.html` sayfasına yönlendirilecektir.
- Navigasyon menüsündeki "Hizmetler" ve "Çalışmalar" linkleri `tr/hizmetler.html` ve `tr/products.html` ile entegre olacaktır.
- `tr/hizmetler.html` sayfasında yer alan E-Ticaret WhatsApp paketlerinin demo butonları gelecekte `tr/demo.html` adresine bağlanabilir durumdadır.
</code_context>

<deferred>
## Ertelenen Fikirler (Kapsam Dışı)

- Çoklu para birimi seçimi (USD, EUR, GBP) — Sonraki küresel açılım fazına ertelendi.
- Canlı Meta Cloud API üzerinden kullanıcının kendi telefonuna test WhatsApp mesajı göndermesi (WhatsApp Webhook maliyeti ve meta onay süreci gerektirdiği için bu fazda kapsam dışıdır).
- Özelleştirilmiş logo ve görsel yükleme (File upload) alanı — İstemci karmaşıklığını artırmamak adına hazır sektörel avatarlar ve SVG ikonlarıyla sınırlandırıldı.
</deferred>
