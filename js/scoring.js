/*
 * Scoring + leaderboard normalization (source-of-truth for the website).
 *
 * Goals:
 * - Normalize each game to a 0–10 scale.
 * - Compute Avg Pts = total_points / games_played (handle 0 safely).
 * - Provide helpers usable both in-browser and from Node (test harness).
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.BTBScoring = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function clamp(n, lo, hi) {
    if (n == null || Number.isNaN(Number(n))) return null;
    return Math.max(lo, Math.min(hi, Number(n)));
  }

  function safeDiv(num, den) {
    const n = Number(num);
    const d = Number(den);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
    return n / d;
  }

  // --- Game scoring (0–10) -------------------------------------------------

  function wordlePoints(attemptsUsed, solved) {
    if (!solved) return 0;
    const map = { 1: 10, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5 };
    return map[Number(attemptsUsed)] ?? 0;
  }

  function connectionsPoints(mistakesUsed, solved) {
    if (!solved) return 0;
    const map = { 0: 10, 1: 8, 2: 6, 3: 4 };
    return map[Number(mistakesUsed)] ?? 0;
  }

  // Strands/Keyword: backend schema/scoring varies over time.
  // Strategy:
  // - If we have attempts_used + solved (Keyword behaves Wordle-like), use Wordle mapping.
  // - Else if we have a numeric points field, clamp to 0–10; if it looks like legacy 0–7,
  //   scale it up to 0–10.
  function scaledPointsFromLegacy(points) {
    const p = Number(points);
    if (!Number.isFinite(p)) return null;
    if (p <= 7) return clamp(Math.round((p / 7) * 10), 0, 10);
    return clamp(p, 0, 10);
  }

  function strandsPoints(game) {
    if (!game) return null;
    // Common case: solved boolean only
    if (game.solved === true) return 10;
    if (game.solved === false && (game.points == null)) return 0;
    if (game.points != null) return scaledPointsFromLegacy(game.points);
    return null;
  }

  function keywordPoints(game) {
    if (!game) return null;
    if (game.solved === false) return 0;
    if (game.attempts_used != null) return wordlePoints(game.attempts_used, true);
    if (game.points != null) return scaledPointsFromLegacy(game.points);
    if (game.solved === true) return 10;
    return null;
  }

  function normalizeGame(gameKey, game) {
    if (!game) return null;
    const out = { ...game };

    if (gameKey === 'wordle') {
      out.points = wordlePoints(game.attempts_used, !!game.solved);
      return out;
    }

    if (gameKey === 'connections') {
      // Prefer explicit mistakes_used if present; otherwise fall back to legacy points if any.
      if (game.mistakes_used != null) out.points = connectionsPoints(game.mistakes_used, !!game.solved);
      else if (game.points != null) out.points = scaledPointsFromLegacy(game.points);
      else out.points = game.solved ? 10 : 0;
      return out;
    }

    if (gameKey === 'strands') {
      out.points = strandsPoints(game);
      return out;
    }

    if (gameKey === 'keyword') {
      out.points = keywordPoints(game);
      return out;
    }

    // Default: clamp numeric points if present
    if (game.points != null) out.points = clamp(game.points, 0, 10);
    return out;
  }

  function computeGamesPlayedFromGames(gamesObj) {
    if (!gamesObj) return 0;
    return Object.values(gamesObj).filter(Boolean).length;
  }

  function normalizeTodayPayload(data) {
    if (!data || !Array.isArray(data.standings)) return data;

    const standings = data.standings.map(m => {
      const games = m.games || {};
      const normGames = {
        wordle: normalizeGame('wordle', games.wordle),
        connections: normalizeGame('connections', games.connections),
        strands: normalizeGame('strands', games.strands),
        keyword: normalizeGame('keyword', games.keyword)
      };

      const games_played = computeGamesPlayedFromGames(normGames);
      const total_points = Object.values(normGames)
        .filter(Boolean)
        .reduce((sum, g) => sum + (Number(g.points) || 0), 0);

      const avg_points = safeDiv(total_points, games_played);

      return { ...m, games: normGames, games_played, total_points, avg_points };
    });

    // Re-rank by avg_points desc, then total_points desc
    const ranked = [...standings]
      .sort((a, b) => (b.avg_points - a.avg_points) || (b.total_points - a.total_points));

    const rankById = new Map();
    ranked.forEach((m, idx) => rankById.set(m.model_id ?? m.model_name ?? idx, idx + 1));

    const outStandings = standings
      .map(m => ({ ...m, rank: rankById.get(m.model_id ?? m.model_name) ?? m.rank }))
      .sort((a, b) => a.rank - b.rank);

    return { ...data, standings: outStandings };
  }

  function normalizeAggPayload(data) {
    if (!data || !Array.isArray(data.standings)) return data;

    const standings = data.standings.map(m => {
      // Prefer server-provided games_played; otherwise fall back to 4 games/day.
      const games_played = (m.games_played != null)
        ? Number(m.games_played)
        : (m.days_played != null ? Number(m.days_played) * 4 : 0);

      const total_points = Number(m.total_points) || 0;
      const avg_points = safeDiv(total_points, games_played);

      return { ...m, games_played, avg_points };
    });

    // Re-rank by avg_points desc, then total_points desc
    const ranked = [...standings]
      .sort((a, b) => (b.avg_points - a.avg_points) || (b.total_points - a.total_points));

    const rankById = new Map();
    ranked.forEach((m, idx) => rankById.set(m.model_id ?? m.model_name ?? idx, idx + 1));

    const outStandings = standings
      .map(m => ({ ...m, rank: rankById.get(m.model_id ?? m.model_name) ?? m.rank }))
      .sort((a, b) => a.rank - b.rank);

    return { ...data, standings: outStandings };
  }

  return {
    safeDiv,
    wordlePoints,
    connectionsPoints,
    strandsPoints,
    keywordPoints,
    normalizeGame,
    normalizeTodayPayload,
    normalizeAggPayload
  };
});
