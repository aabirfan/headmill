'use strict';

/* ── CUSTOM CURSOR ── */
(function () {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });

  (function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  document.querySelectorAll('a, button, .service-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '6px';
      cursor.style.height = '6px';
      ring.style.width = '60px';
      ring.style.height = '60px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '10px';
      cursor.style.height = '10px';
      ring.style.width = '36px';
      ring.style.height = '36px';
    });
  });
})();

/* ── SCROLL REVEAL ── */
(function () {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal, .stat-block').forEach(el => obs.observe(el));
})();

/* ── SCROLL PROGRESS BAR ── */
(function () {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
  }, { passive: true });
})();

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

/* ── MORTGAGE CALCULATOR ── */
(function () {
  function fmt(n) {
    return Math.round(n).toLocaleString('en-GB');
  }

  function calculate() {
    const propEl  = document.getElementById('calc-property');
    const depEl   = document.getElementById('calc-deposit');
    const termEl  = document.getElementById('calc-term');
    const rateEl  = document.getElementById('calc-rate');
    const monthlyEl = document.getElementById('result-monthly');
    const totalEl   = document.getElementById('result-total');
    const ltvEl     = document.getElementById('result-ltv');

    if (!propEl || !monthlyEl) return;

    const property   = parseFloat(propEl.value)  || 0;
    const deposit    = parseFloat(depEl.value)   || 0;
    const term       = parseFloat(termEl.value)  || 25;
    const annualRate = parseFloat(rateEl.value)  || 0;
    const loan = property - deposit;

    if (loan <= 0 || property <= 0 || term <= 0) {
      monthlyEl.textContent = '—';
      totalEl.textContent   = '—';
      ltvEl.textContent     = '—';
      return;
    }

    const ltv = (loan / property) * 100;
    const n   = Math.round(term * 12);
    let monthly;

    if (annualRate === 0) {
      monthly = loan / n;
    } else {
      const r   = annualRate / 100 / 12;
      const pow = Math.pow(1 + r, n);
      monthly   = loan * (r * pow) / (pow - 1);
    }

    const total = monthly * n;

    monthlyEl.textContent = '£' + fmt(monthly);
    totalEl.textContent   = '£' + fmt(total);
    ltvEl.textContent     = ltv.toFixed(1) + '%';
  }

  ['calc-property', 'calc-deposit', 'calc-term', 'calc-rate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
  });

  calculate();
})();

/* ── CONTACT FORM ── */
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  function showFieldError(input, msg) {
    input.classList.add('error');
    const span = document.createElement('span');
    span.className = 'f-error';
    span.textContent = msg;
    input.parentNode.appendChild(span);
  }

  function clearErrors() {
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.f-error').forEach(el => el.remove());
    const banner = form.querySelector('.form-error-msg');
    if (banner) banner.remove();
  }

  function validate() {
    clearErrors();
    let valid = true;

    const firstName = form.querySelector('[name="first_name"]');
    const lastName  = form.querySelector('[name="last_name"]');
    const email     = form.querySelector('[name="email"]');
    const phone     = form.querySelector('[name="phone"]');
    const service   = form.querySelector('[name="service"]');

    if (!firstName.value.trim()) { showFieldError(firstName, 'First name is required'); valid = false; }
    if (!lastName.value.trim())  { showFieldError(lastName,  'Last name is required');  valid = false; }

    if (!email.value.trim()) {
      showFieldError(email, 'Email address is required'); valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showFieldError(email, 'Please enter a valid email address'); valid = false;
    }

    if (!phone.value.trim())   { showFieldError(phone,   'Phone number is required');    valid = false; }
    if (!service.value)        { showFieldError(service, 'Please select a service');     valid = false; }

    return valid;
  }

  // Clear individual field errors on correction
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        input.classList.remove('error');
        const err = input.parentNode.querySelector('.f-error');
        if (err) err.remove();
      }
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validate()) return;

    const submitBtn  = form.querySelector('.form-submit');
    const origText   = submitBtn.textContent;
    submitBtn.textContent = 'Sending\u2026';
    submitBtn.disabled    = true;

    try {
      const response = await fetch('https://formspree.io/f/mqedryaw', {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const wrapper = form.closest('.contact-right') || form.parentNode;
        wrapper.innerHTML = `
          <div class="form-success">
            <div class="form-success-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M4 11l5.5 5.5L18 6" stroke="var(--bg)" stroke-width="2.2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="form-success-title">Enquiry received</h3>
            <p class="form-success-body">We'll be in touch within one business day.<br>No obligation, no pressure, no jargon.</p>
          </div>`;
      } else {
        throw new Error('Server error');
      }
    } catch {
      submitBtn.textContent = origText;
      submitBtn.disabled    = false;

      if (!form.querySelector('.form-error-msg')) {
        const err = document.createElement('div');
        err.className   = 'form-error-msg';
        err.textContent = 'Something went wrong. Please try again or email us at admin@headmill.co.uk';
        form.insertBefore(err, submitBtn);
      }
    }
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
