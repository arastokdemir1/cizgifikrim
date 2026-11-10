---
permalink: false
eleventyExcludeFromCollections: true
---
# CizgiFikrim tasarım sistemi (Tasarım Dili v2, Palet 1): sahip Frontend-2

Bu dosya yayınlanmaz (`permalink: false`). Sistem **donduruldu**: değişiklik Frontend-2'ye bildirilerek yapılır.

## Dosyalar
`src/assets/css/`: `fonts.css`, `tokens.css`, `base.css`, `layout.css`, `motion.css`, `components/*.css` (buttons, header, footer, cta-band; sayfa bileşenleri sonra). `src/assets/js/ui.js` (reveal, menü, sayaç, sahne ilerlemesi). `src/assets/fonts/`: Hanken Grotesk (değişken, latin + latin-ext) ve Instrument Serif Italic (latin + latin-ext), OFL lisansları aynı klasörde. **Mono font yok.**
Yayın yolu: `/assets/v1/css/...`, `/assets/v1/js/...`, `/assets/v1/fonts/...`.

## Şablon sözleşmesi
- Her sayfa: `layout: layouts/base.njk`. Front-matter: `title`, `description`, `canonical`, `ogImage`, `ogType`, `noindex`, `jsonld` (`partials/seo.njk` sözleşmesi); ek olarak `bodyClass` (isteğe bağlı), **`sayfaCss: [ 'pages/home', ... ]`** ve **`sayfaJs: [ ... ]`** (sayfaya özel dosyalar, `.css`/`.js` uzantısız yol).
- Ortak parçalar: `partials/header.njk` (yüzen pill nav), `partials/footer.njk` (4 sütun + dev wordmark), `partials/cta-band.njk` (her sayfa sonunda). Veri: `nav` (nav.ana, nav.cta, nav.giris, nav.alt.yasal), `site`. **"Giriş" yalnız `nav.giris` doluysa.** Üst menü `nav.ana` içinden, `nav.cta.href` ile aynı href'e sahip öğeyi atlar (CTA pill ayrı).
- İçerik bölümleri `<section class="sec theme-dark|theme-light">`. Bölümler arası geçiş: sonraki bölüm öncekinin üstüne **24 px biner**, üst köşeleri 24 px yuvarlaktır (`.sec + .sec`). `<main>` içinde bölümler doğrudan kardeş olmalıdır.
- Konteyner: `.container` (max 1280 px kenar boşluğu dâhil; 24 px, ≤560 px'te 20 px). Okuma sütunu `.container--read`.

## Tema (60/30/10)
`.theme-dark` (zemin `--c-main`) ve `.theme-light` (zemin `--c-second`) bölüm sınıfları anlamsal değişkenler yazar: `--bg --bg-2 --fg --fg-muted --line --line-strong --surface --accent --on-accent --focus`. Bileşenler **yalnız bunları** okur; hazır renk yazılmaz. **Açık temada `--accent` = siyah**, yani birincil pill açık zeminde otomatik siyah dolgu olur: **lime açık zeminde asla kullanılmaz.**
Takma adlar (Frontend-1 bileşenleri için): `--font-body`, `--font-display`, `--c-accent-ink`.

## Tipografi
`.h-hero`, `.h1`, `.h2`, `.h3`, `.h4` (Hanken 600, sıkı harf aralığı, `text-wrap: balance`). Vurgu: başlıkta `<em>` → Instrument Serif Italic (+%12 optik). `.lead`, `.body-s`, `.muted`, `.soft` (ikinci ton). `.kicker` numaralı etiket: `<span class="kicker"><b>01</b><span class="dash"></span>HİZMETLER</span>` (Hanken büyük harf). Boyutlar `tokens.css` (`--t-*`).

## Düğme ve etiket
`.pill.pill--primary` (lime/siyah, tema'ya göre), `.pill.pill--glass` (ikincil), `.pill--sm` (40 px). `.link` metin bağlantısı (ok `→` svg). `.tag` + `.tags` etiket pill. Odak halkası 2 px, tema'ya göre lime/siyah.

## Hareket
- **Reveal:** öğeye `data-reveal` (+ kademe için `style="--i:n"`). JS yoksa/geç gelirse görünür; `ui.js` yalnız ekran altı öğelere `.rv-wait` ekler. `data-reveal="fade"` yalnız opacity.
- **Hero girişi:** `data-in` + `--i`. H1 hiçbir zaman gizlenmez.
- **Sahneler:** `data-scene="pin"` (sabitlenmiş sahne; `--p` 0–1 bölüm boyunca) veya `"view"`; `data-steps="n"` verilirse `data-step` (1..n) ve `data-end="1"` (son %6) yazılır. `data-count="N"` sayaç (sayı HTML'de metin). `data-pause-offscreen` sonsuz animasyonu görünmezken durdurur.
- Yalnız `transform`/`opacity`. `prefers-reduced-motion`: animasyon/geçiş kapalı, reveal ve hero girişi anında görünür.

## Kurallar (kalite kapısı)
Keskin köşe yok (12/16/24/32/pill). Açık zeminde lime yok. Mono font yok, özel imleç yok. Görsel kaynağından büyük gösterilmez, tek görsel dil (gerçek ekran + tek çerçeve **ya da** kodla çizilmiş tek çizgi şema). Ana sayfada proje yok.
