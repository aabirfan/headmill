'use strict';

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
                <path d="M4 11l5.5 5.5L18 6" stroke="#F0E9C2" stroke-width="2.2"
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
