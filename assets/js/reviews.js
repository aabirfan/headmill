'use strict';

// Enhance long quotes only after the toggle is ready; without JS every word is visible.
document.querySelectorAll('.review-text').forEach(function (quote) {
  if (quote.textContent.length < 500) return;

  var button = document.createElement('button');
  var name = quote.closest('.review-card').querySelector('.review-name').textContent;
  button.type = 'button';
  button.className = 'review-toggle';
  button.setAttribute('aria-controls', quote.id);

  function setExpanded(expanded) {
    quote.classList.toggle('is-collapsed', !expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Read less' : 'Read more';
    button.setAttribute('aria-label', button.textContent + ' of the review by ' + name);
  }

  button.addEventListener('click', function () {
    setExpanded(button.getAttribute('aria-expanded') !== 'true');
  });
  quote.after(button);
  setExpanded(false);
});
