document.addEventListener('DOMContentLoaded', () => {
  const mt = document.querySelector('.menu-toggle');
  const no = document.querySelector('.nav-overlay');
  if(mt){
    mt.addEventListener('click', () => {
      no.classList.toggle('open');
      document.body.style.overflow = no.classList.contains('open') ? 'hidden' : 'auto';
    });
  }

  document.documentElement.classList.add('dark-theme');

  // Reveal Animation Logic
  const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  };

  const revealObserver = new IntersectionObserver(revealCallback, {
    threshold: 0.1
  });

  const registerReveals = () => {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  };

  registerReveals();

  // Export for potential dynamic content
  window.registerReveals = registerReveals;
});
