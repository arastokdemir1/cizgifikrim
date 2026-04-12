document.addEventListener('DOMContentLoaded', () => {
  const mt = document.querySelector('.menu-toggle');
  const no = document.querySelector('.nav-overlay');
  if(mt){
    mt.addEventListener('click', () => {
      no.classList.toggle('open');
      document.body.style.overflow = no.classList.contains('open') ? 'hidden' : 'auto';
    });
  }

  // Theme Toggle Logic
  const themeBtn = document.createElement('button');
  themeBtn.className = 'theme-toggle-btn';
  themeBtn.innerText = '🌓 THEME';

  const themeBtnMobile = document.createElement('button');
  themeBtnMobile.className = 'theme-toggle-btn';
  themeBtnMobile.innerText = '🌓 THEME';

  const langSwitcher = document.querySelector('.lang-switcher');
  if (langSwitcher) {
    langSwitcher.appendChild(themeBtn);
  }

  const navOverlay = document.querySelector('.nav-overlay');
  if (navOverlay) {
    navOverlay.appendChild(themeBtnMobile);
  }

  const applyTheme = (isLight) => {
    if (isLight) {
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.classList.add('light-theme');
    } else {
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.add('dark-theme');
    }
  };

  // Check saved theme or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersLightMedia = window.matchMedia('(prefers-color-scheme: light)');

  if (savedTheme === 'light' || (!savedTheme && systemPrefersLightMedia.matches)) {
    applyTheme(true);
  } else {
    applyTheme(false);
  }

  // Listen to system changes
  systemPrefersLightMedia.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        applyTheme(e.matches);
    }
  });

  const toggleThemeHandler = () => {
    const isLight = document.documentElement.classList.contains('light-theme');
    if (isLight) {
      applyTheme(false);
      localStorage.setItem('theme', 'dark');
    } else {
      applyTheme(true);
      localStorage.setItem('theme', 'light');
    }
  };

  themeBtn.addEventListener('click', toggleThemeHandler);
  themeBtnMobile.addEventListener('click', toggleThemeHandler);

  // Custom Cursor Logic
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  document.body.appendChild(cursor);

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  const addHoverEffects = () => {
    const interactables = document.querySelectorAll('a, button, .canvas-item, .lang-btn, .theme-toggle-btn');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
      });
    });
  };

  addHoverEffects();
});
