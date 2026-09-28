import type { LeaderboardPeriod } from '@appreciate-button/shared';

/** Every period the leaderboard can rank by; `all` is every click ever. */
export const LEADERBOARD_PERIODS: readonly LeaderboardPeriod[] = [
  'today',
  'week',
  'month',
  'quarter',
  'year',
  'all',
];

/** What the leaderboard ranks by when no period is asked for. */
export const DEFAULT_LEADERBOARD_PERIOD: LeaderboardPeriod = 'week';

/**
 * The first UTC day (`YYYY-MM-DD`) of the period `now` falls in, or null for
 * `all`. Weeks start on Monday; quarters on 1 January, April, July and
 * October. Worked out here rather than in SQL so the answer does not depend
 * on the database's time zone.
 */
export function periodStart(period: LeaderboardPeriod, now: Date): string | null {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const date = now.getUTCDate();
  let start: Date;
  switch (period) {
    case 'all':
      return null;
    case 'today':
      start = new Date(Date.UTC(year, month, date));
      break;
    case 'week':
      // getUTCDay is 0 for Sunday; Monday is 0 days back, Sunday 6.
      start = new Date(Date.UTC(year, month, date - ((now.getUTCDay() + 6) % 7)));
      break;
    case 'month':
      start = new Date(Date.UTC(year, month, 1));
      break;
    case 'quarter':
      start = new Date(Date.UTC(year, month - (month % 3), 1));
      break;
    case 'year':
      start = new Date(Date.UTC(year, 0, 1));
      break;
  }
  return start.toISOString().slice(0, 10);
}
