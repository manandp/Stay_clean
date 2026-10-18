/**
 * Day-counter math. Pure functions so they can be tested for DST, timezone
 * travel and clock changes.
 *
 * Convention: the start day is day 0. The counter goes up by one at each local
 * midnight, so "1 day" means one full calendar day has passed.
 */

const MS_PER_DAY = 86_400_000;

/** The calendar date ("YYYY-MM-DD") of an instant in the given IANA time zone. */
export function localDateKey(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Days since the Unix epoch for a "YYYY-MM-DD" calendar date (time-zone free). */
export function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date key: ${dateKey}`);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** Whole calendar days from startDate to the current local date. Never negative. */
export function daysClean(startDate: string, now: Date, timeZone: string): number {
  const diff = dayNumber(localDateKey(now, timeZone)) - dayNumber(startDate);
  return Math.max(0, diff);
}

/** Hours since the streak began, used to show progress during the first day. */
export function hoursClean(startedAt: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 3_600_000));
}

export type RecoveryStage = 'early' | 'building' | 'long';

export function stageFor(days: number): RecoveryStage {
  if (days <= 7) return 'early';
  if (days <= 90) return 'building';
  return 'long';
}

export const MILESTONE_DAYS = [1, 3, 7, 14, 30, 60, 90, 180, 270, 365] as const;

/** Every milestone up to and including `days` (yearly after the first year). */
export function milestonesReached(days: number): number[] {
  const reached: number[] = MILESTONE_DAYS.filter((m) => m <= days);
  for (let y = 2; y * 365 <= days; y++) reached.push(y * 365);
  return reached;
}

export function nextMilestone(days: number): number {
  const fixed = MILESTONE_DAYS.find((m) => m > days);
  if (fixed !== undefined) return fixed;
  return (Math.floor(days / 365) + 1) * 365;
}

/** Progress (0..1) from the previous milestone to the next one. */
export function milestoneProgress(days: number): number {
  const next = nextMilestone(days);
  const prev = milestonesReached(days).at(-1) ?? 0;
  return next === prev ? 1 : (days - prev) / (next - prev);
}

export interface PastStreak {
  startDate: string;
  endDate: string;
}

/** Total clean days across past streaks plus the current one. */
export function totalCleanDays(past: PastStreak[], currentDays: number): number {
  return past.reduce((sum, s) => sum + Math.max(0, dayNumber(s.endDate) - dayNumber(s.startDate)), currentDays);
}

export function longestStreak(past: PastStreak[], currentDays: number): number {
  return past.reduce((max, s) => Math.max(max, dayNumber(s.endDate) - dayNumber(s.startDate)), currentDays);
}
