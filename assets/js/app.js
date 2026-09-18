document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile nav toggle ──────────────────────────────────────────────────────
  const toggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    mobileNav.id = mobileNav.id || 'mobile-nav';
    toggle.setAttribute('aria-controls', mobileNav.id);
    document.querySelectorAll('.nav-sym, .mobile-nav-sym').forEach((symbol) => {
      symbol.setAttribute('aria-hidden', 'true');
    });
    toggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // ── Hesap alanı (header) ────────────────────────────────────────────────────
  // supabase-js oturumu localStorage'da `sb-<ref>-auth-token` anahtarıyla tutar.
  // Header'daki isim yalnızca gösterim içindir; supabase-js yüklü olmayan
  // sayfalarda da (ör. Hakkında) çalışsın diye doğrudan oradan okunur. Gerçek
  // yetki kontrolü panelde ve RLS'te yapılır.
  const escapeText = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[c]));
  const readStoredUser = () => {
    try {
      const key = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k));
      if (!key) return null;
      const data = JSON.parse(localStorage.getItem(key));
      return data?.user || null;
    } catch (_) {
      return null;
    }
  };
  const userLabel = (user) => {
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || meta.user_name || meta.preferred_username || String(user.email || '').split('@')[0];
    return String(name || 'Hesabım').trim();
  };
  const authSlots = document.querySelectorAll('[data-auth-slot]');
  const guestMarkup = new Map([...authSlots].map((slot) => [slot, slot.innerHTML]));
  const renderAuth = (user) => {
    authSlots.forEach((slot) => {
      if (!user) { slot.innerHTML = guestMarkup.get(slot); return; }
      const base = slot.dataset.base || '';
      const label = userLabel(user);
      const avatarUrl = user.user_metadata?.avatar_url;
      const avatar = /^https:\/\//.test(avatarUrl || '')
        ? `<img src="${escapeText(avatarUrl)}" alt="" referrerpolicy="no-referrer">`
        : escapeText(label.charAt(0));
      const onPanel = /\/panel\.html$/.test(location.pathname) ? ' aria-current="page"' : '';
      const cls = slot.dataset.authSlot === 'mobile' ? 'mobile-nav-btn nav-user' : 'nav-user';
      slot.innerHTML = `<a href="${base}panel.html" class="${cls}" title="Panelim"${onPanel}><span class="nav-user-avatar" aria-hidden="true">${avatar}</span><span class="nav-user-name">${escapeText(label)}</span></a>`;
    });
  };
  if (authSlots.length) {
    renderAuth(readStoredUser());
    // OAuth/magic link dönüşünde oturum sayfa yüklendikten sonra kurulur.
    if (typeof onAuthStateChange === 'function') onAuthStateChange((session) => renderAuth(session?.user || null));
    window.addEventListener('storage', () => renderAuth(readStoredUser()));
  }

  // ── Contact: reason buttons ─────────────────────────────────────────────────
  const reasonBtns = document.querySelectorAll('.reason-btn'); 
  const subjectInput = document.getElementById('subject-input');
  reasonBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      reasonBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (subjectInput) subjectInput.value = btn.textContent.trim();
    });
  });

  // Not: form submit artık render.js → initContactFormSupabase() tarafından
  // yönetiliyor (Supabase'e yazıyor). Burada ayrıca bir submit handler YOK —
  // eskiden Formspree için buradaydı, çakışmasın diye kaldırıldı.

  // ── Folio date ──────────────────────────────────────────────────────────────
  const folioDate = document.getElementById('folio-date');
  if (folioDate) {
    const today = new Date().toISOString().slice(0, 10);
    folioDate.textContent = `Cilt I · Sayı 01 · ${today}`;
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Ofisteki bir ajana tıklamak, onun canlı komut satırını görünür biçimde eşler.
  // İçerik render.js tarafından asenkron üretildiği için olay delegasyonu kullanılır.
  const focusAgent = (member) => {
    const index = member?.dataset.agentIndex;
    if (index == null) return;
    document.querySelectorAll('.am-member.is-focused, .am-command-row.is-focused')
      .forEach((el) => el.classList.remove('is-focused'));
    member.classList.add('is-focused');
    const command = document.getElementById(`agent-command-${index}`);
    if (command) {
      command.classList.add('is-focused');
      command.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  document.addEventListener('click', (event) => {
    const member = event.target.closest('.am-member');
    if (member) focusAgent(member);
  });
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('.am-member')) {
      event.preventDefault();
      focusAgent(event.target.closest('.am-member'));
    }
  });

  // ── Reveal animations ───────────────────────────────────────────────────────
  // window.initReveal olarak dışa açılır: Supabase'ten gelen içerik DOM'a
  // eklendikten SONRA render.js bunu tekrar çağırır, çünkü ilk yüklemede
  // henüz o .reveal elemanları var olmayabilir. reveal-bound sınıfı aynı
  // elemanın iki kez gözlemlenmesini önler.
  window.initReveal = function () {
    const reveals = document.querySelectorAll('.reveal:not(.reveal-bound)');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      reveals.forEach(el => { el.classList.add('reveal-bound'); observer.observe(el); });
    } else {
      reveals.forEach(el => el.classList.add('visible', 'reveal-bound'));
    }
  };
  window.initReveal();

});
