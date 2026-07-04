'use strict';

/* ── HAMBURGER MENU ── */
(function () {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!hamburger || !mobileNav) return;

  function closeMenu() {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
})();

/* ── COOKIE BANNER ── */
(function () {
  if (localStorage.getItem('hm_cookies')) return;

  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  setTimeout(() => banner.classList.add('visible'), 900);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem('hm_cookies', '1');
    banner.classList.remove('visible');
  });
})();
