'use strict';

// Start with all cards in the HTML so the complete set remains available without JS.
(function () {
  var grid = document.getElementById('reviews-grid');
  if (!grid) return;
  var extraCards = Array.from(grid.querySelectorAll('.review-card')).slice(6);
  if (!extraCards.length) return;

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-solid reviews-more';
  button.setAttribute('aria-controls', grid.id);

  function setExpanded(expanded) {
    extraCards.forEach(function (card) { card.hidden = !expanded; });
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Show fewer reviews' : 'Show more reviews';
  }

  button.addEventListener('click', function () {
    setExpanded(button.getAttribute('aria-expanded') !== 'true');
  });
  grid.after(button);
  setExpanded(false);
})();

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
