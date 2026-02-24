/**
 * API configuration for Beat the Bots Daily.
 *
 * In production (Vercel), API calls use relative URLs (/api/...) which
 * Vercel rewrites to the Mac Mini Tailscale Funnel endpoint via vercel.json.
 *
 * In local development, set API_BASE_URL below to point directly to the
 * Mac Mini via Tailscale: http://claws-mac-mini:8100
 */

// Detect local development vs production
const IS_LOCAL = window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1' ||
                 window.location.hostname === '' ||
                 window.location.hostname.endsWith('.ts.net');

// In production, relative /api/* calls are rewritten by Vercel.
// Locally, point directly to Mac Mini on port 8100.
const API_BASE_URL = IS_LOCAL
  ? 'http://claws-mac-mini:8100'
  : '';

/**
 * Fetch a Beat the Bots API endpoint with retry and timeout.
 * Retries up to `retries` times with exponential backoff before throwing.
 * @param {string} path - API path, e.g. '/api/standings/today'
 * @param {object} [opts]
 * @param {number} [opts.retries=2]  - number of retry attempts after first failure
 * @param {number} [opts.timeout=8000] - per-attempt timeout in ms
 * @returns {Promise<any>} Parsed JSON response
 */
async function apiFetch(path, { retries = 2, timeout = 8000 } = {}) {
  const url = API_BASE_URL + path;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(tid);
      if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(tid);
      lastError = err;
    }
  }
  throw lastError;
}
