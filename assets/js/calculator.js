'use strict';

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
