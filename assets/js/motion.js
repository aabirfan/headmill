'use strict';
/* ═══════════════════════════════════════════════════════════════
   Headmill Capital — motion.js
   A small spring + gesture toolkit with no external dependencies.

   Everything the interface animates goes through here, so motion
   is consistent and — crucially — interruptible. A spring always
   starts from the value currently on screen and carries whatever
   velocity it already had, so a user can grab a moving thing
   mid-flight and redirect it without a jump or a "brick wall".

   Parameters follow Apple's two-knob model rather than the
   physics triplet:
     damping  — 1.0 settles with no overshoot; below 1.0 bounces.
     response — roughly how long it takes to arrive, in seconds.
                Not a duration: a spring has no fixed end.
   ═══════════════════════════════════════════════════════════════ */

(function (global) {

  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Spring ───────────────────────────────────────────────────
     Damped harmonic oscillator, integrated at a fixed 240Hz
     sub-step so behaviour doesn't change with display refresh
     rate, and driven by rAF (the web's display-synced clock).   */

  function Spring(opts) {
    this.value    = opts.value || 0;
    this.velocity = opts.velocity || 0;
    this.target   = opts.value || 0;
    this.damping  = opts.damping == null ? 1 : opts.damping;
    this.response = opts.response || 0.4;
    this.onUpdate = opts.onUpdate || function () {};
    this.onRest   = opts.onRest || function () {};
    this._raf     = null;
    this._last    = 0;
  }

  Spring.prototype.setTarget = function (target, velocity) {
    this.target = target;
    // Blend, don't hard-cut: a re-target keeps the velocity it
    // already had unless the caller hands over a new one.
    if (velocity != null) this.velocity = velocity;

    if (reduceMotion.matches) return this.set(target);

    if (this._raf === null) {
      this._last = performance.now();
      this._tick = this._tick.bind(this);
      this._raf  = requestAnimationFrame(this._tick);
    }
    return this;
  };

  /* Jump straight to a value, cancelling any motion. */
  Spring.prototype.set = function (value) {
    this.stop();
    this.value = this.target = value;
    this.velocity = 0;
    this.onUpdate(value, 0);
    this.onRest(value);
    return this;
  };

  /* Take manual control — used while a finger is down. The spring
     keeps recording velocity so it can resume from it on release. */
  Spring.prototype.track = function (value, velocity) {
    this.stop();
    this.value = this.target = value;
    this.velocity = velocity || 0;
    this.onUpdate(value, this.velocity);
    return this;
  };

  Spring.prototype.stop = function () {
    if (this._raf !== null) cancelAnimationFrame(this._raf);
    this._raf = null;
    return this;
  };

  Spring.prototype.isAnimating = function () { return this._raf !== null; };

  Spring.prototype._tick = function (now) {
    var elapsed = Math.min((now - this._last) / 1000, 0.064); // clamp tab-switch gaps
    this._last  = now;

    var omega = (2 * Math.PI) / this.response;
    var zeta  = this.damping;
    var steps = Math.max(1, Math.ceil(elapsed * 240));
    var h     = elapsed / steps;

    for (var i = 0; i < steps; i++) {
      var displacement = this.value - this.target;
      var accel = -(omega * omega) * displacement - 2 * zeta * omega * this.velocity;
      this.velocity += accel * h;
      this.value    += this.velocity * h;
    }

    var settled = Math.abs(this.value - this.target) < 0.01 &&
                  Math.abs(this.velocity) < 0.05;

    if (settled) {
      this.value = this.target;
      this.velocity = 0;
      this._raf = null;
      this.onUpdate(this.value, 0);
      this.onRest(this.value);
      return;
    }

    this.onUpdate(this.value, this.velocity);
    this._raf = requestAnimationFrame(this._tick);
  };

  /* ── Momentum projection ──────────────────────────────────────
     Where would a flick come to rest? Snap to the target nearest
     *that* point, not nearest the release point — this is what
     makes a small flick throw something a long way.

     Exponential decay, the same curve scroll deceleration uses.  */

  function project(velocity, decelerationRate) {
    var d = decelerationRate == null ? 0.998 : decelerationRate;
    return (velocity / 1000) * d / (1 - d);
  }

  /* ── Rubber-banding ───────────────────────────────────────────
     Past a boundary, resist progressively instead of stopping
     dead. A hard stop reads as frozen; resistance reads as
     "responsive, but there's nothing more here".                 */

  function rubberband(overshoot, dimension, constant) {
    var c = constant == null ? 0.55 : constant;
    return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
  }

  /* ── Pointer tracking ─────────────────────────────────────────
     1:1 dragging with a short position history, so we can hand a
     real release velocity to the spring. Pointer capture keeps
     tracking alive when the finger leaves the element.

     Respects the grab offset — content moves with the pointer
     rather than snapping its centre to it.                       */

  var HYSTERESIS = 10; // px of movement before we commit to a direction

  function drag(el, opts) {
    var axis    = opts.axis || 'y';
    var onStart = opts.onStart || function () {};
    var onMove  = opts.onMove  || function () {};
    var onEnd   = opts.onEnd   || function () {};
    var canStart = opts.canStart || function () { return true; };

    var active = false, committed = false, id = null;
    var startX = 0, startY = 0, history = [];

    function sample(e) {
      history.push({ t: performance.now(), x: e.clientX, y: e.clientY });
      if (history.length > 6) history.shift();
    }

    /* Velocity over the last ~100ms rather than the final event —
       a single frame is far too noisy to throw with. */
    function velocity() {
      if (history.length < 2) return 0;
      var last = history[history.length - 1];
      var ref  = history[0];
      for (var i = history.length - 1; i >= 0; i--) {
        if (last.t - history[i].t > 100) break;
        ref = history[i];
      }
      var dt = (last.t - ref.t) / 1000;
      if (dt <= 0) return 0;
      return axis === 'x' ? (last.x - ref.x) / dt : (last.y - ref.y) / dt;
    }

    el.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      if (!canStart(e)) return;
      active = true; committed = false; id = e.pointerId;
      startX = e.clientX; startY = e.clientY;
      history = [];
      sample(e);
    });

    el.addEventListener('pointermove', function (e) {
      if (!active || e.pointerId !== id) return;
      sample(e);

      var dx = e.clientX - startX;
      var dy = e.clientY - startY;

      if (!committed) {
        var along  = axis === 'x' ? dx : dy;
        var across = axis === 'x' ? dy : dx;
        if (Math.abs(along) < HYSTERESIS) return;
        // Both directions were plausible until now; cancel the
        // loser once intent is clear rather than guessing early.
        if (Math.abs(across) > Math.abs(along)) { active = false; return; }
        committed = true;
        el.setPointerCapture(id);
        onStart(axis === 'x' ? startX : startY);
      }

      e.preventDefault();
      onMove(axis === 'x' ? dx : dy, velocity());
    }, { passive: false });

    function finish(e) {
      if (!active || e.pointerId !== id) return;
      var wasCommitted = committed;
      active = false; committed = false;
      if (el.hasPointerCapture && el.hasPointerCapture(id)) el.releasePointerCapture(id);
      if (wasCommitted) {
        var dist = axis === 'x' ? e.clientX - startX : e.clientY - startY;
        onEnd(dist, velocity());
      }
    }

    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', finish);
  }

  global.HM = {
    Spring: Spring,
    project: project,
    rubberband: rubberband,
    drag: drag,
    reduceMotion: reduceMotion,
    /* Apple's shipped values, named so call sites read as intent. */
    SPRING: {
      move:   { damping: 1.0, response: 0.4 },  // reposition, no overshoot
      sheet:  { damping: 0.8, response: 0.3 },  // drawers, dismissals
      snappy: { damping: 1.0, response: 0.25 }  // small, frequent UI
    }
  };

})(window);

/* Calm, bounded entrances alongside the gesture springs. Web Animations runs
   transforms/opacity on the compositor and removes its effects when finished. */
(function () {
  var ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  var active = new Set();
  function enter(el, frames, duration, delay) {
    if (HM.reduceMotion.matches || !el.animate) return;
    // Add only transforms to preserve hover feedback. Opacity must replace
    // its underlying value: additive opacity would clamp the fade to 1.
    if (frames.some(function (frame) { return frame.composite === 'add'; })) {
      enter(el, frames.map(function (frame) { return { opacity: frame.opacity }; }), duration, delay);
      frames = frames.map(function (frame) { return { transform: frame.transform, composite: 'add' }; });
    }
    var animation = el.animate(frames, {
      duration: duration, delay: delay || 0, easing: ease, fill: 'backwards'
    });
    active.add(animation);
    animation.finished.then(function () { active.delete(animation); }, function () { active.delete(animation); });
    return animation;
  }

  HM.initEntrances = function () {
    document.documentElement.classList.add('js-motion');
    if (HM.reduceMotion.matches || !Element.prototype.animate) return;
    var cleanups = [];

    document.querySelectorAll('.hero h1, .page-hero h1').forEach(function (heading) {
      var overlay, animations = [], generation = 0;
      function clear() {
        generation++;
        animations.forEach(function (a) { if (a) a.cancel(); });
        animations = [];
        if (overlay) overlay.remove();
        overlay = null;
        heading.style.opacity = '';
      }
      function split(animate) {
        clear();
        var current = generation;
        // Measure the untouched, naturally wrapped heading. Clipping copies of
        // that exact rendering preserves balance, kerning and nested accents.
        var bounds = heading.getBoundingClientRect();
        var lines = [];
        var walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        var node, range = document.createRange();
        while ((node = walker.nextNode())) {
          for (var i = 0; i < node.length; i++) {
            if (/\s/.test(node.data[i])) continue;
            range.setStart(node, i); range.setEnd(node, i + 1);
            var rect = range.getBoundingClientRect();
            if (!lines.some(function (top) { return Math.abs(top - rect.top) < 2; })) lines.push(rect.top);
          }
        }
        lines.sort(function (a, b) { return a - b; });
        if (!lines.length) return;
        var parent = heading.parentElement;
        if (getComputedStyle(parent).position === 'static') parent.classList.add('motion-heading-host');
        var host = parent.getBoundingClientRect();
        overlay = document.createElement('div');
        overlay.className = 'motion-heading-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.cssText = 'left:' + (bounds.left - host.left + parent.scrollLeft) + 'px;top:' + (bounds.top - host.top + parent.scrollTop) + 'px;width:' + bounds.width + 'px;height:' + bounds.height + 'px';
        lines.forEach(function (top, index) {
          // Use the heading's own line boxes, with no change to its geometry.
          var start = index === 0 ? 0 : (top - lines[0]);
          var end = index + 1 < lines.length ? lines[index + 1] - lines[0] : bounds.height;
          var mask = document.createElement('div');
          mask.className = 'motion-line-mask';
          mask.style.cssText = 'top:' + start + 'px;height:' + (end - start) + 'px';
          var copy = heading.cloneNode(true);
          copy.removeAttribute('id');
          copy.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
          copy.style.cssText = 'top:' + (-start) + 'px;width:' + bounds.width + 'px';
          var content = document.createElement('div');
          content.className = 'motion-line-content';
          content.appendChild(copy); mask.appendChild(content); overlay.appendChild(mask);
          // Pixel travel is one real line, rather than the full heading height.
          if (animate) animations.push(enter(content, [
            { transform: 'translateY(' + (end - start) + 'px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
          ], 480, Math.min(index * 70, 280)));
        });
        parent.appendChild(overlay);
        heading.style.opacity = '0';
        Promise.all(animations.filter(Boolean).map(function (a) { return a.finished.catch(function () {}); })).then(function () {
          if (current === generation) clear();
        });
      }
      split(true);
      // Re-measure live native lines on resize/font changes. Rebuilt masks
      // settle immediately, so resizing never replays a load entrance.
      var initialWidth = heading.getBoundingClientRect().width;
      var resize = window.ResizeObserver && new ResizeObserver(function () {
        var width = heading.getBoundingClientRect().width;
        if (Math.abs(width - initialWidth) > .5) { if (overlay) split(false); initialWidth = width; }
      });
      if (resize) resize.observe(heading);
      if (document.fonts && document.fonts.status === 'loading') document.fonts.ready.then(function () { if (overlay) split(false); });
      cleanups.push(clear);
    });

    document.querySelectorAll('.hero-sub, .page-hero-sub, .hero-actions, .page-hero-actions, .hero-points').forEach(function (el, i) {
      enter(el, [{ opacity: .35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], 400, 280 + Math.min(i * 60, 120));
    });

    if (!('IntersectionObserver' in window)) return;
    var targets = new Set();
    // Grid wrappers hand their entrance to their children, avoiding a double fade.
    document.querySelectorAll('.reveal').forEach(function (el) {
      if (!el.matches('.services-grid, .reviews-grid, .offer-grid, .steps-grid') &&
          !el.querySelector('.service-card, .review-card, .offer-card, .step')) targets.add(el);
    });
    document.querySelectorAll('.service-card, .review-card, .offer-card, .step, .section-head, .media-band figcaption').forEach(function (el) { targets.add(el); });
    var photos = new Set(document.querySelectorAll('.service-media img, .media-band-frame img, .about-photo img, .hero img, .page-hero img'));
    var stats = new Set(document.querySelectorAll('.stat-num'));
    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; });
      visible.forEach(function (entry) {
        var el = entry.target;
        observer.unobserve(el);
        el.classList.add('in');
        if (HM.reduceMotion.matches) return;
        // Stagger only siblings arriving together; a later mobile card never waits.
        var siblings = visible.filter(function (item) { return item.target.parentElement === el.parentElement; });
        var delay = Math.min(siblings.findIndex(function (item) { return item.target === el; }) * 65, 195);
        if (photos.has(el)) {
          enter(el, [{ opacity: .3, transform: 'scale(1.04)', composite: 'add' }, { opacity: 1, transform: 'scale(1)', composite: 'add' }], 600, delay);
        } else if (stats.has(el)) {
          count(el);
        } else {
          enter(el, [{ opacity: .15, transform: 'translateY(12px)', composite: 'add' }, { opacity: 1, transform: 'translateY(0)', composite: 'add' }], 480, delay);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px 0px 0px' });
    new Set([].concat(Array.from(targets), Array.from(photos), Array.from(stats))).forEach(function (el) { observer.observe(el); });

    function count(el) {
      var node = Array.from(el.childNodes).find(function (child) { return child.nodeType === Node.TEXT_NODE && /\d/.test(child.data); });
      if (!node) return;
      var original = node.data;
      var target = Number(original.replace(/[^\d.]/g, ''));
      if (!target) { enter(el, [{ opacity: .3 }, { opacity: 1 }], 400); return; }
      // Reserve the final numeral width so the +/% never moves as digits grow.
      // Unwrap on completion to restore the exact original markup and text node.
      var measure = document.createRange();
      measure.selectNodeContents(node);
      var slot = document.createElement('span');
      slot.style.cssText = 'display:inline-block;color:inherit;width:' + measure.getBoundingClientRect().width + 'px';
      node.replaceWith(slot); slot.appendChild(node);
      var started = performance.now(), raf;
      var label = el.getAttribute('aria-label');
      el.setAttribute('aria-label', el.textContent);
      function finish() {
        cancelAnimationFrame(raf); node.data = original;
        if (slot.parentNode) slot.replaceWith(node);
        if (label === null) el.removeAttribute('aria-label'); else el.setAttribute('aria-label', label);
      }
      function tick(now) {
        var t = Math.min((now - started) / 1000, 1);
        node.data = original.replace(/[\d.]+/, String(Math.round(target * (1 - Math.pow(1 - t, 3)))));
        if (t < 1 && !HM.reduceMotion.matches) raf = requestAnimationFrame(tick); else finish();
      }
      raf = requestAnimationFrame(tick); cleanups.push(finish);
    }
    HM.reduceMotion.addEventListener('change', function () {
      if (!HM.reduceMotion.matches) return;
      active.forEach(function (a) { a.cancel(); });
      cleanups.forEach(function (clear) { clear(); });
      observer.disconnect();
    });
  };
})();
