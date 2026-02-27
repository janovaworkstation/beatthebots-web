/*
 * Date utilities for Beat the Bots Daily.
 *
 * Problem: "yesterday" depends on a timezone. If the API endpoint uses UTC
 * boundaries while the website labels results in America/New_York, the page can
 * show the wrong day around midnight.
 *
 * Solution: compute the desired game date (YYYY-MM-DD) in the target timezone
 * on the client and request /api/results/YYYY-MM-DD.
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.BTBDateUtils = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function isoFromYMD(y, m, d) {
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  /**
   * Format the given Date as YYYY-MM-DD in a specific IANA timezone.
   */
  function isoDateInTimeZone(date, timeZone) {
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const parts = dtf.formatToParts(date);
    const get = (type) => parts.find(p => p.type === type)?.value;
    const y = get('year');
    const m = get('month');
    const d = get('day');
    if (!y || !m || !d) throw new Error('Failed to format date parts');
    return `${y}-${m}-${d}`;
  }

  /**
   * Add days to an ISO date string (YYYY-MM-DD), interpreted in UTC.
   */
  function addDaysISO(iso, days) {
    const [y, m, d] = String(iso).split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + Number(days));
    return isoFromYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }

  /**
   * Get "yesterday" (YYYY-MM-DD) relative to `now`, using the given timezone's
   * calendar day boundaries.
   */
  function yesterdayISOInTimeZone(now, timeZone) {
    const todayISO = isoDateInTimeZone(now ?? new Date(), timeZone);
    return addDaysISO(todayISO, -1);
  }

  return {
    isoDateInTimeZone,
    addDaysISO,
    yesterdayISOInTimeZone
  };
});
