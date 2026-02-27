#!/usr/bin/env node
/*
 * Minimal test harness for timezone-safe "yesterday" calculations.
 * Run: node scripts/testDateUtils.js
 */

const assert = require('assert/strict');
const {
  isoDateInTimeZone,
  addDaysISO,
  yesterdayISOInTimeZone
} = require('../js/date-utils.js');

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

test('addDaysISO subtracts a day across month boundaries', () => {
  assert.equal(addDaysISO('2026-03-01', -1), '2026-02-28');
  assert.equal(addDaysISO('2026-01-01', -1), '2025-12-31');
});

test('isoDateInTimeZone respects America/New_York calendar day', () => {
  // 2026-02-26T00:30:00Z is 2026-02-25 19:30 in New York (EST)
  const d = new Date('2026-02-26T00:30:00Z');
  assert.equal(isoDateInTimeZone(d, 'America/New_York'), '2026-02-25');
});

test('yesterdayISOInTimeZone returns correct day in America/New_York near UTC midnight', () => {
  // Same instant as above: "today" in NY is 2026-02-25, so yesterday is 2026-02-24.
  const now = new Date('2026-02-26T00:30:00Z');
  assert.equal(yesterdayISOInTimeZone(now, 'America/New_York'), '2026-02-24');
});

if (!process.exitCode) {
  console.log('\nAll date utils tests passed.');
}
