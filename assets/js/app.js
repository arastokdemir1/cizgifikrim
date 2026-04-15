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
  const cursorDot = document.createElement('div');
  const cursorOutline = document.createElement('div');
  cursorDot.classList.add('cursor-dot');
  cursorOutline.classList.add('cursor-outline');
  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorOutline);

  let mouseX = -100;
  let mouseY = -100;
  let outlineX = -100;
  let outlineY = -100;
  let isMoving = false;

  // Initialize cursor out of view
  cursorDot.style.opacity = '0';
  cursorOutline.style.opacity = '0';

  window.addEventListener('mousemove', (e) => {
    if (!isMoving) {
        cursorDot.style.opacity = '1';
        cursorOutline.style.opacity = '1';
        isMoving = true;
    }
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  });

  document.addEventListener('mousedown', () => cursorOutline.classList.add('clicking'));
  document.addEventListener('mouseup', () => cursorOutline.classList.remove('clicking'));

  // Sync position on scroll
  window.addEventListener('scroll', () => {
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  }, { passive: true });

  // Hide when mouse leaves window
  document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity = '0';
    cursorOutline.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursorDot.style.opacity = '1';
    cursorOutline.style.opacity = '1';
  });

  const animateOutline = () => {
    const easing = 0.15;
    outlineX += (mouseX - outlineX) * easing;
    outlineY += (mouseY - outlineY) * easing;

    cursorOutline.style.left = outlineX + 'px';
    cursorOutline.style.top = outlineY + 'px';

    requestAnimationFrame(animateOutline);
  };
  animateOutline();

  const addHoverEffects = () => {
    const interactables = document.querySelectorAll('a, button, .canvas-item, .lang-btn, .theme-toggle-btn, .menu-toggle, [role="button"]');
    interactables.forEach(el => {
      // Prevent multiple listeners
      if (el.getAttribute('data-cursor-bound')) return;
      el.setAttribute('data-cursor-bound', 'true');

      el.addEventListener('mouseenter', () => {
        cursorOutline.classList.add('hover');
        cursorDot.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        cursorOutline.classList.remove('hover');
        cursorDot.classList.remove('hover');
      });
    });
  };

  // Run once and also after a small delay to catch late-renders
  addHoverEffects();
  setTimeout(addHoverEffects, 1000);

  addHoverEffects();
});
