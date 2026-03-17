# Beat the Bots Daily — Web
# CLAUDE.md — Guidance for Claude Code

---

## What This Is

Static HTML website at beatthebotsdaily.com. Public destination for daily AI word game
competition results, leaderboard standings, YouTube episode archive, and AI model profiles.
Also serves as waitlist capture for the upcoming mobile app (Expo, targeting April 2026).

All data comes from a FastAPI server on the Mac Mini via Tailscale. The website is
read-only — it never writes to the Mac Mini. The mobile app is a separate project (not
in this repo).

---

## Architecture Overview

- **Language/runtime:** HTML5 / CSS3 / Vanilla JS — no build step, no framework, no Node dependencies
- **Architecture pattern:** Static site with client-side data loading. All API calls go through `apiFetch()` in `js/config.js` which routes to the Mac Mini API.
- **Philosophy:** Zero build tooling. A file open in the browser IS the deployed artifact. Maximum simplicity.
- **Data storage:** None — all data lives on the Mac Mini. The website fetches and renders.
- **Key external dependencies:** Mac Mini FastAPI (game results, standings, model stats), Vercel (hosting + API proxy), Google Analytics 4, Google Fonts, ConvertKit (waitlist), YouTube (episode embeds)
- **Production routing:** Vercel rewrites `/api/*` → Mac Mini via Tailscale Funnel (`claws-mac-mini.tail9b4f09.ts.net`). Configured in `vercel.json`.

---

## Key Files and Responsibilities

| File | Responsibility |
|------|---------------|
| `css/shared.css` | All CSS variables, typography, nav, grid, design system — single source of truth |
| `js/config.js` | `apiFetch()` wrapper — local dev vs prod routing, retry logic, timeout handling |
| `js/date-utils.js` | Timezone-safe date logic — America/New_York calendar boundaries vs UTC |
| `js/scoring.js` | 0–10 point normalization for all four games, leaderboard ranking |
| `vercel.json` | Vercel rewrites config — maps `/api/*` to Mac Mini Tailscale Funnel in production |
| `scripts/testDateUtils.js` | Unit tests for date-utils.js (run with Node) |
| `scripts/testScoring.js` | Unit tests for scoring.js (run with Node) |
| `index.html` | Home — pitch, model pills, waitlist CTA |
| `standings.html` | Leaderboard — Today / This Week / All Time tabs |
| `today.html` | Daily results cards + YouTube episode embed |
| `episodes.html` | Full YouTube episode archive with game/date filters |
| `models.html` | AI model profiles with stats and records |

---

## Architecture Rules and Constraints

- **All API calls must go through `apiFetch()` in `js/config.js`.** Never use raw `fetch()` with hardcoded URLs. `apiFetch()` handles local dev vs production routing automatically.
- **No build step, no npm, no frameworks.** Do not introduce webpack, Vite, React, or any build tooling. The site must remain deployable by pushing static files to GitHub.
- **All shared styles live in `css/shared.css`.** Never duplicate styles inline across pages. If a style appears on more than one page, it belongs in shared.css.
- **The five model colors are canonical — do not change them:**
  - Claude: `#7BA7D4`, GPT-4o: `#5DB87A`, Gemini: `#5BAFC9`, Grok: `#E06B6B`, Kimi K2.5: `#A98FD4`
- **Scoring normalization (0–10 scale) is defined in `js/scoring.js`.** Do not modify the formula without running `node scripts/testScoring.js` first and updating all callers.
- **JS utility modules (`js/`) must remain UMD-compatible** — they are tested in Node via the `scripts/test*.js` harnesses. Do not use ES module `import`/`export` syntax.
- Typography stack is fixed: Playfair Display (headlines), Courier Prime (labels/UI), EB Garamond (body). Never substitute system fonts.

---

## Security Rules

- `.env` contains only the local dev API base URL (`API_BASE_URL=http://claws-mac-mini:8100`) — git-ignored, never commit it.
- The website is read-only. No mutations reach the Mac Mini API. The only POST is the ConvertKit waitlist form, which goes directly to ConvertKit.
- Never add API keys to client-side JS — all credentials are server-side (Mac Mini or Vercel env vars).

---

## Development Commands

- **Local dev:** Open HTML files directly in browser — no server required for static content.
- **With live API data:** Requires Tailscale connection to Mac Mini. `API_BASE_URL` in `.env` points to `http://claws-mac-mini:8100`.
- **Run date utils tests:** `node scripts/testDateUtils.js`
- **Run scoring tests:** `node scripts/testScoring.js`
- **Deploy:** `git push origin main` — Vercel auto-deploys from main branch.

---

## Testing Standards

- Tests in: `scripts/testDateUtils.js`, `scripts/testScoring.js`
- Run manually with Node before any change to `js/date-utils.js` or `js/scoring.js`.
- No CI pipeline — tests are not automated. Do not skip them before pushing scoring or date logic changes.
- Rule: No task touching `js/scoring.js` or `js/date-utils.js` is complete until both test files pass.

---

## Code Style

- No ES module syntax (`import`/`export`) in `js/` files — UMD pattern required for Node test compatibility.
- CSS: always use variables from `css/shared.css` (`--bg`, `--gold`, `--cream`, etc.) — never hardcode color hex values in page files.
- Design motif: corner brackets (CSS pseudo-elements), gold gradient rules, dark warm aesthetic (`#160C08` bg, `#C9A052` accent). Do not break from this aesthetic.

---

## Current Phase / Active Work

Production live at beatthebotsdaily.com. All five main pages wired to live Mac Mini API.
Focus is stability and content freshness. Upcoming: mobile app (Expo) targeting April 2026 —
website serves as public companion destination. Do not begin app features in this repo.

---

## Known Issues / Decisions

- [2026-03] `today.html` shows **yesterday's** results (24-hour spoiler embargo) — this is intentional. `js/date-utils.js` implements the America/New_York timezone-safe yesterday calculation.
- [2026-03] Scoring: 0–10 normalized per game. Wordle: 1 guess=10pts → 6 guesses=5pts, fail=0. Full formula in `js/scoring.js`. Legacy 0–7 Strands/Keyword scores scaled to 0–10.
- [2026-03] `apiFetch()` uses 2 retries with exponential backoff and 8-second timeout per attempt. Adjust in `js/config.js` if API latency changes.
- [2026-03] Previous CLAUDE.md (Feb 2026) was a pre-standard project briefing. Superseded by this restructured version aligned to the CIO reference guide.
