# Beat the Bots Daily — Web Project Briefing

This file is read by Claude Code at the start of every session. It contains everything needed to work on this project without re-explaining context.

---

## What This Is

**Beat the Bots Daily** is a YouTube channel and upcoming mobile app where five frontier AI models compete daily in word games: Wordle, Connections, Strands, and Keyword. A fully automated Python pipeline runs the games every night at midnight and stores results in a database on the Mac Mini.

This repo is the **public website** at beatthebotsdaily.com. It serves as:
- A landing page and waitlist capture for the app (launching April 2026)
- A daily-return destination for visitors who want to check standings and results
- A hub for the YouTube episode archive
- A showcase of each AI model's stats and personality

The app is a separate project (Expo / React Native, not in this repo).

---

## The Five AI Models

| Model | Provider | Color | Personality |
|-------|----------|-------|-------------|
| Claude | Anthropic | `#7BA7D4` | Methodical, thoughtful |
| GPT-4o | OpenAI | `#5DB87A` | Confident, direct |
| Gemini | Google | `#5BAFC9` | Analytical, broad |
| Grok | xAI | `#E06B6B` | Edgy, unpredictable |
| Kimi K2.5 | Moonshot AI | `#A98FD4` | The wildcard challenger |

---

## Site Structure

Five pages, all sharing the same nav and footer:

| File | URL | Purpose | Returns daily? |
|------|-----|---------|----------------|
| `index.html` | `/` | Home — pitch, waitlist, site explainer | No |
| `standings.html` | `/standings` | Full leaderboard — Today / This Week / All Time | Yes — bookmark page |
| `today.html` | `/today` | Today's game results + today's episode embed | Yes |
| `episodes.html` | `/episodes` | Full YouTube episode archive with game filter | Weekly |
| `models.html` | `/models` | AI model profiles with stats and records | Occasionally |

---

## Design System

### Color Palette (CSS Variables)
```css
--bg:          #160C08   /* very dark warm brown — page background */
--bg-card:     #1E1109   /* slightly lighter — card backgrounds */
--bg-elevated: #261510   /* elevated elements, row hovers */
--gold:        #C9A052   /* primary accent — headlines, CTAs, active states */
--gold-light:  #E8C47A   /* hover state for gold elements */
--gold-dim:    #7A5E28   /* muted gold — borders, decorative */
--cream:       #F2E8D5   /* primary text */
--cream-dim:   #B8A98A   /* secondary text, descriptions */
--muted:       #5C4835   /* tertiary text, borders, labels */
```

### Typography
- **Headlines:** Playfair Display (serif, Google Fonts) — weights 700 and 900
- **Labels / UI:** Courier Prime (monospace, Google Fonts) — all caps, wide letter-spacing
- **Body:** EB Garamond (serif, Google Fonts)

### Design Motifs
- Thin **corner bracket** decorations on cards (CSS pseudo-elements)
- **Gold gradient rules** as section dividers
- Alternating **dark / raised** section bands to create visual separation
- Model identity always shown as a **colored dot** + name

### Key Rule
Never use Inter, Roboto, Arial, or system fonts. Never use purple gradients on white backgrounds. The aesthetic is warm, cinematic, editorial — like a premium sports broadcast crossed with a literary magazine.

---

## Shared Styles

All shared CSS lives inline in each HTML file for now, duplicated from `/tmp/shared_styles.css` during scaffolding. 

**First refactor task:** extract shared styles to `/css/shared.css` and link it from all five pages. This will make future changes much easier — one file to update instead of five.

---

## Navigation

The nav is identical on all five pages. The active page gets `class="active"` on its nav link, which applies a gold bottom border. The nav CTA always links to `index.html#waitlist`.

```html
<nav>
  <a href="index.html" class="nav-logo">Beat <span>the Bots</span> Daily</a>
  <ul class="nav-links">
    <li><a href="standings.html">Standings</a></li>
    <li><a href="today.html">Today</a></li>
    <li><a href="episodes.html">Episodes</a></li>
    <li><a href="models.html">Models</a></li>
  </ul>
  <a href="index.html#waitlist" class="nav-cta">Join Waitlist</a>
  <button class="nav-hamburger" onclick="document.querySelector('.nav-links').classList.toggle('open')">☰</button>
</nav>
```

---

## Data — What's Real vs Mock

**Currently all data is hardcoded mock data.** The real data lives in a database on the Mac Mini and needs to be wired in via API.

### Scoring System
- **Daily points:** `7 - attempts_used` for solved games; `0` for failed games
- **All-time:** weighted average (lower raw score = better performance; failed games receive maximum penalty)
- Ties remain ties — no tiebreakers

### The Mac Mini API
The Mac Mini runs the automated Python game pipeline and hosts the database. A lightweight **FastAPI** server needs to be built on the Mac Mini to expose read-only endpoints for the website.

**Network setup:**
- Mac Mini and MacBook Pro are both on a **Tailscale** private network
- During local development on MacBook Pro: API calls go directly to Mac Mini via Tailscale IP
- In production (Vercel): API calls go to Mac Mini via **Tailscale Funnel** (public HTTPS endpoint, no open router ports)

### API Endpoints Needed (to be built)
```
GET /api/standings/today        → all 5 models, all 4 games, today's points
GET /api/standings/week         → 7-day aggregate per model
GET /api/standings/alltime      → all-time averages per model
GET /api/results/today          → per-game results for today
GET /api/results/{date}         → per-game results for a specific date
GET /api/models                 → model metadata and all-time stats
GET /api/models/{model_id}      → single model profile with full history
```

---

## Infrastructure

| Layer | Tool | Status |
|-------|------|--------|
| Game pipeline | Python (Mac Mini) | Live |
| Database | Mac Mini | Live |
| API server | FastAPI (Mac Mini) | To be built |
| Tailscale tunnel | Tailscale Funnel | To be configured |
| Website hosting | Vercel | To be connected |
| Domain | beatthebotsdaily.com | Owned, to be pointed at Vercel |
| Repo | GitHub | To be created |

---

## Deployment Workflow

```
MacBook Pro (edit files)
       ↓  git push
   GitHub repo
       ↓  auto-deploy (Vercel webhook)
     Vercel
       ↓  API calls
Mac Mini via Tailscale Funnel
```

---

## Current Priority Order

1. **Extract shared CSS** into `/css/shared.css` — makes everything easier
2. **Build the FastAPI layer** on Mac Mini with the endpoints listed above
3. **Configure Tailscale Funnel** on the API port
4. **Wire standings.html** to real data first — highest daily value
5. **Wire today.html** to real data second
6. Wire remaining pages
7. **Waitlist form** — connect to an actual email capture (Mailchimp, ConvertKit, or similar)
8. **YouTube embeds** — replace placeholder thumbs with real iframes on today.html and episodes.html

---

## What Not to Change

- The color palette — it matches the YouTube channel branding exactly
- The typography stack (Playfair Display / Courier Prime / EB Garamond)
- The corner bracket motif on cards
- The overall dark warm aesthetic

---

## App vs Website

The mobile app is a separate project (Expo / React Native, not in this repo). The website and app share the same Mac Mini database but are otherwise independent. The website does not need to replicate app features — it is a daily-return content destination and a waitlist capture tool.

---

*Last updated: February 2026*
