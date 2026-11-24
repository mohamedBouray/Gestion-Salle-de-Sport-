import test from 'node:test';
import assert from "node:assert/strict";
import { gymDateKey, gymLocalDateTime, gymInstant, addCalendarDays } from '../src/utils/gymDates.js';
test('Moroccan date and local time are independent of device timezone', () => {
  assert.equal(gymLocalDateTime('2026-11-24T14:00:00Z'), '2026-11-24T14:00');
  assert.equal(gymDateKey('2026-11-24T23:30:00Z'), '2026-11-24');
  assert.equal(gymInstant('2026-11-24T15:00').toISOString(), '2026-11-24T15:00:00.000Z');
});
test('Ramadan and daylight transition use actual Morocco offsets', () => {
  assert.equal(gymInstant('2026-03-01T15:00').toISOString(), '2026-03-01T15:00:00.000Z');
  assert.equal(gymInstant('2026-03-22T15:00').toISOString(), '2026-03-22T14:00:00.000Z');
  assert.ok(Number.isNaN(gymInstant('2026-03-22T02:30').getTime()));
  assert.ok(Number.isNaN(gymInstant('2026-02-15T02:30').getTime()));
});
test('calendar day arithmetic crosses month and year without time shifts', () => {
  assert.equal(gymDateKey(addCalendarDays('2026-12-31', 1)), '2027-01-01');
  assert.equal(gymDateKey(addCalendarDays('2026-03-22', -1)), '2026-03-21');
});
test('invalid dates do not silently normalize', () => {
  assert.ok(Number.isNaN(gymInstant('2026-02-30T15:00').getTime()));
  assert.ok(Number.isNaN(gymInstant('bad').getTime()));
});
