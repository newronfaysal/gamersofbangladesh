// Homepage behaviour: animated pixel hero, typing tagline, pixel icons, daily challenge,
// "continue playing", random game and scroll reveal. Loaded after common.js (window.GOB).
(function () {
  'use strict';
  window.__gobHome = true;

  var GOB = window.GOB || {};
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function onChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }
  function $(id) { return document.getElementById(id); }

  /* ------------------------------------------------------------------ pixel sprites */
  // One character per pixel; '.' is transparent. Palettes are per sprite.
  var SPRITES = {
    rickshaw: {
      pal: { G: '#00a86b', Y: '#ffcc33', R: '#f42a41', K: '#101414', S: '#c98a5a', W: '#f2efe6', M: '#aab5ae' },
      rows: [
        '...GGGGGGG...KK.',
        '..GYGYGYGYG..SS.',
        '.GGGGGGGGGGG.SS.',
        '.R.........R.WW.',
        '.R.........R.WW.',
        '.RRRRRRRRRRR.WW.',
        '.RRRRRRRRRRRRWW.',
        '..YYYYYYYYYY.SS.',
        '..KKKK....KKKK..',
        '.K....K..K....K.',
        '.K.MM.K..K.MM.K.',
        '.K....K..K....K.',
        '..KKKK....KKKK..'
      ]
    },
    mango: {
      pal: { G: '#2e8b3d', B: '#6b4423', O: '#ff9a1f', Y: '#ffd04d', R: '#e0601a' },
      rows: [
        '.......BGG..',
        '......BBGGG.',
        '...OOOOOOOO.',
        '..OYYOOOOOOO',
        '.OYYYOOOOOOO',
        '.OYYOOOOOOOR',
        'OOYOOOOOOOOR',
        'OOOOOOOOOOOR',
        'OOOOOOOOOORR',
        'OOOOOOOOOORR',
        '.OOOOOOOORR.',
        '.OOOOOOORR..',
        '..OOOOORR...',
        '....RRRR....'
      ]
    },
    tiger: {
      pal: { O: '#ff8a1f', K: '#1a1208', W: '#fff3dc', N: '#f4778a' },
      rows: [
        '..KKK......KKK..',
        '.KOOOK....KOOOK.',
        '.KOOOOOOOOOOOOK.',
        'KOOKOOOKKOOOKOOK',
        'KOOOOOOOOOOOOOOK',
        'KOOWKOOOOOOKWOOK',
        'KOOOOOOOOOOOOOOK',
        'KKOOOOWWWWOOOOKK',
        '.KOOOWWNNWWOOOK.',
        '.KOOOWWKKWWOOOK.',
        '..KOOOWWWWOOOK..',
        '...KKOOOOOOKK...',
        '.....KKKKKK.....'
      ]
    },
    memory: {
      pal: { W: '#e8f5ee', G: '#00a86b', R: '#f42a41' },
      rows: [
        '..WWWWWWWW..',
        '.WGGGGGGGGW.',
        'WGGGGGGGGGGW',
        'WGGGGGGGGGGW',
        'WGGRRRRGGGGW',
        'WGRRRRRRGGGW',
        'WGRRRRRRGGGW',
        'WGRRRRRRGGGW',
        'WGGRRRRGGGGW',
        'WGGGGGGGGGGW',
        'WGGGGGGGGGGW',
        '.WGGGGGGGGW.',
        '..WWWWWWWW..'
      ]
    }
  };

  var spriteCache = {};
  function spriteCanvas(name) { // off-screen 1px-per-cell canvas, cached
    if (spriteCache[name]) return spriteCache[name];
    var s = SPRITES[name], h = s.rows.length, w = s.rows[0].length;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    for (var y = 0; y < h; y++) {
      for (var i = 0; i < w; i++) {
        var col = s.pal[s.rows[y].charAt(i)];
        if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); }
      }
    }
    return (spriteCache[name] = c);
  }
  function paintSprite(cv, name, scale) {
    if (!SPRITES[name]) return;
    var src = spriteCanvas(name);
    cv.width = src.width; cv.height = src.height;
    var x = cv.getContext('2d');
    x.clearRect(0, 0, cv.width, cv.height);
    x.drawImage(src, 0, 0);
    cv.style.width = src.width * scale + 'px';
    cv.style.height = src.height * scale + 'px';
  }
  Array.prototype.forEach.call(document.querySelectorAll('canvas[data-sprite]'), function (cv) {
    paintSprite(cv, cv.getAttribute('data-sprite'), Number(cv.getAttribute('data-scale')) || 5);
  });

  /* ------------------------------------------------------------------ game list (read from the cards) */
  var games = Array.prototype.map.call(document.querySelectorAll('.card[data-game]'), function (c) {
    var bestEl = c.querySelector('[data-best]');
    return {
      id: c.getAttribute('data-game'),
      name: c.getAttribute('data-name'),
      href: c.getAttribute('href'),
      accent: c.style.getPropertyValue('--accent').trim(),
      rgb: c.style.getPropertyValue('--accent-rgb').trim(),
      unit: bestEl ? bestEl.getAttribute('data-unit') || '' : '',
      sprite: c.querySelector('[data-sprite]').getAttribute('data-sprite')
    };
  });
  function byId(id) { for (var i = 0; i < games.length; i++) if (games[i].id === id) return games[i]; return null; }
  function bestText(g) {
    var b = GOB.getBest ? GOB.getBest(g.id) : 0;
    return b ? b + g.unit : '—';
  }
  function lastId() { return GOB.load ? GOB.load('gob:last') : null; }

  /* ------------------------------------------------------------------ continue playing */
  (function () {
    var row = $('continue'), g = byId(lastId());
    if (!row || !g) return;
    paintSprite($('continueSprite'), g.sprite, 3);
    $('continueName').textContent = g.name;
    $('continueBest').textContent = bestText(g);
    row.setAttribute('href', g.href);
    row.setAttribute('aria-label', 'Continue playing ' + g.name);
    row.hidden = false;
  })();

  /* ------------------------------------------------------------------ daily challenge (resets at midnight Dhaka time, UTC+6) */
  var DAY = 864e5, OFFSET = 6 * 36e5;
  function dayIndex(now) { return Math.floor((now + OFFSET) / DAY); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var dailyBox = $('daily'), dailyGame = null;
  function renderDaily() {
    if (!dailyBox || !games.length) return;
    var g = games[dayIndex(Date.now()) % games.length];
    dailyGame = g;
    dailyBox.style.setProperty('--accent', g.accent);
    dailyBox.style.setProperty('--accent-rgb', g.rgb);
    paintSprite($('dailySprite'), g.sprite, 4);
    $('dailyName').textContent = g.name;
    $('dailyBest').textContent = bestText(g);
    $('dailyPlay').setAttribute('href', g.href);
    var hero = $('dailyBtn');
    if (hero) { hero.setAttribute('href', g.href); hero.setAttribute('aria-label', 'Daily challenge: ' + g.name); }
  }
  function tickCountdown() {
    var now = Date.now(), left = (dayIndex(now) + 1) * DAY - OFFSET - now;
    if (left <= 0) { renderDaily(); left = DAY; }
    var s = Math.floor(left / 1000);
    var el = $('countdown');
    if (el) el.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
  }
  renderDaily();
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ------------------------------------------------------------------ random game */
  var randomBtn = $('randomBtn');
  if (randomBtn && games.length) {
    randomBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var last = lastId();
      var pool = games.filter(function (g) { return g.id !== last; });
      if (!pool.length) pool = games;
      window.location.href = pool[Math.floor(Math.random() * pool.length)].href;
    });
  }

  /* ------------------------------------------------------------------ typing tagline */
  (function () {
    var el = $('typed');
    if (!el) return;
    var phrases = [
      'Free mini-games, made in Bangladesh.',
      'Perfect for a quick chai break.',
      'Beat your best score. Then beat it again.',
      'Play on your phone or your PC.'
    ];
    if (reduce.matches) { el.textContent = phrases[0]; return; }
    var p = 0, n = 0, erasing = false;
    el.textContent = '';
    (function tick() {
      var text = phrases[p];
      if (!erasing) {
        n++;
        el.textContent = text.slice(0, n);
        if (n === text.length) { erasing = true; return setTimeout(tick, 1800); }
        return setTimeout(tick, 45 + Math.random() * 45);
      }
      n--;
      el.textContent = text.slice(0, n);
      if (n === 0) { erasing = false; p = (p + 1) % phrases.length; return setTimeout(tick, 400); }
      setTimeout(tick, 22);
    })();
  })();

  /* ------------------------------------------------------------------ scroll reveal */
  (function () {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    function done(el) { // hand the element back to its normal hover transitions
      el.classList.remove('reveal', 'in');
      el.style.removeProperty('--d');
    }
    if (reduce.matches || !('IntersectionObserver' in window)) { items.forEach(done); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        // Already scrolled past (e.g. after jumping to #games): show it, no animation needed.
        if (!e.isIntersecting && e.boundingClientRect.bottom <= 0) { io.unobserve(el); done(el); return; }
        if (!e.isIntersecting) return;
        io.unobserve(el);
        el.classList.add('in');
        var delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
        setTimeout(function () { done(el); }, 700 + delay * 1000);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------------ hero scene (river, sunset, kites, rickshaw) */
  var cv = $('scene');
  if (cv && cv.getContext) initScene(cv);

  function hash(n) {
    n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
    return n >>> 0;
  }

  function initScene(canvas) {
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentNode;
    var W = 0, H = 0, P = 3, raf = 0, running = false, visible = true, lastFrame = 0, lastT = 2;
    var rick = spriteCanvas('rickshaw');

    var SKY = ['#120c2b', '#1a1040', '#26124f', '#3a1458', '#561a5e', '#7a2260', '#a02e5c', '#c94258', '#e8604c', '#f98a3d', '#ffb347', '#ffd27a'];
    var RIVER = ['#7a2b5e', '#552562', '#38205c', '#251a4a', '#171d3a', '#0f2a33'];
    var KITES = [
      { fx: 0.12, fy: 0.22, vx: 4, ph: 0.0, c: '#ff4d5e', c2: '#ffd27a' },
      { fx: 0.46, fy: 0.40, vx: 6, ph: 1.7, c: '#ffcc33', c2: '#ff4d5e' },
      { fx: 0.74, fy: 0.12, vx: 3, ph: 3.1, c: '#2dd4bf', c2: '#ffffff' },
      { fx: 0.90, fy: 0.55, vx: 5, ph: 4.6, c: '#a78bfa', c2: '#ffcc33' }
    ];

    function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h)); }

    function disc(cx, cy, r, color, topHalfOnly) {
      ctx.fillStyle = color;
      for (var dy = -r; dy <= (topHalfOnly ? 0 : r); dy++) {
        var hw = Math.round(Math.sqrt(r * r - dy * dy));
        ctx.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
      }
    }

    function palm(x, base, h, color) {
      var top = base - h, i;
      R(x, top, 1, h, color);
      var arcs = [[1, -1], [2, -1], [3, 0], [4, 1], [5, 2], [2, -2], [3, -2], [4, -1]];
      for (i = 0; i < arcs.length; i++) {
        R(x - arcs[i][0], top + arcs[i][1], 1, 1, color);
        R(x + arcs[i][0], top + arcs[i][1], 1, 1, color);
      }
      R(x, top - 1, 1, 1, color); R(x - 1, top - 2, 3, 1, color);
    }

    function kite(x, y, c, c2, t) {
      var widths = [1, 3, 5, 7, 5, 3, 1], j;
      x = Math.round(x);
      for (j = 0; j < 7; j++) R(x - (widths[j] >> 1), y + j, widths[j], 1, c);
      R(x, y, 1, 7, c2); R(x - 2, y + 3, 5, 1, c2);
      for (j = 0; j < 10; j++) R(x + Math.round(Math.sin(t * 3 + j * 0.9) * 2), y + 7 + j, 1, 1, j % 2 ? c2 : c);
    }

    function draw(t) {
      lastT = t;
      var still = reduce.matches;
      var roadH = 10, riverH = 22;
      var roadTop = H - roadH, horizon = roadTop - riverH, i, y;

      // Sky: banded gradient, dark at the top (where the text sits) and glowing at the horizon
      var n = SKY.length, bh = Math.ceil(horizon / n);
      for (i = 0; i < n; i++) R(0, i * bh, W, bh + 1, SKY[i]);

      // Stars
      for (i = 0; i < 30; i++) {
        if (still || Math.sin(t * 2 + i * 1.7) > -0.4) R(hash(i * 7) % W, hash(i * 13) % Math.max(1, Math.floor(horizon * 0.5)), 1, 1, 'rgba(255,255,255,.8)');
      }

      // Sun with halo and retro stripes
      var sx = Math.round(W * 0.7), sr = 18;
      disc(sx, horizon, sr + 14, 'rgba(255,150,80,.10)', true);
      disc(sx, horizon, sr + 7, 'rgba(255,170,90,.16)', true);
      for (var dy = -sr; dy <= 0; dy++) {
        if (dy > -11 && dy % 3 === 0) continue;
        var hw = Math.round(Math.sqrt(sr * sr - dy * dy)), f = (dy + sr) / sr;
        R(sx - hw, horizon + dy, hw * 2 + 1, 1, 'rgb(255,' + Math.round(243 - 105 * f) + ',' + Math.round(176 - 115 * f) + ')');
      }

      // Kites drift across the sky
      for (i = 0; i < KITES.length; i++) {
        var k = KITES[i], span = W + 30;
        var kx = still ? k.fx * W : ((k.fx * W + t * k.vx) % span) - 15;
        var ky = Math.round(horizon * k.fy + (still ? 0 : Math.sin(t * 0.9 + k.ph) * 3));
        kite(kx, ky, k.c, k.c2, still ? k.ph : t + k.ph);
      }

      // Treeline and palms
      var tree = '#0c1814';
      for (var x = 0; x < W; x++) {
        var th = 2 + (hash(Math.floor(x / 3) * 31) % 5);
        R(x, horizon - th, 1, th, tree);
      }
      palm(Math.round(W * 0.08), horizon, 17, tree);
      palm(Math.round(W * 0.2), horizon, 12, tree);
      palm(Math.round(W * 0.93), horizon, 19, tree);

      // River
      for (i = 0; i < RIVER.length; i++) R(0, horizon + i * Math.ceil(riverH / RIVER.length), W, Math.ceil(riverH / RIVER.length) + 1, RIVER[i]);

      // Country boat (nouka) drifting left
      var bx = Math.round(still ? W * 0.3 : W - ((t * 4 + W * 0.3) % (W + 40)) + 10);
      var by = horizon + 4 + (still ? 0 : Math.round(Math.sin(t * 1.4)));
      var hull = '#1a0f1c';
      R(bx - 1, by + 9, 15, 1, hull); R(bx + 1, by + 10, 11, 1, hull);
      R(bx + 6, by, 1, 9, hull);
      for (i = 0; i < 8; i++) R(bx + 7, by + 1 + i, i + 1, 1, '#ffe2a8');
      R(bx + 1, by + 11, 11, 1, 'rgba(0,0,0,.25)');

      // Sun glitter on the water
      for (y = horizon + 1; y < roadTop; y += 2) {
        var spread = 2 + (y - horizon) * 0.3, fade = 0.7 - (y - horizon) * 0.022;
        for (i = 0; i < 3; i++) {
          var gx = sx + (still ? (i - 1) * spread * 0.7 : Math.sin(t * 1.5 + y * 0.9 + i * 2.1) * spread);
          R(gx, y, 2 + (i % 2), 1, 'rgba(255,214,130,' + fade + ')');
        }
      }

      // Road
      R(0, roadTop, W, roadH, '#161d1a');
      R(0, roadTop, W, 1, '#2b3a33');
      for (x = 0; x < W; x += 14) R(x, roadTop + 5, 7, 1, 'rgba(255,204,51,.7)');

      // Rickshaw crossing the road, with a little dust
      var k2 = 2, sw = rick.width * k2, sh = rick.height * k2;
      var speed = Math.max(16, W / 10);
      var rx = still ? W * 0.36 : ((t * speed) % (W + sw * 2)) - sw;
      var ry = roadTop + 7 - sh - (still ? 0 : Math.floor(t * 8) % 2);
      R(rx + 3, roadTop + 7, sw - 6, 1, 'rgba(0,0,0,.45)');
      ctx.drawImage(rick, Math.round(rx), Math.round(ry), sw, sh);
      if (!still) for (i = 1; i <= 4; i++) R(rx - i * 3, roadTop + 5 - (i % 2), 2, 1, 'rgba(255,255,255,' + (0.4 - i * 0.08) + ')');
    }

    function resize() {
      var r = hero.getBoundingClientRect();
      if (!r.width || !r.height) return;
      P = Math.max(3, Math.round(r.width / 280)); // whole-number pixel size keeps the art crisp
      W = Math.ceil(r.width / P); H = Math.ceil(r.height / P);
      canvas.width = W; canvas.height = H;
      canvas.style.width = W * P + 'px';
      canvas.style.height = H * P + 'px';
      ctx.imageSmoothingEnabled = false;
      draw(lastT);
    }

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (ts - lastFrame < 45) return; // ~22 fps suits the pixel look and saves battery
      lastFrame = ts;
      draw(ts / 1000);
    }
    function start() { if (running || reduce.matches || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener('resize', resize);
    resize();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    onChange(reduce, function () { if (reduce.matches) { stop(); draw(2); } else { start(); } });
    start();
  }
})();
