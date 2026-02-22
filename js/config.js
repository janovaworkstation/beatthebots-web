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
                 window.location.hostname === '';

// In production, relative /api/* calls are rewritten by Vercel.
// Locally, point directly to Mac Mini on port 8100.
const API_BASE_URL = IS_LOCAL
  ? 'http://claws-mac-mini:8100'
  : '';

/**
 * Fetch a Beat the Bots API endpoint.
 * @param {string} path - API path, e.g. '/api/standings/today'
 * @returns {Promise<any>} Parsed JSON response
 */
async function apiFetch(path) {
  const url = API_BASE_URL + path;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json();
}
