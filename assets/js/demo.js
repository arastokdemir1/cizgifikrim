/**
 * CizgiFikrim — E-Ticaret Mesajlaşma Prototipi
 * Pure Vanilla JS (ES6+) — 0 Bağımlılık, < 50ms Reaktivite, XSS Korumalı
 */

(function () {
  'use strict';

  // --- Yardımcı Güvenlik Fonksiyonu (XSS Koruması) ---
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Para & Rakam Formatlayıcı ---
  function formatMoney(amount) {
    const num = Math.round(Number(amount) || 0);
    return num.toLocaleString('tr-TR') + ' ₺';
  }

  // --- Sektörel Önayar Veritabanı ---
  const PRESETS = {
    fashion: {
      id: 'fashion',
      label: 'Moda & Tekstil',
      store: 'Aura Butik',
      customer: 'Zeynep Kaya',
      product: 'Oversize Yün Kaşe Kaban (Taş Rengi - M)',
      amount: '3.450 ₺',
      rawAmount: 3450,
      discountCode: 'KURTAR10',
      icon: '🧥'
    },
    cosmetics: {
      id: 'cosmetics',
      label: 'Kozmetik & Bakım',
      store: 'Lumina Botanics',
      customer: 'Elif Demir',
      product: 'Hyalüronik Asit & Peptid Onarıcı Cilt Serumu 50ml',
      amount: '1.280 ₺',
      rawAmount: 1280,
      discountCode: 'LUMINA15',
      icon: '✨'
    },
    jewelry: {
      id: 'jewelry',
      label: 'Aksesuar & Takı',
      store: 'Vera Jewelry',
      customer: 'Canan Yıldız',
      product: '14 Ayar Altın Kaplama Baget Kesim Kolye',
      amount: '2.150 ₺',
      rawAmount: 2150,
      discountCode: 'PARLAK12',
      icon: '💍'
    }
  };

  // --- Uygulama Durumu (State) ---
  const state = {
    mode: 'mode_1', // 'mode_1' (Starter: Sepet) | 'mode_2' (Growth: Satış Botu)
    mobileView: 'preview', // 'preview' | 'controls'
    activePreset: 'fashion',
    store: PRESETS.fashion.store,
    customer: PRESETS.fashion.customer,
    product: PRESETS.fashion.product,
    amount: PRESETS.fashion.amount,
    discountCode: PRESETS.fashion.discountCode,
    productIcon: PRESETS.fashion.icon,
    monthlyRevenue: 350000,
    soundEnabled: false,
    audioCtx: null,
    isFlowInProgress: false,
    timer: null
  };

  // --- DOM Elemanları ---
  const elements = {
    demoStudio: document.querySelector('.demo-studio'),
    whatsappDemo: document.getElementById('whatsapp-demo'),
    closeWhatsappDemo: document.getElementById('btn-close-whatsapp-demo'),
    mobileViewTabs: document.querySelectorAll('.demo-view-tab'),
    btnGotoPreview: document.getElementById('btn-goto-preview'),
    btnGotoSettings: document.getElementById('btn-goto-settings'),
    modeTabs: document.querySelectorAll('.demo-mode-tab'),
    presetBtns: document.querySelectorAll('.demo-preset-btn'),
    inputStore: document.getElementById('input-store'),
    inputCustomer: document.getElementById('input-customer'),
    inputProduct: document.getElementById('input-product'),
    inputAmount: document.getElementById('input-amount'),
    inputDiscount: document.getElementById('input-discount'),
    // ROI
    roiSlider: document.getElementById('roi-slider'),
    roiRevenueVal: document.getElementById('roi-revenue-val'),
    roiMonthlyRecovered: document.getElementById('roi-monthly-recovered'),
    roiAnnualRecovered: document.getElementById('roi-annual-recovered'),
    roiAmortizationBadge: document.getElementById('roi-amortization-badge'),
    roiPillBtns: document.querySelectorAll('.roi-pill-btn'),
    // Mockup
    waHeaderAvatar: document.getElementById('wa-header-avatar'),
    waHeaderName: document.getElementById('wa-header-name'),
    waChatBody: document.getElementById('wa-chat-body'),
    waToastAlert: document.getElementById('wa-toast-alert'),
    waToastText: document.getElementById('wa-toast-text'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    btnReplay: document.getElementById('btn-replay'),
    currentTimeLabel: document.getElementById('current-time-label')
  };

  // --- Saat Güncelleyici (iPhone status bar & message timestamps) ---
  function getTimeString() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  function updateClock() {
    if (elements.currentTimeLabel) {
      elements.currentTimeLabel.textContent = getTimeString();
    }
  }

  // --- Web Audio API ile Minimal Bildirim Sesi ---
  function playBeep(type) {
    if (!state.soundEnabled) return;
    try {
      if (!state.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          state.audioCtx = new AudioContextClass();
        }
      }
      if (!state.audioCtx) return;
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }

      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);

      const now = state.audioCtx.currentTime;
      if (type === 'pop') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      // AudioContext engellendiyse sessizce devam et
    }
  }

  // --- Fallback & Getter Fonksiyonları ---
  function getSafeStoreName() {
    const val = state.store ? state.store.trim() : '';
    return val || 'Mağazanız';
  }

  function getSafeCustomerName() {
    const val = state.customer ? state.customer.trim() : '';
    return val || 'Değerli Müşterimiz';
  }

  function getSafeProductName() {
    const val = state.product ? state.product.trim() : '';
    return val || 'Sepetinizdeki Ürünler';
  }

  function getSafeAmount() {
    const val = state.amount ? state.amount.trim() : '';
    return val || '3.450 ₺';
  }

  function getSafeDiscountCode() {
    const val = state.discountCode ? state.discountCode.trim() : '';
    return val || 'KURTAR10';
  }

  // İndirimli tutar hesaplama (Varsayılan %10)
  function getDiscountedAmount(originalStr) {
    const numeric = parseFloat(originalStr.replace(/[^0-9]/g, ''));
    if (!numeric || isNaN(numeric)) return '3.105 ₺';
    const discounted = Math.round(numeric * 0.9);
    return discounted.toLocaleString('tr-TR') + ' ₺';
  }

  // --- ROI Hesaplayıcısı Motoru ---
  function calculateROI(revenue) {
    // Sınır koruması
    let rev = Number(revenue);
    if (isNaN(rev) || rev < 50000) rev = 50000;
    if (rev > 2500000) rev = 2500000;

    // Spesifikasyon Formülü:
    // Illustrative scenario only; this 20% assumption is not measured performance.
    const monthlyRecovered = Math.round(rev * 0.20);
    const annualRecovered = monthlyRecovered * 12;

    // Amortisman süresi: 7.500 ₺ starter kurulum / (günlük ek ciro)
    const dailyGain = monthlyRecovered / 30;
    let daysToAmortize = Math.ceil(7500 / dailyGain);
    if (daysToAmortize < 1) daysToAmortize = 1;

    return {
      revenue: rev,
      monthlyRecovered,
      annualRecovered,
      daysToAmortize
    };
  }

  function updateActiveROIPill(revenue) {
    if (!elements.roiPillBtns) return;
    const rev = Number(revenue);
    elements.roiPillBtns.forEach(pill => {
      const val = Number(pill.getAttribute('data-value'));
      pill.classList.toggle('is-active', val === rev);
    });
  }

  function updateROIDisplay() {
    const roi = calculateROI(state.monthlyRevenue);

    if (elements.roiRevenueVal) {
      elements.roiRevenueVal.textContent = formatMoney(roi.revenue) + ' / ay';
    }
    if (elements.roiMonthlyRecovered) {
      elements.roiMonthlyRecovered.textContent = '+' + formatMoney(roi.monthlyRecovered) + ' / ay';
    }
    if (elements.roiAnnualRecovered) {
      elements.roiAnnualRecovered.textContent = '+' + formatMoney(roi.annualRecovered) + ' / yıl';
    }
    if (elements.roiAmortizationBadge) {
      elements.roiAmortizationBadge.textContent = 'Örnek varsayım, gerçek sonuç değildir';
    }
    updateActiveROIPill(state.monthlyRevenue);
  }

  // --- Toast Bildirimi Gösterimi ---
  function showToast(message, duration = 3200) {
    if (!elements.waToastAlert || !elements.waToastText) return;
    elements.waToastText.textContent = message;
    elements.waToastAlert.classList.add('is-visible');
    playBeep('success');

    setTimeout(() => {
      elements.waToastAlert.classList.remove('is-visible');
    }, duration);
  }

  // --- WhatsApp Header Reaktif Güncelleme ---
  function updateWhatsAppHeader() {
    const safeStore = getSafeStoreName();
    if (elements.waHeaderName) {
      elements.waHeaderName.textContent = safeStore;
    }
    if (elements.waHeaderAvatar) {
      // Mağaza adının ilk 2 harfi
      const initials = safeStore
        .split(' ')
        .map(w => w.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'CF';
      elements.waHeaderAvatar.textContent = initials;
    }
  }

  // --- Sohbet Ekranını Temizle ve Güvenlik Kutusunu Ekle ---
  function resetChatBody() {
    if (!elements.waChatBody) return;
    elements.waChatBody.innerHTML = `
      <div class="wa-security-box">
        🔒 Bu işletme CizgiFikrim resmi WhatsApp Business API kullanmaktadır. Mesajlar uçtan uca şifrelidir.
      </div>
      <div class="wa-date-divider">BUGÜN</div>
    `;
  }

  // --- Yazıyor... Baloncuğu Göster / Gizle ---
  function showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'wa-typing-bubble js-typing';
    typingEl.innerHTML = `
      <span class="wa-typing-dot"></span>
      <span class="wa-typing-dot"></span>
      <span class="wa-typing-dot"></span>
    `;
    elements.waChatBody.appendChild(typingEl);
    elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
    return typingEl;
  }

  function removeTypingIndicator() {
    const typings = elements.waChatBody.querySelectorAll('.js-typing');
    typings.forEach(el => el.remove());
  }

  // --- Mesaj Render Motoru ---

  // MOD 1: Terk Edilmiş Sepet (Starter)
  function renderMode1Chat() {
    clearTimeout(state.timer);
    resetChatBody();
    state.isFlowInProgress = true;

    // Reaktif başlık
    updateWhatsAppHeader();

    // 400ms Yazıyor animasyonu
    showTypingIndicator();

    state.timer = setTimeout(() => {
      removeTypingIndicator();
      playBeep('pop');

      const safeStore = escapeHTML(getSafeStoreName());
      const safeCustomer = escapeHTML(getSafeCustomerName());
      const safeProduct = escapeHTML(getSafeProductName());
      const safeAmount = escapeHTML(getSafeAmount());
      const safeDiscountCode = escapeHTML(getSafeDiscountCode());
      const discounted = escapeHTML(getDiscountedAmount(state.amount));
      const timeStr = getTimeString();

      const bubbleWrap = document.createElement('div');
      bubbleWrap.className = 'wa-bubble-wrap wa-incoming js-primary-bubble';
      bubbleWrap.innerHTML = `
        <div class="wa-bubble">
          <div>Merhaba <strong>${safeCustomer}</strong>! 🌸 <strong>${safeStore}</strong> sepetinizde unuttuğunuz <strong>${safeProduct}</strong> tükenmek üzere. Sizin için sepetinizi 2 saatliğine ayırdık ve sepetinize özel <strong>${safeDiscountCode}</strong> kodu ile ekstra indirim tanımladık.</div>
          
          <div class="wa-product-card">
            <div class="wa-product-card-thumb">${state.productIcon || '🛍️'}</div>
            <div class="wa-product-card-body">
              <div class="wa-product-card-title">${safeProduct}</div>
              <div class="wa-product-card-pricing">
                <span class="wa-price-old">${safeAmount}</span>
                <span class="wa-price-new">${discounted}</span>
              </div>
              <span class="wa-stock-tag">⚡ Son 2 Adet</span>
            </div>
          </div>

          <div class="wa-bubble-meta">
            <span>${timeStr}</span>
          </div>
        </div>

        <div class="wa-action-buttons js-actions-mode1">
          <button type="button" class="wa-action-btn is-primary-action js-btn-complete-cart">
            🛒 Sepeti Tek Tıkla Tamamla ➔
          </button>
          <button type="button" class="wa-action-btn js-btn-ask-size">
            💬 Beden / Kargo Danış
          </button>
        </div>
      `;

      elements.waChatBody.appendChild(bubbleWrap);
      elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
      state.isFlowInProgress = false;

      // Aksiyon Buton Dinleyicileri
      bindMode1Actions();
    }, 400);
  }

  function bindMode1Actions() {
    const btnComplete = elements.waChatBody.querySelector('.js-btn-complete-cart');
    const btnAskSize = elements.waChatBody.querySelector('.js-btn-ask-size');

    if (btnComplete) {
      btnComplete.addEventListener('click', function () {
        if (this.disabled) return;
        this.disabled = true;
        this.textContent = 'Yönlendiriliyor...';
        if (btnAskSize) btnAskSize.disabled = true;

        // Kullanıcı yanıt balonu (giden)
        const userWrap = document.createElement('div');
        userWrap.className = 'wa-bubble-wrap wa-outgoing';
        userWrap.innerHTML = `
          <div class="wa-bubble">
            <div>Siparişimi tamamlamak istiyorum 🛍️</div>
            <div class="wa-bubble-meta">
              <span>${getTimeString()}</span>
              <span class="wa-ticks-blue">✓✓</span>
            </div>
          </div>
        `;
        elements.waChatBody.appendChild(userWrap);
        elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
        playBeep('pop');

        // Toast bildirimi
        showToast('🎉 Sepet Kilitlendi! %10 İndirim Shopify Checkout\'a uygulandı.');

        // 450ms sonra teyit mesajı
        setTimeout(() => {
          showTypingIndicator();
          setTimeout(() => {
            removeTypingIndicator();
            playBeep('success');

            const safeCustomer = escapeHTML(getSafeCustomerName());
            const safeDiscount = escapeHTML(getSafeDiscountCode());

            const confirmWrap = document.createElement('div');
            confirmWrap.className = 'wa-bubble-wrap wa-incoming';
            confirmWrap.innerHTML = `
              <div class="wa-bubble">
                <div>🎉 Tebrikler <strong>${safeCustomer}</strong>! <strong>${safeDiscount}</strong> kuponu başarıyla uygulandı.<br><br>Siparişiniz alındı (#CF-84920). Kargonuz yarın yola çıkıyor. Bizi tercih ettiğiniz için teşekkür ederiz!</div>
                <div class="wa-bubble-meta">
                  <span>${getTimeString()}</span>
                </div>
              </div>
            `;
            elements.waChatBody.appendChild(confirmWrap);
            elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
          }, 350);
        }, 300);
      });
    }

    if (btnAskSize) {
      btnAskSize.addEventListener('click', function () {
        if (this.disabled) return;
        this.disabled = true;
        if (btnComplete) btnComplete.disabled = true;

        const userWrap = document.createElement('div');
        userWrap.className = 'wa-bubble-wrap wa-outgoing';
        userWrap.innerHTML = `
          <div class="wa-bubble">
            <div>Farklı beden veya kargo süreleri hakkında bilgi alabilir miyim?</div>
            <div class="wa-bubble-meta">
              <span>${getTimeString()}</span>
              <span class="wa-ticks-blue">✓✓</span>
            </div>
          </div>
        `;
        elements.waChatBody.appendChild(userWrap);
        elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
        playBeep('pop');

        setTimeout(() => {
          showTypingIndicator();
          setTimeout(() => {
            removeTypingIndicator();
            playBeep('pop');

            const safeCustomer = escapeHTML(getSafeCustomerName());
            const answerWrap = document.createElement('div');
            answerWrap.className = 'wa-bubble-wrap wa-incoming';
            answerWrap.innerHTML = `
              <div class="wa-bubble">
                <div>Tabii ki <strong>${safeCustomer}</strong>! Siparişleriniz aynı gün Yurtiçi Kargo ile yola çıkar ve 1-2 iş gününde teslim edilir. Tüm bedenlerde 14 gün ücretsiz değişim mevcuttur. Dilerseniz siparişinizi hemen onaylayabilirsiniz.</div>
                <div class="wa-bubble-meta">
                  <span>${getTimeString()}</span>
                </div>
              </div>
            `;
            elements.waChatBody.appendChild(answerWrap);
            elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
          }, 350);
        }, 300);
      });
    }
  }

  // MOD 2: Satış Asistanı (Growth)
  function renderMode2Chat() {
    clearTimeout(state.timer);
    resetChatBody();
    state.isFlowInProgress = true;

    updateWhatsAppHeader();

    const safeProduct = escapeHTML(getSafeProductName());
    const safeCustomer = escapeHTML(getSafeCustomerName());
    const safeAmount = escapeHTML(getSafeAmount());
    const timeStr = getTimeString();

    // 1. Adım: Müşterinin Instagram'dan gelen sıcak sorusu (giden balon)
    const clientWrap = document.createElement('div');
    clientWrap.className = 'wa-bubble-wrap wa-outgoing';
    clientWrap.innerHTML = `
      <div class="wa-bubble">
        <div>Merhaba! Instagram reklamındaki <strong>${safeProduct}</strong> için yazıyorum. Boyum 1.68, kilom 60. Hangi beden almalıyım ve stokta var mı acaba?</div>
        <div class="wa-bubble-meta">
          <span>${timeStr}</span>
          <span class="wa-ticks-blue">✓✓</span>
        </div>
      </div>
    `;
    elements.waChatBody.appendChild(clientWrap);
    playBeep('pop');

    // 2. Adım: 400ms typing sonrası Botun nokta atışı beden tavsiyesi
    showTypingIndicator();

    state.timer = setTimeout(() => {
      removeTypingIndicator();
      playBeep('pop');

      const botWrap = document.createElement('div');
      botWrap.className = 'wa-bubble-wrap wa-incoming js-primary-bubble';
      botWrap.innerHTML = `
        <div class="wa-bubble">
          <div>Merhaba <strong>${safeCustomer}</strong>! Harika bir tercih ✨ Ölçülerinize göre en dökümlü ve rahat kalıp <strong>M Beden</strong> olacaktır. Şu anda merkez depomuzda son 3 adet kaldı! Sizin adınıza 1 adet ayırıp anlık güvenli ödeme bağlantısı oluşturalım mı?</div>
          <div class="wa-bubble-meta">
            <span>${getTimeString()}</span>
          </div>
        </div>

        <div class="wa-action-buttons js-actions-mode2">
          <button type="button" class="wa-action-btn is-primary-action js-btn-buy-instant">
            ⚡ Hemen M Beden Satın Al (Hızlı Ödeme)
          </button>
          <button type="button" class="wa-action-btn js-btn-view-terms">
            📏 Kumaş &amp; Değişim Koşullarını Gör
          </button>
        </div>
      `;

      elements.waChatBody.appendChild(botWrap);
      elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
      state.isFlowInProgress = false;

      bindMode2Actions();
    }, 400);
  }

  function bindMode2Actions() {
    const btnBuy = elements.waChatBody.querySelector('.js-btn-buy-instant');
    const btnTerms = elements.waChatBody.querySelector('.js-btn-view-terms');

    if (btnBuy) {
      btnBuy.addEventListener('click', function () {
        if (this.disabled) return;
        this.disabled = true;
        this.textContent = 'Ödeme Linki Hazırlanıyor...';
        if (btnTerms) btnTerms.disabled = true;

        const userWrap = document.createElement('div');
        userWrap.className = 'wa-bubble-wrap wa-outgoing';
        userWrap.innerHTML = `
          <div class="wa-bubble">
            <div>Evet lütfen, M Beden için hemen ödeme linki alabilir miyim? 💳</div>
            <div class="wa-bubble-meta">
              <span>${getTimeString()}</span>
              <span class="wa-ticks-blue">✓✓</span>
            </div>
          </div>
        `;
        elements.waChatBody.appendChild(userWrap);
        elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
        playBeep('pop');

        showToast('🎯 Sıcak Reklam Satışa Döndü! Yanıt süresi: 3 saniye.');

        setTimeout(() => {
          showTypingIndicator();
          setTimeout(() => {
            removeTypingIndicator();
            playBeep('success');

            const safeAmount = escapeHTML(getSafeAmount());
            const payWrap = document.createElement('div');
            payWrap.className = 'wa-bubble-wrap wa-incoming';
            payWrap.innerHTML = `
              <div class="wa-bubble">
                <div>Ödeme linkiniz hazırlandı 💳 PayTR 3D Secure güvencesiyle tek tıkla siparişinizi tamamlayabilirsiniz:<br><br>
                🔗 <strong>pay.cizgifikrim.net/checkout/m-beden-siparis</strong><br>
                Tutar: <strong>${safeAmount}</strong> (Kargo Ücretsiz)</div>
                <div class="wa-bubble-meta">
                  <span>${getTimeString()}</span>
                </div>
              </div>
            `;
            elements.waChatBody.appendChild(payWrap);
            elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
          }, 350);
        }, 300);
      });
    }

    if (btnTerms) {
      btnTerms.addEventListener('click', function () {
        if (this.disabled) return;
        this.disabled = true;
        if (btnBuy) btnBuy.disabled = true;

        const userWrap = document.createElement('div');
        userWrap.className = 'wa-bubble-wrap wa-outgoing';
        userWrap.innerHTML = `
          <div class="wa-bubble">
            <div>Kumaş içeriği ve olası beden değişiminde süreç nasıl işliyor?</div>
            <div class="wa-bubble-meta">
              <span>${getTimeString()}</span>
              <span class="wa-ticks-blue">✓✓</span>
            </div>
          </div>
        `;
        elements.waChatBody.appendChild(userWrap);
        elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
        playBeep('pop');

        setTimeout(() => {
          showTypingIndicator();
          setTimeout(() => {
            removeTypingIndicator();
            playBeep('pop');

            const termsWrap = document.createElement('div');
            termsWrap.className = 'wa-bubble-wrap wa-incoming';
            termsWrap.innerHTML = `
              <div class="wa-bubble">
                <div>Ürünümüz %100 birinci sınıf doğal içerikli olup alerjen içermez. Beden uymaması halinde WhatsApp üzerinden kapınızdan kurye ile 14 gün ücretsiz değişim imkanı sunuyoruz. Dilerseniz siparişinizi hemen oluşturabiliriz!</div>
                <div class="wa-bubble-meta">
                  <span>${getTimeString()}</span>
                </div>
              </div>
            `;
            elements.waChatBody.appendChild(termsWrap);
            elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
          }, 350);
        }, 300);
      });
    }
  }

  // MOD 3: VIP & Sadakat (Scale / VIP)
  function renderMode3Chat() {
    clearTimeout(state.timer);
    resetChatBody();
    state.isFlowInProgress = true;

    updateWhatsAppHeader();

    const safeStore = escapeHTML(getSafeStoreName());
    const safeProduct = escapeHTML(getSafeProductName());
    const safeCustomer = escapeHTML(getSafeCustomerName());
    const timeStr = getTimeString();

    // 1. Adım: Teslimat bildirimi ve botun otomatik memnuniyet/yorum talebi
    showTypingIndicator();

    state.timer = setTimeout(() => {
      removeTypingIndicator();
      playBeep('pop');

      const botWrap = document.createElement('div');
      botWrap.className = 'wa-bubble-wrap wa-incoming js-primary-bubble';
      botWrap.innerHTML = `
        <div class="wa-bubble">
          <div>Merhaba <strong>${safeCustomer}</strong>! 🌸 <strong>${safeStore}</strong> mağazamızdan aldığınız <strong>${safeProduct}</strong> az önce teslim edildi. Ürününüzü keyifle kullanmanızı dileriz! Deneyiminizi bizimle paylaşıp fotoğraflı değerlendirme bırakırsanız bir sonraki alışverişinizde geçerli <strong>%15 VIP İndirim</strong> hesabınıza tanımlanacaktır ✨</div>
          <div class="wa-bubble-meta">
            <span>${timeStr}</span>
          </div>
        </div>

        <div class="wa-action-buttons js-actions-mode3">
          <button type="button" class="wa-action-btn is-primary-action js-btn-review-5star">
            ⭐ 5 Yıldız &amp; Fotoğraflı Yorum Bırak
          </button>
          <button type="button" class="wa-action-btn js-btn-repeat-order">
            🔄 Otomatik Tüketim / Yenileme Döngüsüne Katıl
          </button>
        </div>
      `;

      elements.waChatBody.appendChild(botWrap);
      elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
      state.isFlowInProgress = false;

      bindMode3Actions();
    }, 400);
  }

  function bindMode3Actions() {
    const btnReview = elements.waChatBody.querySelector('.js-btn-review-5star');
    const btnRepeat = elements.waChatBody.querySelector('.js-btn-repeat-order');

    if (btnReview) {
      btnReview.addEventListener('click', function () {
        if (this.disabled) return;
        this.disabled = true;
        this.textContent = 'Yorum Gönderiliyor...';
        if (btnRepeat) btnRepeat.disabled = true;

        const userWrap = document.createElement('div');
        userWrap.className = 'wa-bubble-wrap wa-outgoing';
        userWrap.innerHTML = `
          <div class="wa-bubble">
            <div>Ürüne bayıldım! Kumaşı ve kalıbı kusursuz, beklediğimden de kaliteli geldi. 5 yıldız veriyorum! 📸⭐</div>
            <div class="wa-bubble-meta">
              <span>${getTimeString()}</span>
              <span class="wa-ticks-blue">✓✓</span>
            </div>
          </div>
        `;
        elements.waChatBody.appendChild(userWrap);
        elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
        playBeep('pop');

        showToast('💎 Sosyal Kanıt & VIP Sadakat Puanı Kazanıldı!');

        setTimeout(() => {
          showTypingIndicator();
          setTimeout(() => {
            removeTypingIndicator();
            playBeep('success');

            const safeCustomer = escapeHTML(getSafeCustomerName());
            const rewardWrap = document.createElement('div');
            rewardWrap.className = 'wa-bubble-wrap wa-incoming';
            rewardWrap.innerHTML = `
              <div class="wa-bubble">
                <div>Harika geri bildiriminiz için teşekkürler <strong>${safeCustomer}</strong>! Fotoğraflı yorumunuz onaylandı ve mağazamızda yayınlandı 🎉<br><br>Size özel <strong>VIP15</strong> indirim kuponunuz tanımlandı. 30 gün içinde tüm ürünlerde kullanabilirsiniz.</div>
                <div class="wa-bubble-meta">
                  <span>${getTimeString()}</span>
                </div>
              </div>
            `;
            elements.waChatBody.appendChild(rewardWrap);
            elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
          }, 350);
        }, 300);
      });
    }

    if (btnRepeat) {
      btnRepeat.addEventListener('click', function () {
        if (this.disabled) return;
        this.disabled = true;
        if (btnReview) btnReview.disabled = true;

        const userWrap = document.createElement('div');
        userWrap.className = 'wa-bubble-wrap wa-outgoing';
        userWrap.innerHTML = `
          <div class="wa-bubble">
            <div>Ürünüm bittiğinde otomatik hatırlatma ve tek tıkla yenileme almak istiyorum 🔄</div>
            <div class="wa-bubble-meta">
              <span>${getTimeString()}</span>
              <span class="wa-ticks-blue">✓✓</span>
            </div>
          </div>
        `;
        elements.waChatBody.appendChild(userWrap);
        elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
        playBeep('pop');

        setTimeout(() => {
          showTypingIndicator();
          setTimeout(() => {
            removeTypingIndicator();
            playBeep('pop');

            const repeatWrap = document.createElement('div');
            repeatWrap.className = 'wa-bubble-wrap wa-incoming';
            repeatWrap.innerHTML = `
              <div class="wa-bubble">
                <div>Tüketim döngüsü hatırlatıcınız kuruldu! Ürününüzün tahmini tükenme süresinden 5 gün önce size özel tek tıkla hızlı sipariş linki ileteceğiz 📦</div>
                <div class="wa-bubble-meta">
                  <span>${getTimeString()}</span>
                </div>
              </div>
            `;
            elements.waChatBody.appendChild(repeatWrap);
            elements.waChatBody.scrollTop = elements.waChatBody.scrollHeight;
          }, 350);
        }, 300);
      });
    }
  }

  // --- Genel Senaryo Başlatıcı ---
  function runCurrentScenario() {
    if (state.mode === 'mode_1') {
      renderMode1Chat();
    } else if (state.mode === 'mode_3') {
      renderMode3Chat();
    } else {
      renderMode2Chat();
    }
  }

  // --- Hızlı Reaktif Güncelleme (< 50ms) ---
  // Form inputları değiştikçe mevcut mesajlar içindeki metinleri canlı yeniler
  function syncInputsToPreview() {
    updateWhatsAppHeader();

    // Eğer birincil mesaj ekranda duruyorsa içindeki değerleri reaktif olarak güncelle
    const primaryBubble = elements.waChatBody.querySelector('.js-primary-bubble');
    if (!primaryBubble) {
      runCurrentScenario();
      return;
    }

    const safeStore = escapeHTML(getSafeStoreName());
    const safeCustomer = escapeHTML(getSafeCustomerName());
    const safeProduct = escapeHTML(getSafeProductName());
    const safeAmount = escapeHTML(getSafeAmount());
    const safeDiscountCode = escapeHTML(getSafeDiscountCode());
    const discounted = escapeHTML(getDiscountedAmount(state.amount));

    if (state.mode === 'mode_1') {
      const bubbleText = primaryBubble.querySelector('.wa-bubble > div:first-child');
      if (bubbleText) {
        bubbleText.innerHTML = `Merhaba <strong>${safeCustomer}</strong>! 🌸 <strong>${safeStore}</strong> sepetinizde unuttuğunuz <strong>${safeProduct}</strong> tükenmek üzere. Sizin için sepetinizi 2 saatliğine ayırdık ve sepetinize özel <strong>${safeDiscountCode}</strong> kodu ile ekstra indirim tanımladık.`;
      }
      const productTitle = primaryBubble.querySelector('.wa-product-card-title');
      if (productTitle) productTitle.textContent = getSafeProductName();
      const oldPrice = primaryBubble.querySelector('.wa-price-old');
      if (oldPrice) oldPrice.textContent = safeAmount;
      const newPrice = primaryBubble.querySelector('.wa-price-new');
      if (newPrice) newPrice.textContent = discounted;
    } else if (state.mode === 'mode_3') {
      const bubbleText = primaryBubble.querySelector('.wa-bubble > div:first-child');
      if (bubbleText) {
        bubbleText.innerHTML = `Merhaba <strong>${safeCustomer}</strong>! 🌸 <strong>${safeStore}</strong> mağazamızdan aldığınız <strong>${safeProduct}</strong> az önce teslim edildi. Ürününüzü keyifle kullanmanızı dileriz! Deneyiminizi bizimle paylaşıp fotoğraflı değerlendirme bırakırsanız bir sonraki alışverişinizde geçerli <strong>%15 VIP İndirim</strong> hesabınıza tanımlanacaktır ✨`;
      }
    } else {
      const bubbleText = primaryBubble.querySelector('.wa-bubble > div:first-child');
      if (bubbleText) {
        bubbleText.innerHTML = `Merhaba <strong>${safeCustomer}</strong>! Harika bir tercih ✨ Ölçülerinize göre en dökümlü ve rahat kalıp <strong>M Beden</strong> olacaktır. Şu anda merkez depomuzda son 3 adet kaldı! Sizin adınıza 1 adet ayırıp anlık güvenli ödeme bağlantısı oluşturalım mı?`;
      }
    }
  }

  // --- Sektör Önayarı Yükleme ---
  function applyPreset(presetKey, shouldRunScenario = true) {
    const p = PRESETS[presetKey];
    if (!p) return;

    state.activePreset = presetKey;
    state.store = p.store;
    state.customer = p.customer;
    state.product = p.product;
    state.amount = p.amount;
    state.discountCode = p.discountCode;
    state.productIcon = p.icon;

    // Form alanlarına yaz
    if (elements.inputStore) elements.inputStore.value = p.store;
    if (elements.inputCustomer) elements.inputCustomer.value = p.customer;
    if (elements.inputProduct) elements.inputProduct.value = p.product;
    if (elements.inputAmount) elements.inputAmount.value = p.amount;
    if (elements.inputDiscount) elements.inputDiscount.value = p.discountCode;

    // Buton aktiflik sınıfları
    elements.presetBtns.forEach(btn => {
      if (btn.getAttribute('data-preset') === presetKey) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    if (shouldRunScenario) {
      runCurrentScenario();
    }
  }

  // --- Mod Değiştirici (Switch Mode) ---
  function switchMode(targetMode) {
    let modeKey = 'mode_1';
    if (targetMode === 3 || targetMode === '3' || targetMode === 'mode_3' || targetMode === 'vip' || targetMode === 'scale') {
      modeKey = 'mode_3';
    } else if (targetMode === 2 || targetMode === '2' || targetMode === 'mode_2' || targetMode === 'sales' || targetMode === 'growth') {
      modeKey = 'mode_2';
    } else {
      modeKey = 'mode_1';
    }

    state.mode = modeKey;

    if (!elements.modeTabs || elements.modeTabs.length === 0) {
      elements.modeTabs = document.querySelectorAll('.demo-mode-tab');
    }

    elements.modeTabs.forEach(tab => {
      const isTarget = tab.getAttribute('data-mode') === modeKey;
      tab.classList.toggle('is-active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      tab.setAttribute('aria-pressed', isTarget ? 'true' : 'false');
    });

    runCurrentScenario();
  }

  // --- Mobil Segmentli Görünüm Değiştirici (< 1024px) ---
  function switchMobileView(targetView) {
    const validView = targetView === 'controls' ? 'controls' : 'preview';
    state.mobileView = validView;

    if (!elements.demoStudio) {
      elements.demoStudio = document.querySelector('.demo-studio');
    }
    if (!elements.mobileViewTabs || elements.mobileViewTabs.length === 0) {
      elements.mobileViewTabs = document.querySelectorAll('.demo-view-tab');
    }

    if (elements.demoStudio) {
      elements.demoStudio.setAttribute('data-mobile-view', validView);
    }

    if (elements.mobileViewTabs && elements.mobileViewTabs.length > 0) {
      elements.mobileViewTabs.forEach(tab => {
        const isTarget = tab.getAttribute('data-target') === validView;
        tab.classList.toggle('is-active', isTarget);
        tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      });
    }

    // Önizleme ekranına geçildiğinde son form verilerini yansıt
    if (validView === 'preview') {
      syncInputsToPreview();
    }

    // Mobilde stüdyo başlangıcına akıcı kaydır
    if (window.innerWidth < 1024 && elements.demoStudio) {
      const studioRect = elements.demoStudio.getBoundingClientRect();
      const offsetTop = window.pageYOffset + studioRect.top - 80;
      window.scrollTo({
        top: Math.max(0, offsetTop),
        behavior: 'smooth'
      });
    }
  }

  // Konsoldan veya dış testlerden erişim için dışa aktar
  window.switchMode = switchMode;
  window.switchMobileView = switchMobileView;

  // --- Olay Dinleyicileri (Event Listeners) ---
  function initEvents() {
    // 1. Mod Seçici Sekmeler
    if (!elements.modeTabs || elements.modeTabs.length === 0) {
      elements.modeTabs = document.querySelectorAll('.demo-mode-tab');
    }
    elements.modeTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        const mode = this.getAttribute('data-mode');
        if (!mode || mode === state.mode) return;
        switchMode(mode);
      });
    });

    // 2. Hazır Sektör Butonları
    elements.presetBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const presetKey = this.getAttribute('data-preset');
        applyPreset(presetKey);
      });
    });

    // 3. Form Inputları Dinleme (< 50ms Reaktivite)
    const bindInput = (el, propName) => {
      if (!el) return;
      el.addEventListener('input', function () {
        state[propName] = this.value;
        syncInputsToPreview();
      });
    };

    bindInput(elements.inputStore, 'store');
    bindInput(elements.inputCustomer, 'customer');
    bindInput(elements.inputProduct, 'product');
    bindInput(elements.inputAmount, 'amount');
    bindInput(elements.inputDiscount, 'discountCode');

    // 4. ROI Slider
    if (elements.roiSlider) {
      elements.roiSlider.addEventListener('input', function () {
        state.monthlyRevenue = Number(this.value) || 350000;
        updateROIDisplay();
      });
    }

    // 5. Replay (Yeniden Oynat) Butonu
    if (elements.btnReplay) {
      elements.btnReplay.addEventListener('click', function () {
        runCurrentScenario();
      });
    }

    // 6. Ses Toggle Butonu
    if (elements.btnSoundToggle) {
      elements.btnSoundToggle.addEventListener('click', function () {
        state.soundEnabled = !state.soundEnabled;
        this.classList.toggle('is-active', state.soundEnabled);
        this.setAttribute('title', state.soundEnabled ? 'Sesi Kapat' : 'Sesi Aç');
        this.setAttribute('aria-label', state.soundEnabled ? 'Sesi Kapat' : 'Sesi Aç');
        if (state.soundEnabled) {
          playBeep('pop');
        }
      });
    }

    // 7. Mobil Görünüm Sekmeleri (< 1024px)
    if (elements.mobileViewTabs) {
      elements.mobileViewTabs.forEach(tab => {
        tab.addEventListener('click', function () {
          const target = this.getAttribute('data-target');
          switchMobileView(target);
        });
      });
    }

    // 8. Mobilde Önizleme ve Ayar Yönlendirme Butonları
    if (elements.btnGotoPreview) {
      elements.btnGotoPreview.addEventListener('click', function () {
        switchMobileView('preview');
      });
    }

    if (elements.btnGotoSettings) {
      elements.btnGotoSettings.addEventListener('click', function () {
        switchMobileView('controls');
      });
    }

    // 9. ROI Hızlı Bütçe Hapları (Quick Budget Pills)
    if (elements.roiPillBtns) {
      elements.roiPillBtns.forEach(pill => {
        pill.addEventListener('click', function () {
          const val = Number(this.getAttribute('data-value'));
          if (!val) return;
          state.monthlyRevenue = val;
          if (elements.roiSlider) {
            elements.roiSlider.value = val;
          }
          updateROIDisplay();
        });
      });
    }

    // 10. Paket Kartlarındaki "Demoyu İncele" Bağlantıları (data-scenario)
    let lastDemoTrigger = null;
    document.querySelectorAll('[data-scenario]').forEach(btn => {
      btn.addEventListener('click', function (event) {
        if (!elements.whatsappDemo) return;
        event.preventDefault();

        const scenario = this.getAttribute('data-scenario');
        lastDemoTrigger = this;
        elements.whatsappDemo.hidden = false;
        if (scenario) {
          switchMode(scenario);
          if (window.innerWidth < 1024) {
            switchMobileView('preview');
          }
        }

        const demoUrl = new URL(window.location.href);
        demoUrl.hash = 'whatsapp-demo';
        window.history.replaceState(null, '', demoUrl);
        window.requestAnimationFrame(() => {
          elements.whatsappDemo.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.getElementById('whatsapp-demo-title')?.focus({ preventScroll: true });
        });
      });
    });

    if (elements.closeWhatsappDemo) {
      elements.closeWhatsappDemo.addEventListener('click', function () {
        if (!elements.whatsappDemo) return;
        elements.whatsappDemo.hidden = true;

        const pageUrl = new URL(window.location.href);
        pageUrl.hash = '';
        window.history.replaceState(null, '', pageUrl);
        lastDemoTrigger?.focus();
      });
    }
  }

  // --- Başlatıcı (Init) ---
  function init() {
    updateClock();
    setInterval(updateClock, 30000);

    // Başlangıç form alanlarını senaryoyu çalıştırmadan doldur
    applyPreset('fashion', false);
    updateROIDisplay();

    // URL parametresinden modu tespit et (?mode=sales, ?mode=growth, ?mode=cart, ?mode=starter, ?mode=vip, ?mode=scale)
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = (urlParams.get('mode') || '').toLowerCase().trim();

    if (['sales', 'growth', '2', 'mode_2'].includes(modeParam)) {
      switchMode(2);
    } else if (['vip', 'scale', '3', 'mode_3'].includes(modeParam)) {
      switchMode(3);
    } else {
      switchMode(1);
    }

    initEvents();
    switchMobileView('preview');

    if (window.location.hash === '#whatsapp-demo' && elements.whatsappDemo) {
      elements.whatsappDemo.hidden = false;
      window.requestAnimationFrame(() => elements.whatsappDemo.scrollIntoView({ block: 'start' }));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
