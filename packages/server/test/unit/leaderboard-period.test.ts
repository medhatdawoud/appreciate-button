import { describe, expect, it } from 'vitest';

import { periodStart } from '../../src/lib/leaderboard-period.js';

const at = (iso: string) => new Date(iso);

describe('periodStart', () => {
  it('starts today at the UTC date', () => {
    expect(periodStart('today', at('2026-09-28T13:45:00Z'))).toBe('2026-09-28');
  });

  it('counts the UTC date, whatever it is elsewhere', () => {
    // Already the 29th east of UTC; still the 28th in UTC.
    expect(periodStart('today', at('2026-09-28T23:59:59Z'))).toBe('2026-09-28');
    expect(periodStart('today', at('2026-09-29T00:00:00Z'))).toBe('2026-09-29');
  });

  it('starts the week on Monday', () => {
    expect(periodStart('week', at('2026-09-28T08:00:00Z'))).toBe('2026-09-28'); // Monday
    expect(periodStart('week', at('2026-10-01T08:00:00Z'))).toBe('2026-09-28'); // Thursday
    expect(periodStart('week', at('2026-10-04T23:00:00Z'))).toBe('2026-09-28'); // Sunday
  });

  it('crosses month and year ends to find the Monday', () => {
    expect(periodStart('week', at('2026-10-02T00:00:00Z'))).toBe('2026-09-28');
    expect(periodStart('week', at('2027-01-01T12:00:00Z'))).toBe('2026-12-28');
  });

  it('starts the month on the 1st', () => {
    expect(periodStart('month', at('2026-09-30T23:00:00Z'))).toBe('2026-09-01');
    expect(periodStart('month', at('2026-10-01T00:00:00Z'))).toBe('2026-10-01');
  });

  it('starts the quarter on 1 January, April, July or October', () => {
    expect(periodStart('quarter', at('2026-02-14T00:00:00Z'))).toBe('2026-01-01');
    expect(periodStart('quarter', at('2026-06-30T23:59:59Z'))).toBe('2026-04-01');
    expect(periodStart('quarter', at('2026-07-01T00:00:00Z'))).toBe('2026-07-01');
    expect(periodStart('quarter', at('2026-12-31T12:00:00Z'))).toBe('2026-10-01');
  });

  it('starts the year on 1 January', () => {
    expect(periodStart('year', at('2026-09-28T00:00:00Z'))).toBe('2026-01-01');
    expect(periodStart('year', at('2027-01-01T00:00:00Z'))).toBe('2027-01-01');
  });

  it('has no start for all time', () => {
    expect(periodStart('all', at('2026-09-28T00:00:00Z'))).toBeNull();
  });
});
