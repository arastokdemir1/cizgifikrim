# Proje ve Faz Gereksinimleri (Requirements)

> **Konum:** `.planning/REQUIREMENTS.md`  
> **Sorumlu:** `company-product-lead`  
> **Amaç:** CizgiFikrim "E-Ticaret & Shopify WhatsApp Büyüme Simülatörü" (Task-025 / `tr/demo.html`) projesinin "bitti" tanımını netleştiren, doğrulanabilir gereksinim maddeleri.

```markdown
# Gereksinimler: E-Ticaret & Shopify WhatsApp Büyüme Simülatörü (tr/demo.html)

**Tanımlanma Tarihi:** 2026-09-24  
**Temel Değer / Hedef:** E-ticaret mağaza sahiplerinin yüksek reklam maliyetleri ve %70'i aşan sepet terk oranları karşısında, CizgiFikrim WhatsApp sepet kurtarma ve satış asistanı sistemlerinin yaratacağı doğrudan nakit geri kazanımını ilk 15 saniyede interaktif olarak simüle etmelerini ve risksiz randevu adımına geçmelerini sağlamak.

---

## Faz / Sürüm Gereksinimleri

### Alan 1: Ürün Değer Önerisi ve İkna Mimarisi
- [ ] **REQ-VAL-01**: Sayfa açıldığında mağaza sahibine değer önerisini 15 saniyede aktaran çift panelli (Sol: Simülatör ve ROI, Sağ: Gerçekçi WhatsApp Cihazı) stüdyo düzeni sunulmalıdır.
- [ ] **REQ-VAL-02**: Sayfa ilk yüklendiğinde varsayılan bir senaryo (Moda/Tekstil) otomatik olarak aktifleşmeli ve 400ms içinde "yazıyor..." animasyonu eşliğinde ilk mesaj balonu belirmelidir.
- [ ] **REQ-VAL-03**: CizgiFikrim kurumsal kimliğine uygun olarak Plus Jakarta Sans başlıklar, Inter gövde metinleri ve Apple/Stripe kalitesinde minimal kart yapıları kullanılmalıdır.

### Alan 2: Hazır Sektörel Senaryolar ve Reaktif Kontrol Paneli
- [ ] **REQ-SEC-01**: Sol panelde tek tıkla çalışan en az 3 hazır sektör önayarı bulunmalıdır: Moda/Tekstil, Kozmetik & Bakım, Aksesuar & Takı.
- [ ] **REQ-SEC-02**: Sektör butonuna tıklandığında; Mağaza Adı, Müşteri Adı, Ürün Açıklaması, Sepet Tutarı ve İndirim Kodu form alanları anında ilgili sektör verileriyle dolmalıdır.
- [ ] **REQ-SEC-03**: Form alanlarındaki herhangi bir değişiklik sağ paneldeki WhatsApp mockup'ına ve hesaplama motoruna < 50ms gecikmeyle (reaktif) yansıtılmalıdır.

### Alan 3: Çift Mod Kurgusu (Starter ve Growth Paketleri)
- [ ] **REQ-MOD-01**: Simülatör, belirgin bir mod seçici ile iki çalışma modunu desteklemelidir:
  - **Mod 1 (Starter Paketi - Terk Edilmiş Sepet Kurtarma)**: 15. dakika kurtarma mesajı, dinamik indirim kuponu, ürün önizleme kartı ve tek tıkla sepet tamamlama linki.
  - **Mod 2 (Growth Paketi - Reklam & Satış Kapatıcı Asistan)**: Instagram reklamından gelen müşteri sorusu, botun saniyeler içinde beden/stok tavsiyesi vermesi ve güvenli PayTR / Shopify Checkout ödeme linki sunması.
- [ ] **REQ-MOD-02**: Modlar arasında geçiş yapıldığında, WhatsApp ekranındaki sohbet akışı, mesaj içerikleri ve etkileşim butonları temizlenip ilgili moda uygun olarak yeniden canlandırılmalıdır.

### Alan 4: Gerçekçi WhatsApp Arayüzü ve Mikro-Etkileşimler
- [ ] **REQ-UI-01**: Sağ paneldeki simülatör; yeşil işletme doğrulama rozeti (verified badge), profil avatarı, "Çevrimiçi" durum ibaresi, şifreli mesaj bilgilendirmesi ve gerçekçi sohbet arka planı içermelidir.
- [ ] **REQ-UI-02**: WhatsApp mesajları içerisinde tıklanabilir interaktif eylem butonları (`Sepeti Tek Tıkla Tamamla`, `Beden Danış`, `Hemen Satın Al`) bulunmalıdır.
- [ ] **REQ-UI-03**: Butona tıklandığında; buton tıklandı durumuna geçmeli, akışta bir sonraki adım tetiklenmeli ve "Sepete Dönüş / Sipariş Onaylandı" mikro-animasyonu ekranda canlanmalıdır.
- [ ] **REQ-UI-04**: Kullanıcı formda boşluk bıraktığında veya geçersiz değer girdiğinde WhatsApp ekranında kırık ifade (`undefined`, `null` vb.) görünmemeli, akıllı yedek metinler gösterilmelidir.

### Alan 5: Canlı ROI ve Gelir Kurtarma Hesaplayıcısı
- [ ] **REQ-ROI-01**: Kullanıcının aylık cirosunu belirleyebileceği etkileşimli bir ciro kaydırıcısı (slider) ve sayısal girdi kutusu sunulmalıdır (Varsayılan: 350.000 ₺; Aralık: 50.000 ₺ - 2.500.000 ₺).
- [ ] **REQ-ROI-02**: Hesaplayıcı; aylık kurtarılacak net ciro projeksiyonunu, yıllık ek gelir potansiyelini ve sistem amortisman gün sayısını matematiksel olarak hatasız hesaplamalıdır.
- [ ] **REQ-ROI-03**: Tüm para birimi çıktıları Türk Lirası simgesi (`₺`) ve binlik ayraçlarıyla (örn. `70.000 ₺`) biçimlendirilmelidir.
- [ ] **REQ-ROI-04**: ROI alanında "14 Gün Risksiz: Kurtarılan Cironun %10'u Modeli" garanti rozeti belirgin şekilde yer almalıdır.

### Alan 6: Teknik Standartlar, Mobil Uyum ve Bağlantı Bütünlüğü
- [ ] **REQ-TEC-01**: Sayfa tamamen Pure Vanilla JS (sıfır harici kütüphane) ile geliştirilmeli ve `node -c` kontrolünden sıfır sözdizimi hatasıyla geçmelidir.
- [ ] **REQ-TEC-02**: 320px - 2560px arası tüm ekranlarda kusursuz responsive deneyim sunulmalı; mobilde yatay kaydırma çubuğu oluşmamalıdır.
- [ ] **REQ-TEC-03**: Sayfa başlığı, meta etiketleri, Open Graph açıklamaları eksiksiz tanımlanmalıdır.
- [ ] **REQ-TEC-04**: Sayfa içi tüm navigasyon, footer ve CTA butonları (`/tr/randevu.html`, `/tr/hizmetler.html`) sağlam ve çalışır olmalı; 0 kırık link bulunmalıdır.

---

## Kapsam Dışı (Out of Scope)

*Kapsam kaymasını (scope creep) engellemek için özellikle dışlanan maddeler:*

| Özellik | Hariç Tutulma Nedeni |
| :--- | :--- |
| Canlı Meta Cloud API Entegrasyonu | Demo simülatörüdür; gerçek mesaj gönderimi Meta onayı ve API faturası gerektirir. |
| Gerçek Kredi Kartı / POS Ödeme İşleme | Simülatör ödeme adımı görsel ve işlevsel bir demodan ibarettir, finansal işlem yapılmaz. |
| Kullanıcı Girişi / Kayıt Duvarı (Paywall) | Ziyaretçinin ilk 15 saniyede sürtünmesiz deneyim yaşaması için kayıt şartı konulmamıştır. |
| Ağır Frontend Çatıları (React, Vue vb.) | Sayfa hızının < 1 sn kalması ve CizgiFikrim statik mimarisine uyum için Vanilla JS zorunludur. |
| Logo / Resim Dosyası Yükleme (File Upload) | İstemci yükünü ve güvenlik açıklarını önlemek için hazır vektörel/fotoğraf varlıkları kullanılır. |

---

## İzlenebilirlik Matrisi (Traceability)

| Gereksinim ID | İlgili Faz | İlgili Rol / Plan | Test Durumu |
| :--- | :--- | :--- | :--- |
| REQ-VAL-01 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-VAL-02 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-VAL-03 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-SEC-01 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-SEC-02 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-SEC-03 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-MOD-01 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-MOD-02 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-UI-01 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-UI-02 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-UI-03 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-UI-04 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-ROI-01 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-ROI-02 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-ROI-03 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-ROI-04 | Faz 25 | `company-frontend-engineer` | ⬜ Bekliyor |
| REQ-TEC-01 | Faz 25 | `company-verifier` | ⬜ Bekliyor |
| REQ-TEC-02 | Faz 25 | `company-verifier` | ⬜ Bekliyor |
| REQ-TEC-03 | Faz 25 | `company-verifier` | ⬜ Bekliyor |
| REQ-TEC-04 | Faz 25 | `company-verifier` | ⬜ Bekliyor |
```
