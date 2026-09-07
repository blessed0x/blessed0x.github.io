/* blessed0x — hero field
   From-scratch canvas "constellation" data-layer behind the hero.
   Drifting nodes + proximity links, a few neon accents, scroll parallax
   and faint mouse depth. Zero deps. Honors prefers-reduced-motion and
   pauses when the hero is off-screen or the tab is hidden. */

(function () {
  'use strict';

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    init();
  }

  function init() {
    var canvas = document.getElementById('hero-field');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var hero = canvas.parentElement;
    var w = 0, h = 0, dpr = 1;
    var nodes = [];
    var running = true;

    var NEON = '206,255,0';
    var PLAT = '236,236,236';

    function countFor() {
      var area = w * h;
      var n = Math.floor(area / 26000);
      return Math.max(18, Math.min(70, n));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    }

    function spawn() {
      nodes = [];
      var n = countFor();
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.36,
          vy: (Math.random() - 0.5) * 0.36,
          r: 0.7 + Math.random() * 1.1,
          neon: Math.random() < 0.08,
          ph: Math.random() * Math.PI * 2
        });
      }
    }

    /* parallax targets */
    var mx = 0, my = 0;      // mouse-derived
    var curX = 0, curY = 0;  // lerped
    var linkMax = 150;
    var fade = 0;

    function linkDistance() {
      var m = Math.min(w, h);
      return Math.min(150, m * 0.2);
    }

    function frame(t) {
      if (!running) { requestAnimationFrame(frame); return; }
      ctx.clearRect(0, 0, w, h);

      /* scroll parallax: hero lags content as it scrolls away */
      var rect = hero.getBoundingClientRect();
      var scrolled = Math.max(0, -rect.top);
      var targetY = scrolled * 0.32;
      curX += (mx - curX) * 0.045;
      curY += (targetY + my - curY) * 0.06;

      fade = Math.min(1, fade + 0.02);

      ctx.save();
      ctx.globalAlpha = 0.9 * fade;
      ctx.translate(curX, curY);

      linkMax = linkDistance();

      /* proximity links */
      ctx.lineWidth = 1;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < linkMax * linkMax) {
            var alpha = (1 - Math.sqrt(d2) / linkMax) * 0.16;
            ctx.strokeStyle = 'rgba(' + PLAT + ',' + alpha.toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      /* nodes */
      var t = t * 0.001;
      for (i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx + Math.sin(t + n.ph) * 0.06;
        n.y += n.vy + Math.cos(t + n.ph) * 0.06;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;

        var pulse = 0.6 + 0.4 * Math.sin(t * 1.4 + n.ph);
        if (n.neon) {
          ctx.fillStyle = 'rgba(' + NEON + ',' + (0.5 * pulse).toFixed(3) + ')';
        } else {
          ctx.fillStyle = 'rgba(' + PLAT + ',0.32)';
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.neon ? n.r * 1.9 : n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      requestAnimationFrame(frame);
    }

    /* pause when hero leaves viewport */
    var io = new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
      if (running) { mx = 0; my = 0; }
    }, { threshold: 0 });
    io.observe(hero);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) running = false;
    });

    window.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      var px = (e.clientX / window.innerWidth - 0.5);
      var py = (e.clientY / window.innerHeight - 0.5);
      mx = px * 26;
      my = py * 14;
    }, { passive: true });

    var rw = null;
    window.addEventListener('resize', function () {
      if (rw) return;
      rw = requestAnimationFrame(function () {
        resize();
        rw = null;
      });
    });

    resize();
    requestAnimationFrame(frame);
  }
})();
