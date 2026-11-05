# Gamers of Bangladesh

Static website (plain HTML/CSS/JS, no build step) with browser mini-games.

## Hosting / deploy
- GitHub: `newronfaysal/gamersofbangladesh`, branch `main`.
- Cloudflare **Worker** `gamersofbangladesh` (Workers Builds) is linked to the repo: every push to `main` auto-deploys. No wrangler command needed.
- Live at https://www.gamersofbangladesh.com. The apex `gamersofbangladesh.com` must also be attached as a custom domain on the Worker (Domains tab).
- An older, unused Cloudflare Pages project `gamersofbangladesh` (gamersofbangladesh.pages.dev) also exists from a manual upload; it does not update on push.

## Structure
- `index.html` — hub page listing the games (has an "under maintenance" notice).
- `assets/style.css` — shared theme (dark, Bangladesh green/red, Press Start 2P + Inter).
- `assets/common.js` — `window.GOB` helpers: best scores in localStorage (`gob:best:<game>`), hi-DPI canvas setup.
- `games/<name>/index.html` — one self-contained page per game: rickshaw-rush, mango-mania, sundarbans-tap, desh-memory.
- Use relative paths (`../../assets/...`) so pages work at any host.

## Conventions
- Games must be original (genre mechanics OK, no clones of named games), mobile-first with touch controls, and keep keyboard support.
- Adding a game: create `games/<slug>/index.html` from an existing game page, add a card in `index.html` with `data-best="<key>"`.
- Test locally: `python3 -m http.server 8765` then open http://127.0.0.1:8765/.
