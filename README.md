# beatthebots-web

Static HTML/CSS/JS website for [beatthebotsdaily.com](https://www.beatthebotsdaily.com), deployed on Vercel.

---

## GA4 Analytics Reporting

`scripts/ga4-report.js` — queries the GA4 Data API and prints daily active users, top traffic sources, and most visited pages for the last 7 days.

### Prerequisites

- Node.js 18+ (uses built-in `fetch`)
- `googleapis` npm package available at `/Users/jlusenhop/node_modules` (or install globally: `npm install -g googleapis`)
- Service account key file with Viewer access to GA4 property G-N78X6Z2MJR
  - Default key path: `/Users/jlusenhop/JanovaAI/product_lines/ai-wordgames/pipeline-490616-b662a94ce4e0.json`
- Numeric GA4 Property ID — find it in GA4 Admin → Property Settings → Property ID
  - This is a plain number (e.g. `123456789`), **not** the `G-XXXXXXXX` measurement ID

### Usage

```bash
# Set the numeric property ID
export GA4_PROPERTY_ID=<your-numeric-property-id>

# Optional: override the default key file path
export GA4_KEY_FILE=/path/to/service-account-key.json

# Run
node scripts/ga4-report.js

# Or pass the property ID as an argument
node scripts/ga4-report.js 123456789
```

### Output

Prints to stdout:
- Daily Active Users (last 7 days, per-day breakdown)
- Top 5 traffic sources (source / medium / sessions)
- Top 5 most visited pages (page path / views)
