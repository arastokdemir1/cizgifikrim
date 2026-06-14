document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile nav toggle ──────────────────────────────────────────────────────
  const toggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
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

  // ── Contact: form submit feedback ───────────────────────────────────────────
  const form = document.getElementById('contact-form');
  const sentMsg = document.getElementById('form-sent');
  if (form && sentMsg) {
    form.addEventListener('submit', () => {
      setTimeout(() => { sentMsg.style.display = 'inline'; }, 800);
    });
  }

  // ── Folio date ──────────────────────────────────────────────────────────────
  const folioDate = document.getElementById('folio-date');
  if (folioDate) {
    const today = new Date().toISOString().slice(0, 10);
    folioDate.textContent = `Cilt I · Sayı 01 · ${today}`;
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Reveal animations ───────────────────────────────────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

});
