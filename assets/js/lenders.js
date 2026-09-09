'use strict';
/* ═══════════════════════════════════════════════════════════════
   Headmill Capital — lenders.js
   The lender strip drifts on its own, can be dragged 1:1, and
   can be thrown. A flick continues at exactly the speed the
   finger left at and lands where the momentum was heading; the
   arrows re-target the same spring, so pressing twice in quick
   succession accelerates rather than restarting.

   The track holds two identical sets, so any offset wraps modulo
   one set-width with no visible seam.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var marquee = document.getElementById('lenders-marquee');
  if (!marquee) return;

  var track = marquee.querySelector('.lenders-track');
  var prev  = document.getElementById('lenders-prev');
  var next  = document.getElementById('lenders-next');

  var SPEED     = 22;    // idle drift, px per second
  var STEP      = 280;   // px per arrow press
  var RESUME_MS = 3500;  // quiet period after a press or throw

  var offset   = 0;      // px the track is shifted left
  var dragging = false;
  var hovering = false;
  var resumeAt = 0;
  var last     = performance.now();

  function setWidth() { return track.scrollWidth / 2; }

  function wrap(x) {
    var w = setWidth();
    if (!w) return 0;
    return ((x % w) + w) % w;
  }

  function paint() {
    track.style.transform = 'translate3d(' + -wrap(offset) + 'px,0,0)';
  }

  var spring = new HM.Spring({
    value: 0,
    damping: HM.SPRING.move.damping,
    response: 0.55,        // longer than a UI spring: this is a glide, not a snap
    onUpdate: function (v) { offset = v; paint(); },
    onRest:   function ()  { resumeAt = performance.now() + RESUME_MS; }
  });

  /* Bring the spring up to date with wherever the drift has got
     to, so a press or a grab starts from the on-screen value. */
  function handOff(velocity) {
    spring.stop();
    spring.value = offset;
    spring.velocity = velocity || 0;
  }

  function nudge(direction) {
    var from = spring.isAnimating() ? spring.target : offset;
    handOff(spring.velocity);
    spring.setTarget(from + direction * STEP);
    resumeAt = performance.now() + RESUME_MS;
  }

  if (prev) prev.addEventListener('click', function () { nudge(-1); });
  if (next) next.addEventListener('click', function () { nudge(1); });

  marquee.addEventListener('mouseenter', function () { hovering = true; });
  marquee.addEventListener('mouseleave', function () { hovering = false; });

  var grabbedAt = 0;

  HM.drag(marquee, {
    axis: 'x',
    onStart: function () {
      dragging = true;
      grabbedAt = offset;
      marquee.classList.add('dragging');
      spring.stop();
    },
    onMove: function (delta) {
      // Content follows the finger exactly: drag right, logos go right.
      offset = grabbedAt - delta;
      paint();
    },
    onEnd: function (delta, velocity) {
      dragging = false;
      marquee.classList.remove('dragging');

      // Throw it to where the gesture was actually going, entering
      // the glide at the speed the finger left at — no seam between
      // dragging and animating.
      var thrown = -velocity;
      handOff(thrown);
      spring.setTarget(offset + HM.project(thrown), thrown);
      resumeAt = performance.now() + RESUME_MS;
    }
  });

  function frame(now) {
    var dt = Math.max(0, Math.min(now - last, 100)) / 1000;
    last = now;

    var idle = !dragging && !spring.isAnimating();
    if (idle && !hovering && now > resumeAt && !HM.reduceMotion.matches) {
      offset -= SPEED * dt;   // decreasing offset = logos travel right
      paint();
    }

    requestAnimationFrame(frame);
  }

  paint();
  requestAnimationFrame(frame);
})();
