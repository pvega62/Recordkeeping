/**
 * Constellation & Celestial Engine for Recordkeeping
 * Featuring 6 distinctly colored Constellations (zero distracting text labels):
 * - Lyra (✦ Radiant Topaz Gold - Featuring Vega)
 * - Aries (♈ Vivid Crimson Rose)
 * - Libra (♎ Radiant Emerald Jade)
 * - Scorpio (♏ Blazing Amber Flame - Featuring Antares)
 * - Gemini (♊ Electric Diamond Cyan - Featuring Castor & Pollux)
 * - Sagittarius (♐ Cosmic Amethyst Magenta - The Teapot)
 * Plus ambient star field, diffraction flares, shooting stars, and touch/mouse interaction.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('constellation-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'constellation-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
  }

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var width = 0;
  var height = 0;
  var dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Mouse & touch interaction state
  var pointer = {
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    active: false,
    radius: window.innerWidth < 768 ? 130 : 175
  };

  window.addEventListener('mousemove', function (e) {
    pointer.targetX = e.clientX;
    pointer.targetY = e.clientY;
    pointer.active = true;
    if (pointer.x < -1000) {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
    }
    if (Math.random() < 0.35) {
      spawnStardust(pointer.targetX, pointer.targetY);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', function () {
    pointer.active = false;
  }, { passive: true });

  // Mobile Touch Support
  window.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches[0]) {
      pointer.targetX = e.touches[0].clientX;
      pointer.targetY = e.touches[0].clientY;
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
      pointer.active = true;
      triggerSupernova(pointer.x, pointer.y);
      spawnStardust(pointer.targetX, pointer.targetY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches[0]) {
      pointer.targetX = e.touches[0].clientX;
      pointer.targetY = e.touches[0].clientY;
      pointer.active = true;
      if (Math.random() < 0.35) {
        spawnStardust(pointer.targetX, pointer.targetY);
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', function () {
    pointer.active = false;
  }, { passive: true });

  // Click triggers supernova shockwave
  window.addEventListener('click', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('.play-pause-btn') || e.target.closest('.view-toggle-btn'))) {
      return;
    }
    triggerSupernova(e.clientX, e.clientY);
  }, { passive: true });

  // Ambient starfield configuration
  var isMobile = window.innerWidth < 768;
  var STAR_COUNT = isMobile ? 55 : 95;
  var stars = [];

  var AMBIENT_PALETTES = [
    { name: 'white', r: 255, g: 255, b: 255 },
    { name: 'cyan',  r: 180, g: 235, b: 255 },
    { name: 'gold',  r: 255, g: 225, b: 140 },
    { name: 'amber', r: 255, g: 180, b: 90  }
  ];

  function Star() {
    this.reset(true);
  }

  Star.prototype.reset = function (initial) {
    this.x = initial ? Math.random() * width : (Math.random() < 0.5 ? 0 : width);
    this.y = Math.random() * height;
    
    var angle = Math.random() * Math.PI * 2;
    var speed = Math.random() * 0.08 + 0.03; // Gentle, tranquil drift without bouncing
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.baseRadius = Math.random() * 1.5 + 0.7;
    this.isAlpha = Math.random() < (isMobile ? 0.08 : 0.14);
    if (this.isAlpha) {
      this.baseRadius = Math.random() * 1.1 + 1.8;
    }

    this.palette = AMBIENT_PALETTES[Math.floor(Math.random() * AMBIENT_PALETTES.length)];
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = Math.random() * 0.025 + 0.01;
    this.baseAlpha = Math.random() * 0.35 + 0.40;
    this.flareAngle = Math.random() * Math.PI;
    this.flareRotSpeed = (Math.random() - 0.5) * 0.003;
  };

  Star.prototype.update = function () {
    // Stars drift smoothly and calmly — zero bouncing or touch repulsion
    this.x += this.vx;
    this.y += this.vy;

    var margin = 20;
    if (this.x < -margin) this.x = width + margin;
    else if (this.x > width + margin) this.x = -margin;
    if (this.y < -margin) this.y = height + margin;
    else if (this.y > height + margin) this.y = -margin;

    this.twinklePhase += this.twinkleSpeed;
    if (this.isAlpha) {
      this.flareAngle += this.flareRotSpeed;
    }
  };

  Star.prototype.draw = function () {
    var osc = Math.sin(this.twinklePhase);
    var currentAlpha = Math.max(0.15, Math.min(1.0, this.baseAlpha + osc * 0.35));
    var r = this.baseRadius * (1 + osc * 0.18);
    var p = this.palette;

    // Attenuate stars directly behind central title text so letters stay 100% clean
    var tdx = this.x - width * 0.50;
    var tdy = (this.y - 180) * 2.2;
    var textDist = Math.sqrt(tdx * tdx + tdy * tdy);
    var isUnderText = textDist < 260;
    if (isUnderText) {
      currentAlpha *= 0.20;
    }

    var haloSize = r * (this.isAlpha ? 5.0 : 3.5);
    var grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, haloSize);
    grad.addColorStop(0, 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (currentAlpha * 0.85) + ')');
    grad.addColorStop(0.35, 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (currentAlpha * 0.25) + ')');
    grad.addColorStop(1, 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, haloSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, isUnderText ? r * 0.75 : r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, ' + Math.min(1, currentAlpha + 0.25) + ')';
    ctx.fill();

    if (this.isAlpha && currentAlpha > 0.45 && !isUnderText) {
      var flareLen = r * 4.0 * (1 + osc * 0.22);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.flareAngle);
      ctx.strokeStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (currentAlpha * 0.60) + ')';
      ctx.lineWidth = 1.0;

      ctx.beginPath();
      ctx.moveTo(-flareLen, 0);
      ctx.lineTo(flareLen, 0);
      ctx.moveTo(0, -flareLen);
      ctx.lineTo(0, flareLen);
      ctx.stroke();
      ctx.restore();
    }
  };

  for (var i = 0; i < STAR_COUNT; i++) {
    stars.push(new Star());
  }

  // =========================================================================
  // 6 FEATURED CONSTELLATIONS WITH DISTINCT COLOR PALETTES
  // (All text labels removed to eliminate visual distraction)
  // 1. Lyra        - Radiant Topaz Gold (#FFD700 - Featuring Vega)
  // 2. Aries       - Vivid Crimson Rose (#FF2E63)
  // 3. Libra       - Radiant Emerald Jade (#00F5A0)
  // 4. Scorpio     - Blazing Amber Flame (#FF7A00 - Featuring Antares)
  // 5. Gemini      - Electric Diamond Cyan (#00D2FF - Castor & Pollux)
  // 6. Sagittarius - Cosmic Amethyst Magenta (#D946EF - The Teapot)
  // =========================================================================
  var constellations = [
    // -------------------------------------------------------------
    // 1. LYRA (The Celestial Harp of Music) - Radiant Topaz Gold
    // -------------------------------------------------------------
    {
      id: 'lyra',
      color: { r: 255, g: 215, b: 0, hex: '#FFD700' },
      x: width * 0.18,
      y: height * 0.18,
      vx: 0.05,
      vy: -0.03,
      angle: 0.22,
      vAngle: 0.0005,
      scale: isMobile ? 0.80 : 1.10,
      nodes: [
        { id: 'vega',    x: 0,   y: 0,   r: 5.2, name: 'Vega', isMajor: true },
        { id: 'epsilon', x: 28,  y: -22, r: 2.6, name: 'ε Lyrae' },
        { id: 'zeta',    x: 34,  y: 18,  r: 2.8, name: 'ζ Lyrae' },
        { id: 'delta',   x: 68,  y: 12,  r: 2.6, name: 'δ Lyrae' },
        { id: 'beta',    x: 62,  y: 56,  r: 3.6, name: 'Sheliak', isMajor: true },
        { id: 'gamma',   x: 98,  y: 48,  r: 3.4, name: 'Sulafat' }
      ],
      edges: [
        [0, 1],
        [0, 2],
        [2, 3],
        [3, 5],
        [5, 4],
        [4, 2]
      ]
    },

    // -------------------------------------------------------------
    // 2. ARIES (The Ram) - Crimson Rose
    // -------------------------------------------------------------
    {
      id: 'aries',
      color: { r: 255, g: 46, b: 99, hex: '#FF2E63' },
      x: width * 0.82,
      y: height * 0.18,
      vx: -0.05,
      vy: -0.02,
      angle: 0.15,
      vAngle: 0.0005,
      scale: isMobile ? 0.78 : 1.05,
      nodes: [
        { id: 'mesarthim', x: -55, y: 28,  r: 2.8, name: 'Mesarthim' },
        { id: 'sheratan',  x: -30, y: 16,  r: 3.4, name: 'Sheratan' },
        { id: 'hamal',     x: 2,   y: -2,  r: 4.4, name: 'Hamal', isMajor: true },
        { id: 'bharani',   x: 42,  y: -14, r: 3.0, name: 'Bharani' },
        { id: 'botein',    x: 76,  y: -8,  r: 2.6, name: 'Botein' }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4]
      ]
    },

    // -------------------------------------------------------------
    // 3. GEMINI (The Celestial Twins) - Electric Diamond Cyan
    // -------------------------------------------------------------
    {
      id: 'gemini',
      color: { r: 0, g: 210, b: 255, hex: '#00D2FF' },
      x: width * 0.86,
      y: height * 0.50,
      vx: 0.05,
      vy: 0.05,
      angle: -0.15,
      vAngle: -0.0003,
      scale: isMobile ? 0.74 : 0.98,
      nodes: [
        { id: 'castor',  x: -36, y: -78, r: 4.5, name: 'Castor', isMajor: true },
        { id: 'pollux',  x: 28,  y: -68, r: 4.7, name: 'Pollux', isMajor: true },
        { id: 'mebsuta', x: -44, y: -26, r: 3.4, name: 'Mebsuta' },
        { id: 'wasat',   x: 20,  y: -16, r: 3.4, name: 'Wasat' },
        { id: 'mekbuda', x: 12,  y: 28,  r: 3.0, name: 'Mekbuda' },
        { id: 'alhena',  x: 4,   y: 72,  r: 4.0, name: 'Alhena', isMajor: true },
        { id: 'tejat',   x: -54, y: 22,  r: 3.2, name: 'Tejat' },
        { id: 'propus',  x: -64, y: 58,  r: 3.0, name: 'Propus' }
      ],
      edges: [
        [0, 2], [2, 6], [6, 7],
        [1, 3], [3, 4], [4, 5],
        [2, 3]
      ]
    },

    // -------------------------------------------------------------
    // 4. LIBRA (The Scales) - Emerald Jade
    // -------------------------------------------------------------
    {
      id: 'libra',
      color: { r: 0, g: 245, b: 160, hex: '#00F5A0' },
      x: width * 0.20,
      y: height * 0.68,
      vx: -0.05,
      vy: 0.04,
      angle: -0.2,
      vAngle: -0.0004,
      scale: isMobile ? 0.78 : 1.05,
      nodes: [
        { id: 'zubeneschamali', x: 0,   y: -52, r: 4.4, name: 'Zubeneschamali', isMajor: true },
        { id: 'zubenelgenubi',  x: -52, y: 10,  r: 4.0, name: 'Zubenelgenubi', isMajor: true },
        { id: 'zubenelhakrabi', x: 42,  y: 16,  r: 3.2, name: 'Zubenelhakrabi' },
        { id: 'brachium',       x: -2,  y: 64,  r: 3.4, name: 'Brachium' },
        { id: 'upsilon',        x: -26, y: 38,  r: 2.6, name: 'υ Librae' },
        { id: 'tau',            x: 24,  y: 44,  r: 2.6, name: 'τ Librae' }
      ],
      edges: [
        [0, 1],
        [0, 2],
        [1, 4], [4, 3],
        [2, 5], [5, 3]
      ]
    },

    // -------------------------------------------------------------
    // 5. SAGITTARIUS (The Teapot) - Cosmic Magenta
    // -------------------------------------------------------------
    {
      id: 'sagittarius',
      color: { r: 217, g: 70, b: 239, hex: '#D946EF' },
      x: width * 0.50,
      y: height * 0.64,
      vx: -0.04,
      vy: 0.05,
      angle: 0.2,
      vAngle: 0.0004,
      scale: isMobile ? 0.74 : 1.0,
      nodes: [
        { id: 'kaus_bor',  x: 0,   y: -46, r: 4.0, name: 'Kaus Borealis', isMajor: true },
        { id: 'kaus_med',  x: -30, y: -14, r: 3.5, name: 'Kaus Media' },
        { id: 'phi',       x: 30,  y: -14, r: 3.4, name: 'φ Sagittarii' },
        { id: 'alnasl',    x: -68, y: 2,   r: 3.8, name: 'Alnasl', isMajor: true },
        { id: 'kaus_aus',  x: -20, y: 40,  r: 4.6, name: 'Kaus Australis', isMajor: true },
        { id: 'ascella',   x: 38,  y: 34,  r: 4.0, name: 'Ascella', isMajor: true },
        { id: 'nunki',     x: 58,  y: -34, r: 4.2, name: 'Nunki', isMajor: true },
        { id: 'tau',       x: 56,  y: 8,   r: 3.2, name: 'τ Sagittarii' }
      ],
      edges: [
        [0, 1], [0, 2], [1, 2],
        [1, 3], [3, 4],
        [1, 4], [4, 5], [5, 2],
        [2, 6], [6, 7], [7, 5]
      ]
    },

    // -------------------------------------------------------------
    // 6. SCORPIO (The Scorpion) - Blazing Amber Flame
    // -------------------------------------------------------------
    {
      id: 'scorpio',
      color: { r: 255, g: 122, b: 0, hex: '#FF7A00' },
      x: width * 0.80,
      y: height * 0.68,
      vx: -0.06,
      vy: -0.04,
      angle: 0.1,
      vAngle: 0.0004,
      scale: isMobile ? 0.72 : 0.95,
      nodes: [
        { id: 'acrab',    x: -38, y: -64, r: 3.2, name: 'Acrab' },
        { id: 'dschubba', x: -18, y: -48, r: 3.5, name: 'Dschubba' },
        { id: 'pi',       x: -42, y: -32, r: 2.8, name: 'π Scorpii' },
        { id: 'antares',  x: 2,   y: -18, r: 5.0, name: 'Antares', isMajor: true },
        { id: 'tau',      x: 14,  y: 6,   r: 2.8, name: 'τ Scorpii' },
        { id: 'epsilon',  x: 20,  y: 32,  r: 3.2, name: 'Larawag' },
        { id: 'mu',       x: 18,  y: 54,  r: 2.8, name: 'μ Scorpii' },
        { id: 'zeta',     x: 8,   y: 76,  r: 3.0, name: 'ζ Scorpii' },
        { id: 'eta',      x: -16, y: 88,  r: 3.0, name: 'η Scorpii' },
        { id: 'sargas',   x: -38, y: 80,  r: 3.6, name: 'Sargas' },
        { id: 'iota',     x: -56, y: 60,  r: 2.8, name: 'ι Scorpii' },
        { id: 'shaula',   x: -48, y: 34,  r: 4.2, name: 'Shaula', isMajor: true },
        { id: 'lesath',   x: -60, y: 32,  r: 3.0, name: 'Lesath' }
      ],
      edges: [
        [0, 1], [2, 1],
        [1, 3],
        [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
        [10, 11], [11, 12]
      ]
    }
  ];

  function updateAndDrawConstellations(time) {
    for (var c = 0; c < constellations.length; c++) {
      var item = constellations[c];
      var col = item.color;

      item.x += item.vx;
      item.y += item.vy;
      item.angle += item.vAngle;

      // Soft orbital deflection away from center text zone (Recordkeeping title & intro)
      var tdx = item.x - width * 0.50;
      var tdy = (item.y - 180) * 2.2;
      var textDist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (textDist < 300 && textDist > 0) {
        var force = (1 - textDist / 300) * 0.70;
        item.x += (tdx / textDist) * force;
        item.y += (tdy / textDist) * (force * 0.45);
      }

      var pad = 200;
      if (item.x < -pad) item.x = width + pad;
      else if (item.x > width + pad) item.x = -pad;
      if (item.y < -pad) item.y = height + pad;
      else if (item.y > height + pad) item.y = -pad;

      var cosA = Math.cos(item.angle);
      var sinA = Math.sin(item.angle);

      var pDist = 9999;
      if (pointer.active) {
        var pdx = item.x - pointer.x;
        var pdy = item.y - pointer.y;
        pDist = Math.sqrt(pdx * pdx + pdy * pdy);
      }
      var isNearPointer = pDist < 220;
      var hoverBoost = isNearPointer ? (1 - pDist / 220) * 0.45 : 0;

      var worldNodes = [];
      for (var n = 0; n < item.nodes.length; n++) {
        var node = item.nodes[n];
        var sx = node.x * item.scale;
        var sy = node.y * item.scale;
        var wx = item.x + sx * cosA - sy * sinA;
        var wy = item.y + sx * sinA + sy * cosA;
        worldNodes.push({
          x: wx,
          y: wy,
          r: node.r,
          name: node.name,
          isMajor: node.isMajor
        });
      }

      var pulse = 0.55 + 0.25 * Math.sin(time * 0.0022 + c * 1.2) + hoverBoost;
      pulse = Math.min(1.0, pulse);

      // Intelligent text readability dampener:
      // If a constellation is near the text zone, attenuate it so it never obscures reading
      var isOverText = textDist < 270;
      if (isOverText) {
        pulse *= 0.15; // Whisper-light ghosting if ever near text
      }

      for (var e = 0; e < item.edges.length; e++) {
        var p1 = worldNodes[item.edges[e][0]];
        var p2 = worldNodes[item.edges[e][1]];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (pulse * 0.32) + ')';
        ctx.lineWidth = isMobile ? 2.5 : 3.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (pulse * 0.80) + ')';
        ctx.lineWidth = isMobile ? 1.1 : 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (pulse * 0.45) + ')';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      for (var i = 0; i < worldNodes.length; i++) {
        var wn = worldNodes[i];
        var glowR = wn.r * (wn.isMajor ? (isOverText ? 3.0 : 4.8) : 3.2);

        var g = ctx.createRadialGradient(wn.x, wn.y, 0, wn.x, wn.y, glowR);
        g.addColorStop(0, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ', 0.90)');
        g.addColorStop(0.35, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ', ' + (pulse * 0.45) + ')');
        g.addColorStop(1, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ', 0)');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(wn.x, wn.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(wn.x, wn.y, isOverText ? wn.r * 0.85 : wn.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        if (wn.isMajor) {
          var flareMult = isOverText ? 2.2 : 5.0;
          var flareLen = wn.r * flareMult * (1 + 0.22 * Math.sin(time * 0.003 + i));
          ctx.strokeStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (isOverText ? 0.40 : 0.85) + ')';
          ctx.lineWidth = isOverText ? 0.9 : 1.3;
          ctx.beginPath();
          ctx.moveTo(wn.x - flareLen, wn.y);
          ctx.lineTo(wn.x + flareLen, wn.y);
          ctx.moveTo(wn.x, wn.y - flareLen);
          ctx.lineTo(wn.x, wn.y + flareLen);
          ctx.stroke();

          var subLen = flareLen * 0.45;
          ctx.strokeStyle = isOverText ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = isOverText ? 0.6 : 0.9;
          ctx.beginPath();
          ctx.moveTo(wn.x - subLen, wn.y - subLen);
          ctx.lineTo(wn.x + subLen, wn.y + subLen);
          ctx.moveTo(wn.x - subLen, wn.y + subLen);
          ctx.lineTo(wn.x + subLen, wn.y - subLen);
          ctx.stroke();
        }
      }

      // (No text labels rendered - completely distraction-free starry background)
    }
  }

  // ==========================================
  // SHOOTING STARS / METEORS
  // ==========================================
  var shootingStars = [];

  function ShootingStar() {
    this.reset();
  }

  ShootingStar.prototype.reset = function () {
    this.x = Math.random() * width * 1.1;
    this.y = Math.random() * (height * 0.45);
    this.len = Math.random() * 90 + 70;
    this.speed = Math.random() * 2.5 + 3.5; // Calmer, graceful glide (3.5 - 6 px/frame)
    this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.25;
    this.dx = Math.cos(this.angle) * this.speed;
    this.dy = Math.sin(this.angle) * this.speed;
    this.alpha = 1.0;
    this.active = true;
    this.thickness = Math.random() * 1.4 + 1.1;
    this.color = constellations[Math.floor(Math.random() * constellations.length)].color;
  };

  ShootingStar.prototype.update = function () {
    if (!this.active) return;
    this.x += this.dx;
    this.y += this.dy;
    this.alpha -= 0.007; // Gentle, lingering fade
    if (this.alpha <= 0 || this.x > width + 200 || this.y > height + 200) {
      this.active = false;
    }
  };

  ShootingStar.prototype.draw = function () {
    if (!this.active || this.alpha <= 0) return;
    var tailX = this.x - Math.cos(this.angle) * this.len;
    var tailY = this.y - Math.sin(this.angle) * this.len;
    var c = this.color;

    var grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
    grad.addColorStop(0, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0)');
    grad.addColorStop(0.65, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', ' + (this.alpha * 0.75) + ')');
    grad.addColorStop(1, 'rgba(255, 255, 255, ' + this.alpha + ')');

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = this.thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    var headGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 7);
    headGlow.addColorStop(0, 'rgba(255, 255, 255, ' + this.alpha + ')');
    headGlow.addColorStop(0.5, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', ' + (this.alpha * 0.8) + ')');
    headGlow.addColorStop(1, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0)');

    ctx.fillStyle = headGlow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  var lastShootingStarTime = 0;
  var nextShootingStarDelay = 7000; // Initial delay

  function handleShootingStars(timestamp) {
    if (timestamp - lastShootingStarTime > nextShootingStarDelay) {
      lastShootingStarTime = timestamp;
      nextShootingStarDelay = 9000 + Math.random() * 11000; // Occur once every 9-20 seconds
      shootingStars.push(new ShootingStar());
    }

    for (var i = shootingStars.length - 1; i >= 0; i--) {
      shootingStars[i].update();
      shootingStars[i].draw();
      if (!shootingStars[i].active) {
        shootingStars.splice(i, 1);
      }
    }
  }

  // ==========================================
  // SUPERNOVA & STARDUST EFFECTS (No Bouncing)
  // ==========================================
  var supernovae = [];
  var stardust = [];

  function triggerSupernova(x, y) {
    var randomColor = constellations[Math.floor(Math.random() * constellations.length)].color;
    supernovae.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: isMobile ? 130 : 185,
      alpha: 1.0,
      speed: 5.5,
      color: randomColor
    });
    // NOTE: Stars stay peaceful; no blast force added to stars so they never bounce!
  }

  function spawnStardust(x, y) {
    var c = constellations[Math.floor(Math.random() * constellations.length)].color;
    for (var k = 0; k < 2; k++) {
      stardust.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9 - 0.4,
        size: Math.random() * 2.2 + 0.8,
        alpha: 0.95,
        decay: Math.random() * 0.025 + 0.02,
        color: c
      });
    }
  }

  function updateAndDrawEffects() {
    for (var i = supernovae.length - 1; i >= 0; i--) {
      var sn = supernovae[i];
      sn.radius += sn.speed;
      sn.alpha = Math.max(0, 1 - sn.radius / sn.maxRadius);
      var sc = sn.color;

      ctx.save();
      ctx.beginPath();
      ctx.arc(sn.x, sn.y, sn.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + sc.r + ',' + sc.g + ',' + sc.b + ',' + (sn.alpha * 0.85) + ')';
      ctx.lineWidth = Math.max(0.5, 3.4 * sn.alpha);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sn.x, sn.y, sn.radius * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (sn.alpha * 0.5) + ')';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();

      if (sn.radius >= sn.maxRadius || sn.alpha <= 0) {
        supernovae.splice(i, 1);
      }
    }

    for (var j = stardust.length - 1; j >= 0; j--) {
      var sd = stardust[j];
      sd.x += sd.vx;
      sd.y += sd.vy;
      sd.alpha -= sd.decay;

      if (sd.alpha <= 0) {
        stardust.splice(j, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(sd.x, sd.y, sd.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + sd.color.r + ',' + sd.color.g + ',' + sd.color.b + ',' + sd.alpha + ')';
      ctx.fill();
    }
  }

  // ==========================================
  // MAIN ANIMATION LOOP
  // ==========================================
  var CONNECTION_MAX_DIST = isMobile ? 85 : 130;

  function render(timestamp) {
    ctx.clearRect(0, 0, width, height);

    if (pointer.active) {
      pointer.x += (pointer.targetX - pointer.x) * 0.18;
      pointer.y += (pointer.targetY - pointer.y) * 0.18;
    }

    // 1. Ambient Background Stars & Subtle Connecting Lines
    for (var i = 0; i < stars.length; i++) {
      stars[i].update();

      for (var j = i + 1; j < stars.length; j++) {
        var dx = stars[i].x - stars[j].x;
        var dy = stars[i].y - stars[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_MAX_DIST) {
          var ratio = 1 - dist / CONNECTION_MAX_DIST;
          var lineAlpha = ratio * ratio * 0.35;

          var midY = (stars[i].y + stars[j].y) * 0.5;
          var t = Math.max(0, Math.min(1, midY / height));

          var rCol = Math.round(180 + (255 - 180) * t);
          var gCol = Math.round(230 + (215 - 230) * t);
          var bCol = Math.round(255 + (110 - 255) * t);

          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.strokeStyle = 'rgba(' + rCol + ',' + gCol + ',' + bCol + ',' + lineAlpha + ')';
          ctx.lineWidth = ratio * 1.2 + 0.3;
          ctx.stroke();
        }
      }
    }

    // 2. Interactive Pointer Web
    if (pointer.active && pointer.x > 0 && pointer.y > 0) {
      var cursorGlow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 22);
      cursorGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      cursorGlow.addColorStop(0.35, 'rgba(255, 225, 120, 0.65)');
      cursorGlow.addColorStop(1, 'rgba(255, 180, 50, 0)');

      ctx.fillStyle = cursorGlow;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      for (var s = 0; s < stars.length; s++) {
        var mdx = stars[s].x - pointer.x;
        var mdy = stars[s].y - pointer.y;
        var mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mdist < pointer.radius) {
          var mratio = 1 - mdist / pointer.radius;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(stars[s].x, stars[s].y);
          ctx.strokeStyle = 'rgba(255, 235, 160, ' + (mratio * 0.65) + ')';
          ctx.lineWidth = mratio * 1.8 + 0.4;
          ctx.stroke();
        }
      }
    }

    // 3. Draw Ambient Stars
    for (var k = 0; k < stars.length; k++) {
      stars[k].draw();
    }

    // 4. Draw the 6 Featured Constellations (vivid, color-coded, zero distracting labels)
    updateAndDrawConstellations(timestamp);

    // 5. Shooting Stars
    handleShootingStars(timestamp);

    // 6. Dynamic Effects (Supernovae & Stardust)
    updateAndDrawEffects();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
