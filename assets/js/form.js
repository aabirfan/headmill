'use strict';

/* ── CONTACT FORM ── */
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  function showFieldError(input, msg) {
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
    const span = document.createElement('span');
    span.className = 'f-error';
    span.textContent = msg;
    span.id = input.id + '-error';
    input.setAttribute('aria-describedby', span.id);
    input.parentNode.appendChild(span);
  }

  function clearErrors() {
    form.querySelectorAll('.error').forEach(el => {
      el.classList.remove('error');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
    form.querySelectorAll('.f-error').forEach(el => el.remove());
    const banner = form.querySelector('.form-error-msg');
    if (banner) banner.remove();
  }

  function validate() {
    clearErrors();
    let valid = true;

    const firstName = form.querySelector('[name="first_name"]');
    const email     = form.querySelector('[name="email"]');
    const phone     = form.querySelector('[name="phone"]');
    const service   = form.querySelector('[name="service"]');

    if (!firstName.value.trim()) { showFieldError(firstName, 'Your name is required'); valid = false; }
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showFieldError(email, 'Please enter a valid email address'); valid = false;
    }

    if (!phone.value.trim())   { showFieldError(phone,   'Phone number is required');    valid = false; }
    else if (!/^[+\d\s().-]+$/.test(phone.value.trim()) || phone.value.replace(/\D/g, '').length < 7) {
      showFieldError(phone, 'Please enter a valid phone number'); valid = false;
    }
    if (!service.value)        { showFieldError(service, 'Please select a service');     valid = false; }

    if (!valid) form.querySelector('.error').focus();
    return valid;
  }

  // Clear individual field errors on correction
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        input.classList.remove('error');
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
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
    submitBtn.textContent = 'Sending…';
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
                <path d="M4 11l5.5 5.5L18 6" stroke="currentColor" stroke-width="2.2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="form-success-title" tabindex="-1">Callback requested</h3>
            <p class="form-success-body">We'll call you within one business day.<br>Your initial consultation is free, with no obligation.</p>
          </div>`;
        wrapper.querySelector('.form-success-title').focus();
      } else {
        throw new Error('Server error');
      }
    } catch {
      submitBtn.textContent = origText;
      submitBtn.disabled    = false;

      if (!form.querySelector('.form-error-msg')) {
        const err = document.createElement('div');
        err.className   = 'form-error-msg';
        err.setAttribute('role', 'alert');
        err.textContent = 'Something went wrong. Please try again or email us at admin@headmill.co.uk';
        form.insertBefore(err, submitBtn);
      }
    }
  });

  function selectService(value) {
    const service = form.querySelector('[name="service"]');
    if (Array.from(service.options).some(option => option.value === value)) {
      service.value = value;
      service.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // A mortgage starting point carries through to the callback request.
  const mortgageServices = {
    '#first-time-buyers': 'First-Time Buyer Mortgage',
    '#home-movers': 'Home Mover',
    '#remortgages': 'Remortgage',
    '#buy-to-let': 'Buy-to-Let'
  };
  function selectFromHash() {
    if (location.pathname.endsWith('/mortgages.html') && mortgageServices[location.hash]) {
      selectService(mortgageServices[location.hash]);
    }
  }
  selectFromHash();
  addEventListener('hashchange', selectFromHash);

  // Keep the visitor's context when a homepage starting point leads to the form.
  document.querySelectorAll('[data-service]').forEach(link => {
    link.addEventListener('click', () => {
      selectService(link.dataset.service);
    });
  });
})();
