'use strict';
/* ═══════════════════════════════════════════════════════════════
   Headmill Capital — motion.js
   A small, dependency-free spring + gesture toolkit.

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
