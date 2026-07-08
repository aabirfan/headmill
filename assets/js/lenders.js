/* Lenders strip: slow left→right auto-drift, arrow buttons to browse.
   The track holds two identical sets of logos, so any offset can wrap
   modulo one set-width without a visible jump. */
(function () {
  var marquee = document.getElementById('lenders-marquee');
  if (!marquee) return;

  var track  = marquee.querySelector('.lenders-track');
  var prev   = document.getElementById('lenders-prev');
  var next   = document.getElementById('lenders-next');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var SPEED     = 24;   // auto-drift, px per second
  var STEP      = 260;  // px per arrow press
  var STEP_MS   = 450;  // glide duration per press
  var RESUME_MS = 4000; // pause after a press before drifting again

  var offset   = 0;     // px the track is shifted left
  var hovering = false;
  var resumeAt = 0;
  var glide    = null;  // { from, to, start }
  var last     = performance.now();

  function setWidth() { return track.scrollWidth / 2; }

  function wrap(x) {
    var w = setWidth();
    if (!w) return 0;
    return ((x % w) + w) % w;
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function nudge(dir) {
    var from = glide ? glide.to : offset;
    if (reducedMotion.matches) {
      offset = wrap(from + dir * STEP);
      glide = null;
    } else {
      glide = { from: offset, to: from + dir * STEP, start: performance.now() };
    }
    resumeAt = performance.now() + RESUME_MS;
  }

  prev.addEventListener('click', function () { nudge(-1); });
  next.addEventListener('click', function () { nudge(1); });
  marquee.addEventListener('mouseenter', function () { hovering = true; });
  marquee.addEventListener('mouseleave', function () { hovering = false; });

  function frame(now) {
    var dt = Math.max(0, Math.min(now - last, 100)) / 1000;
    last = now;

    if (glide) {
      var t = Math.min((now - glide.start) / STEP_MS, 1);
      offset = glide.from + (glide.to - glide.from) * easeOut(t);
      if (t === 1) { offset = wrap(offset); glide = null; }
    } else if (!hovering && now > resumeAt && !reducedMotion.matches) {
      offset = wrap(offset - SPEED * dt); // decreasing offset = logos move right
    }

    track.style.transform = 'translateX(' + -wrap(offset) + 'px)';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
