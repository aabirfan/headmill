'use strict';
/* ═══════════════════════════════════════════════════════════════
   Headmill Capital — shared.js
   Chrome behaviour shared by every page: the navigation sheet,
   the scroll edge under the header, section reveals and the
   cookie notice. Motion runs through motion.js so anything the
   user can touch can also be grabbed mid-flight.
   ═══════════════════════════════════════════════════════════════ */

/* ── NAVIGATION SHEET ─────────────────────────────────────────
   Opens downward from the header and dismisses back the same
   way — it leaves by the path it arrived on. It can be dragged
   at any point, including while it is still animating, and a
   flick is thrown to wherever the momentum was heading.        */
(function () {
  var hamburger = document.getElementById('hamburger');
  var sheet     = document.getElementById('mobile-nav');
  var scrim     = document.getElementById('nav-scrim');
  if (!hamburger || !sheet || !scrim) return;

  var CLEARANCE = 12;      // px of travel past the header, so nothing peeks
  var open      = false;
  var closedY   = -400;    // remeasured before every open

  function measure() {
    closedY = -(sheet.getBoundingClientRect().height + CLEARANCE);
  }

  function render(y) {
    sheet.style.transform = 'translate3d(0,' + y + 'px,0)';

    var progress = 1 - Math.min(Math.max(y / closedY, 0), 1);
    scrim.style.opacity = progress;

    // Fully retracted and going nowhere: take it out of the tree
    // so it can't be tabbed into or cast a shadow onto the page.
    var hidden = progress <= 0.001;
    sheet.style.visibility = hidden ? 'hidden' : 'visible';
    scrim.style.visibility = hidden ? 'hidden' : 'visible';
  }

  var spring = new HM.Spring({
    value: closedY,
    damping: HM.SPRING.sheet.damping,
    response: HM.SPRING.sheet.response,
    onUpdate: render
  });

  function setOpen(next, velocity) {
    open = next;
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    sheet.classList.toggle('active', open);
    scrim.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
    spring.setTarget(open ? 0 : closedY, velocity);
  }

  measure();
  render(closedY);
  addEventListener('resize', function () {
    measure();
    if (!open && !spring.isAnimating()) render(closedY);
  });

  hamburger.addEventListener('click', function () {
    if (!open) measure();
    setOpen(!open);
  });

  scrim.addEventListener('click', function () { setOpen(false); });

  sheet.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) setOpen(false);
  });

  /* Grab, follow, throw. Position tracks the finger 1:1 in the
     dismiss direction and rubber-bands the other way, because
     there is nothing below open to pull down into. */
  var grabbedAt = 0;

  HM.drag(sheet, {
    axis: 'y',
    canStart: function (e) {
      // Let the links have their taps; the sheet body is the handle.
      return !e.target.closest('a, button');
    },
    onStart: function () {
      grabbedAt = spring.value;   // start from where it is *now*, mid-flight or not
      spring.stop();
    },
    onMove: function (delta, velocity) {
      var y = grabbedAt + delta;
      if (y > 0) y = HM.rubberband(y, sheet.getBoundingClientRect().height);
      spring.track(y, velocity);
    },
    onEnd: function (delta, velocity) {
      // Snap to whichever end the flick was actually headed for,
      // not to whichever end happens to be nearer right now.
      var landing = spring.value + HM.project(velocity);
      setOpen(landing > closedY / 2, velocity);
    }
  });
})();

/* ── SCROLL EDGE ──────────────────────────────────────────────
   The header only earns a separating edge once content is
   actually passing underneath it.                              */
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var ticking = false;

  function update() {
    header.classList.toggle('scrolled', scrollY > 8);
    ticking = false;
  }

  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  update();
})();

/* ── SECTION REVEALS ──────────────────────────────────────────
   Restrained on purpose: enough to give the page a sense of
   arrival, never enough to make anyone wait for it.            */
(function () {
  var targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  targets.forEach(function (el) { observer.observe(el); });
})();

/* ── COOKIE NOTICE ────────────────────────────────────────────
   Materialises rather than fading: blur, scale and position
   move together, so it reads as a surface arriving.            */
(function () {
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;

  try {
    if (localStorage.getItem('hm_cookies')) return;
  } catch (err) {
    return; // storage blocked — don't nag on every page view
  }

  var accept  = document.getElementById('cookie-accept');
  var surface = document.getElementById('cookie-surface');

  var spring = new HM.Spring({
    value: 0,
    damping: HM.SPRING.move.damping,
    response: HM.SPRING.move.response,
    onUpdate: function (p) {
      banner.style.opacity   = p;
      banner.style.transform = 'translate3d(0,' + ((1 - p) * 20).toFixed(2) + 'px,0) scale(' +
                               (0.94 + 0.06 * p).toFixed(4) + ')';
      // Blur and scale arrive together, so it reads as a material
      // forming rather than a flat decal fading up.
      surface.style.backdropFilter = surface.style.webkitBackdropFilter =
        'saturate(180%) blur(' + (20 * p).toFixed(1) + 'px)';
    },
    onRest: function (p) {
      if (p === 0) banner.style.visibility = 'hidden';
    }
  });

  setTimeout(function () {
    banner.style.visibility = 'visible';
    banner.classList.add('active');
    spring.setTarget(1);
  }, 900);

  accept.addEventListener('click', function () {
    try { localStorage.setItem('hm_cookies', '1'); } catch (err) { /* nothing to do */ }
    banner.classList.remove('active');
    spring.setTarget(0);
  });
})();
