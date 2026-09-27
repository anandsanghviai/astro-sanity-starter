// Shared page behaviour: scroll reveal, mobile menu, Resources dropdowns and the night-mode toggle.
// The pre-paint theme script stays inline in each page's <head> so there is no flash of the wrong theme.
(function () {
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-up').forEach(el => reveal.observe(el));
  } else {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in-view'));
  }

  const menuButton = document.getElementById('menuButton');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('max-h-0');
      mobileMenu.classList.toggle('max-h-screen');
    });
    mobileMenu.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('max-h-0');
        mobileMenu.classList.remove('max-h-screen');
      });
    });
  }

  function bindDropdown(prefix, closeOnOutsideClick) {
    const button = document.getElementById(`${prefix}ResourcesBtn`);
    const menu = document.getElementById(`${prefix}ResourcesMenu`);
    const arrow = document.getElementById(`${prefix}ResourcesArrow`);
    if (!button || !menu || !arrow) return;
    button.addEventListener('click', () => {
      menu.classList.toggle('max-h-0');
      menu.classList.toggle('max-h-96');
      arrow.classList.toggle('rotate-180');
    });
    if (!closeOnOutsideClick) return;
    document.addEventListener('click', (e) => {
      if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('max-h-0');
        menu.classList.remove('max-h-96');
        arrow.classList.remove('rotate-180');
      }
    });
  }
  bindDropdown('mobile', false);
  bindDropdown('desktop', true);

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
    });
  });

  // Follow OS changes only until the visitor has picked a theme themselves
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) {}
    if (!saved) document.documentElement.classList.toggle('dark', e.matches);
  });
})();
