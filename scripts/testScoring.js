#!/usr/bin/env node
/*
 * Minimal acceptance harness for normalized 0–10 scoring.
 * Run: node scripts/testScoring.js
 */

const assert = require('assert/strict');
const {
  wordlePoints,
  connectionsPoints,
  normalizeTodayPayload,
  safeDiv,
} = require('../js/scoring.js');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

test('Wordle attempts → points (1..6, fail)', () => {
  assert.equal(wordlePoints(1, true), 10);
  assert.equal(wordlePoints(2, true), 9);
  assert.equal(wordlePoints(3, true), 8);
  assert.equal(wordlePoints(4, true), 7);
  assert.equal(wordlePoints(5, true), 6);
  assert.equal(wordlePoints(6, true), 5);
  assert.equal(wordlePoints(7, true), 0);
  assert.equal(wordlePoints(3, false), 0);
});

test('Connections mistakes → points (0..3, fail)', () => {
  assert.equal(connectionsPoints(0, true), 10);
  assert.equal(connectionsPoints(1, true), 8);
  assert.equal(connectionsPoints(2, true), 6);
  assert.equal(connectionsPoints(3, true), 4);
  assert.equal(connectionsPoints(4, true), 0);
  assert.equal(connectionsPoints(0, false), 0);
});

test('Avg Pts = total_points / games_played (0-safe)', () => {
  assert.equal(safeDiv(10, 4), 2.5);
  assert.equal(safeDiv(10, 0), 0);
});

test('normalizeTodayPayload recomputes totals + avg + rank', () => {
  const payload = {
    date: '2026-02-26',
    standings: [
      {
        model_id: 1,
        model_name: 'A',
        provider: 'X',
        accent_color: '#fff',
        rank: 2,
        total_points: 999, // should be ignored
        games: {
          wordle: { solved: true, attempts_used: 2 },       // 9
          connections: { solved: true, mistakes_used: 0 },  // 10
          strands: { solved: true },                        // 10
          keyword: { solved: false }                        // 0
        }
      },
      {
        model_id: 2,
        model_name: 'B',
        provider: 'X',
        accent_color: '#000',
        rank: 1,
        games: {
          wordle: { solved: true, attempts_used: 6 },       // 5
          connections: { solved: true, mistakes_used: 3 },  // 4
          strands: { solved: true },                        // 10
          keyword: { solved: true, attempts_used: 1 }       // 10
        }
      }
    ]
  };

  const out = normalizeTodayPayload(payload);
  const a = out.standings.find(s => s.model_id === 1);
  const b = out.standings.find(s => s.model_id === 2);

  assert.equal(a.total_points, 29);
  assert.equal(a.games_played, 4);
  assert.equal(a.avg_points, 7.25);

  assert.equal(b.total_points, 29);
  assert.equal(b.avg_points, 7.25);

  // Tie → stable secondary; at minimum ranks are valid integers.
  assert.ok([1, 2].includes(a.rank));
  assert.ok([1, 2].includes(b.rank));
});

if (!process.exitCode) {
  console.log('\nAll scoring tests passed.');
}
