// Shared helpers for Gamers of Bangladesh mini-games.
(function () {
  const PREFIX = 'gob:best:';

  function getBest(game) {
    try { return Number(localStorage.getItem(PREFIX + game)) || 0; } catch (e) { return 0; }
  }

  // Saves score if it beats the stored best. Returns true when it's a new record.
  function saveBest(game, score, lowerIsBetter) {
    const best = getBest(game);
    const better = best === 0 || (lowerIsBetter ? score < best : score > best);
    if (better && score > 0) {
      try { localStorage.setItem(PREFIX + game, String(score)); } catch (e) { /* storage unavailable */ }
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
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    document.querySelectorAll('[data-best]').forEach(function (el) {
      const v = getBest(el.getAttribute('data-best'));
      const unit = el.getAttribute('data-unit') || '';
      el.textContent = v ? v + unit : '—';
    });
  });

  window.GOB = { getBest: getBest, saveBest: saveBest, setupCanvas: setupCanvas, rand: rand };
})();
