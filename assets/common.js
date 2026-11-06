// Shared helpers for Gamers of Bangladesh mini-games.
(function () {
  const PREFIX = 'gob:best:';

  // localStorage can throw (private mode, blocked site data), so every access goes through these.
  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }

  function getBest(game) {
    return Number(load(PREFIX + game)) || 0;
  }

  // Saves score if it beats the stored best. Returns true when it's a new record.
  function saveBest(game, score, lowerIsBetter) {
    const best = getBest(game);
    const better = best === 0 || (lowerIsBetter ? score < best : score > best);
    if (better && score > 0) {
      store(PREFIX + game, String(score));
      return true;
    }
    return false;
  }

  // Sizes a canvas for crisp drawing on high-DPI screens. Logical size stays w x h.
  function setupCanvas(canvas, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  document.addEventListener('DOMContentLoaded', function () {
    // Game pages set <body data-game="..."> so the homepage can offer "Continue playing".
    const game = document.body && document.body.getAttribute('data-game');
    if (game) store('gob:last', game);

    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    document.querySelectorAll('[data-best]').forEach(function (el) {
      const v = getBest(el.getAttribute('data-best'));
      const unit = el.getAttribute('data-unit') || '';
      el.textContent = v ? v + unit : '—';
    });
  });

  window.GOB = { getBest: getBest, saveBest: saveBest, setupCanvas: setupCanvas, rand: rand, load: load, store: store };
})();
