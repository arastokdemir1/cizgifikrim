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
