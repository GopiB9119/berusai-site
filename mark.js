/* The BerusAI mark animation, ported from the app's original splash screen.
   Two dots arrive, hop across the letterforms, orbit at the tip of the lambda,
   fuse, and settle as the dot on the i. Geometry and timings are the same values
   the Compose version used, measured from the logo as fractions of the mark box. */
(function () {
  var wrap = document.querySelector('.mark-wrap');
  if (!wrap) return;
  var img = wrap.querySelector('.banner-mark');
  var canvas = wrap.querySelector('.mark-canvas');
  if (!img || !canvas || !canvas.getContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ASPECT = 911 / 160;
  var DOT_R = 0.0170;
  var DOT_RH = DOT_R * ASPECT;
  var HOME_X = 0.9813, HOME_Y = 0.1531;
  var RED = '228,35,29', SILVER = '207,211,220';

  // left, top, width, height of each letter within the mark box.
  var LETTERS = [
    [0.0000, 0.0000, 0.1636, 0.9938],
    [0.1954, 0.3125, 0.1240, 0.6813],
    [0.3524, 0.3125, 0.0922, 0.6813],
    [0.4753, 0.3063, 0.1218, 0.6937],
    [0.6301, 0.3125, 0.1153, 0.6813],
    [0.7739, 0.0563, 0.1647, 0.9437],
    [0.9704, 0.3563, 0.0231, 0.6438]
  ];
  // Where each letter sits in mark-letters.webp.
  var RECTS = [
    [0, 0, 149, 159], [153, 0, 113, 109], [270, 0, 84, 109], [358, 0, 111, 111],
    [473, 0, 105, 109], [582, 0, 150, 151], [736, 0, 21, 103]
  ];

  var B_X = 0.0604, B_Y = -DOT_RH;
  var E_X = 0.2634, E_Y = 0.3125 - DOT_RH;
  var R_X = 0.4105, R_Y = 0.3125 - DOT_RH;
  var U_X = 0.5774, U_Y = 0.3063 - DOT_RH;
  var S_X = 0.6915, S_Y = 0.3125 - DOT_RH;
  var MID_X = 0.6600;
  var TIP_X = 0.8562, TIP_Y = 0.0563 - DOT_RH;
  var LEFT_FOOT_X = 0.7850, RIGHT_FOOT_X = 0.9280, FOOT_Y = 0.8600;
  var PEAK_X = 0.9400, PEAK_Y = -1.5000;
  var ORBIT_R = 0.155;

  var PHASES = [200, 280, 200, 200, 270, 280, 340, 160, 240, 300];
  var STARTS = [0];
  for (var i = 0; i < PHASES.length; i++) STARTS.push(STARTS[i] + PHASES[i]);
  var TOTAL = STARTS[STARTS.length - 1];

  function phaseAt(t) {
    for (var i = 0; i < PHASES.length; i++) if (t < STARTS[i + 1]) return i;
    return PHASES.length - 1;
  }
  function progressIn(t, i) {
    var p = (t - STARTS[i]) / PHASES[i];
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function glide(fx, fy, tx, ty, apex, t) {
    var e = ease(t);
    return [lerp(fx, tx, e), lerp(fy, ty, e) - apex * 4 * t * (1 - t)];
  }
  function dip(now, at, dur) {
    if (now < at) return 0;
    var t = (now - at) / dur;
    if (t > 1) return 0;
    return Math.sin(t * Math.PI) * Math.exp(-1.6 * t);
  }
  function orb(x, y, alpha, visible) {
    return { x: x, y: y, alpha: alpha === undefined ? 1 : alpha, visible: visible !== false };
  }

  function orbitCentre(t) {
    var p = phaseAt(t);
    if (p === 5) return [TIP_X, TIP_Y];
    if (p === 6) return glide(TIP_X, TIP_Y, PEAK_X, PEAK_Y, 0.30, progressIn(t, 6));
    return [PEAK_X, PEAK_Y];
  }
  function orbitAngle(t) {
    var p = phaseAt(t);
    if (p === 5) return progressIn(t, 5) * 7.85;
    if (p === 6) return 7.85 + progressIn(t, 6) * 6.28;
    if (p === 7) return 14.13 + progressIn(t, 7) * 2.0;
    return 0;
  }
  function orbitRadius(t) {
    var p = phaseAt(t);
    if (p === 5) return ORBIT_R;
    if (p === 6) return lerp(ORBIT_R, 0.055, ease(progressIn(t, 6)));
    if (p === 7) return lerp(0.055, 0, ease(progressIn(t, 7)));
    return 0;
  }
  function orbiting(t, offset) {
    var c = orbitCentre(t), a = orbitAngle(t) + offset, r = orbitRadius(t);
    return orb(c[0] + r / ASPECT * Math.cos(a), c[1] + r * Math.sin(a));
  }

  function mergedAt(t) {
    var p = phaseAt(t);
    if (p < 8) return orb(PEAK_X, PEAK_Y);
    if (p === 8) {
      var k = progressIn(t, 8), settle = 1 - (1 - k) * (1 - k);
      return orb(lerp(PEAK_X, HOME_X, settle), lerp(PEAK_Y, HOME_Y, settle));
    }
    return orb(HOME_X, HOME_Y);
  }

  function redAt(t) {
    var p = phaseAt(t), k = progressIn(t, p), g;
    if (p === 0) return orb(B_X, -3.2, 0, false);
    if (p === 1) return orb(B_X, lerp(-3.2, B_Y, ease(k)));
    if (p === 2) { g = glide(B_X, B_Y, E_X, E_Y, 0.42, k); return orb(g[0], g[1]); }
    if (p === 3) { g = glide(E_X, E_Y, R_X, R_Y, 0.40, k); return orb(g[0], g[1]); }
    if (p === 4) {
      if (k < 0.55) { g = glide(R_X, R_Y, LEFT_FOOT_X, FOOT_Y, 0.46, k / 0.55); return orb(g[0], g[1]); }
      var l = ease((k - 0.55) / 0.45);
      return orb(lerp(LEFT_FOOT_X, TIP_X, l), lerp(FOOT_Y, TIP_Y, l));
    }
    if (p === 5 || p === 6 || p === 7) return orbiting(t, 0);
    return mergedAt(t);
  }

  function silverAt(t) {
    var p = phaseAt(t), k = progressIn(t, p), g;
    if (p === 0) return orb(1.18, -1.4, 0, false);
    if (p === 1) { g = glide(1.18, -1.4, S_X, S_Y, 0.20, k); return orb(g[0], g[1]); }
    if (p === 2) { g = glide(S_X, S_Y, U_X, U_Y, 0.42, k); return orb(g[0], g[1]); }
    if (p === 3) { g = glide(U_X, U_Y, MID_X, S_Y, 0.34, k); return orb(g[0], g[1]); }
    if (p === 4) {
      if (k < 0.55) { g = glide(MID_X, S_Y, RIGHT_FOOT_X, FOOT_Y, 0.62, k / 0.55); return orb(g[0], g[1]); }
      var l = ease((k - 0.55) / 0.45);
      return orb(lerp(RIGHT_FOOT_X, TIP_X, l), lerp(FOOT_Y, TIP_Y, l));
    }
    if (p === 5 || p === 6) return orbiting(t, Math.PI);
    if (p === 7) { var o = orbiting(t, Math.PI); return orb(o.x, o.y, 1 - ease(k)); }
    return orb(PEAK_X, PEAK_Y, 0, false);
  }

  var DIP_AT = [STARTS[2], STARTS[3], STARTS[4], STARTS[3], STARTS[2], STARTS[5], STARTS[9]];
  var DIP_MS = [420, 420, 420, 420, 420, 520, 520];

  var sheet = new Image();
  sheet.decoding = 'async';
  sheet.src = 'assets/mark-letters.webp';
  sheet.onload = start;

  function start() {
    // A white copy of the sheet, so the sheen can brighten each letter cheaply.
    var lit = document.createElement('canvas');
    lit.width = sheet.width; lit.height = sheet.height;
    var lc = lit.getContext('2d');
    lc.drawImage(sheet, 0, 0);
    lc.globalCompositeOperation = 'source-in';
    lc.fillStyle = '#fff';
    lc.fillRect(0, 0, lit.width, lit.height);

    var ctx = canvas.getContext('2d');
    var markW, markH, originX, originY, dpr;

    // The dots climb to 1.5 mark-heights above the word and the fusion halo is
    // wider still, so the canvas is sized well past the letters and then offset
    // back into place. The image below it keeps the layout honest.
    function layout() {
      markW = img.getBoundingClientRect().width;
      if (!markW) return false;
      markH = markW / ASPECT;
      var w = markW * 1.5, h = markH * 7.2;
      originX = markW * 0.1;
      originY = markH * 3.6;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.style.left = -originX + 'px';
      canvas.style.top = -originY + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }
    if (!layout()) return;

    function px(x) { return originX + markW * x; }
    function py(y) { return originY + markH * y; }

    function dot(x, y, r, colour, alpha) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + colour + ',' + alpha + ')';
      ctx.arc(px(x), py(y), r, 0, 6.2832);
      ctx.fill();
    }

    function trail(now, sample, colour, r) {
      for (var s = 1; s <= 8; s++) {
        var past = sample(Math.max(now - s * 20, 0));
        if (!past.visible || past.alpha < 0.05) continue;
        dot(past.x, past.y, r * Math.max(1 - s * 0.07, 0.2),
          colour, 0.20 * (1 - s / 9) * past.alpha);
      }
    }

    function frame(now) {
      var r = markW * DOT_R;
      var p = phaseAt(now);
      var wordAlpha = p === 0 ? ease(progressIn(now, 0)) : 1;
      var burst = p === 7 ? Math.sin(progressIn(now, 7) * Math.PI) : 0;
      var sheen = p === 9 ? progressIn(now, 9) : -1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < 7; i++) {
        var box = LETTERS[i], src = RECTS[i];
        var d = dip(now, DIP_AT[i], DIP_MS[i]);
        var dx = px(box[0]), dy = py(box[1] + d * 0.045);
        var dw = markW * box[2], dh = markH * box[3];
        ctx.globalAlpha = wordAlpha;
        ctx.drawImage(sheet, src[0], src[1], src[2], src[3], dx, dy, dw, dh);
        if (sheen >= 0) {
          var centre = box[0] + box[2] / 2;
          var dist = centre - sheen * 1.35 + 0.14;
          var glow = Math.exp(-(dist * dist) / 0.012);
          if (glow > 0.02) {
            ctx.globalAlpha = glow * 0.75;
            ctx.drawImage(lit, src[0], src[1], src[2], src[3], dx, dy, dw, dh);
          }
        }
      }
      ctx.globalAlpha = 1;

      if (p === 9) {
        var prog = progressIn(now, 9);
        for (var ring = 0; ring < 3; ring++) {
          var local = prog - ring * 0.22;
          if (local <= 0) continue;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(' + RED + ',' + 0.30 * Math.max(1 - local, 0) + ')';
          ctx.lineWidth = markW * 0.008 * Math.max(1 - local, 0.05);
          ctx.arc(px(HOME_X), py(HOME_Y), markW * (0.03 + 0.55 * local), 0, 6.2832);
          ctx.stroke();
        }
      }

      trail(now, redAt, RED, r);
      trail(now, silverAt, SILVER, r);

      if (burst > 0) {
        var cx = px(PEAK_X), cy = py(PEAK_Y), halo = r * (5 + 16 * burst);
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, halo);
        grad.addColorStop(0, 'rgba(255,255,255,' + 0.95 * burst + ')');
        grad.addColorStop(0.5, 'rgba(255,201,163,' + 0.55 * burst + ')');
        grad.addColorStop(1, 'rgba(255,201,163,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, halo, 0, 6.2832);
        ctx.fill();
      }

      var s = silverAt(now);
      if (s.visible && s.alpha > 0.01) {
        var sx = px(s.x), sy = py(s.y), sr = r * 2.6;
        var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        sg.addColorStop(0, 'rgba(255,255,255,' + 0.7 * s.alpha + ')');
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, 6.2832);
        ctx.fill();
        dot(s.x, s.y, r * 0.92, SILVER, s.alpha);
      }

      var red = redAt(now);
      if (red.visible) dot(red.x, red.y, r, RED, 1);
    }

    // Draw the settled state before anything is swapped in. If frames never arrive,
    // the canvas is already correct and the mark is never left hidden.
    frame(TOTAL);

    var began = -1, done = false;
    function finish() {
      if (done) return;
      done = true;
      wrap.classList.remove('is-playing');
    }
    function tick(stamp) {
      // Sentinel rather than a falsy check, because a timestamp of 0 is legitimate.
      if (began < 0) began = stamp;
      var now = stamp - began;
      frame(now < TOTAL ? now : TOTAL);
      if (now < TOTAL) requestAnimationFrame(tick); else finish();
    }
    function begin() {
      wrap.classList.add('is-playing');
      requestAnimationFrame(tick);
      // A throttled tab must not leave the wordmark stuck mid-flight.
      setTimeout(finish, TOTAL + 3000);
    }

    // A background tab gets no frames, so wait for it to be looked at.
    if (document.hidden) {
      document.addEventListener('visibilitychange', function once() {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', once);
        begin();
      });
    } else {
      begin();
    }

    window.addEventListener('resize', function () {
      if (layout()) frame(TOTAL);
    });
  }
})();
