import { describe, expect, it } from 'vitest';
import {
  daysClean,
  hoursClean,
  localDateKey,
  longestStreak,
  milestoneProgress,
  milestonesReached,
  nextMilestone,
  stageFor,
  totalCleanDays,
} from './streak';

const NY = 'America/New_York';

describe('daysClean', () => {
  it.each([
    ['start today', '2026-10-18', '2026-10-18T23:59:00-04:00', NY, 0],
    ['one midnight later', '2026-10-18', '2026-10-19T00:00:30-04:00', NY, 1],
    ['across spring DST', '2026-03-07', '2026-03-09T12:00:00-04:00', NY, 2],
    ['across fall DST', '2026-10-31', '2026-11-02T00:30:00-05:00', NY, 2],
    ['leap day', '2028-02-28', '2028-03-01T09:00:00-05:00', NY, 2],
    ['a full year', '2025-10-18', '2026-10-18T08:00:00-04:00', NY, 365],
    ['clock set before start', '2026-10-18', '2026-10-10T08:00:00-04:00', NY, 0],
  ])('%s', (_name, start, now, tz, expected) => {
    expect(daysClean(start, new Date(now), tz)).toBe(expected);
  });

  it('uses the current time zone after travel', () => {
    // 2026-10-19 03:00 UTC is still Oct 18 in Los Angeles but Oct 19 in London.
    const now = new Date('2026-10-19T03:00:00Z');
    expect(daysClean('2026-10-18', now, 'America/Los_Angeles')).toBe(0);
    expect(daysClean('2026-10-18', now, 'Europe/London')).toBe(1);
  });
});

describe('localDateKey', () => {
  it('formats in the given zone', () => {
    expect(localDateKey(new Date('2026-01-01T02:00:00Z'), 'Asia/Tokyo')).toBe('2026-01-01');
    expect(localDateKey(new Date('2026-01-01T02:00:00Z'), NY)).toBe('2025-12-31');
  });
});

describe('hoursClean', () => {
  it('never goes negative', () => {
    expect(hoursClean(new Date('2026-10-18T10:00:00Z'), new Date('2026-10-18T09:00:00Z'))).toBe(0);
    expect(hoursClean(new Date('2026-10-18T10:00:00Z'), new Date('2026-10-18T15:30:00Z'))).toBe(5);
  });
});

describe('milestones', () => {
  it('lists reached milestones including yearly ones', () => {
    expect(milestonesReached(0)).toEqual([]);
    expect(milestonesReached(30)).toEqual([1, 3, 7, 14, 30]);
    expect(milestonesReached(731)).toContain(730);
  });

  it('finds the next milestone', () => {
    expect(nextMilestone(0)).toBe(1);
    expect(nextMilestone(47)).toBe(60);
    expect(nextMilestone(365)).toBe(730);
  });

  it('computes progress between milestones', () => {
    expect(milestoneProgress(45)).toBeCloseTo(0.5);
  });
});

describe('stages and history', () => {
  it('maps days to stages', () => {
    expect(stageFor(0)).toBe('early');
    expect(stageFor(8)).toBe('building');
    expect(stageFor(91)).toBe('long');
  });

  it('totals past and current streaks', () => {
    const past = [{ startDate: '2026-01-01', endDate: '2026-01-31' }];
    expect(totalCleanDays(past, 10)).toBe(40);
    expect(longestStreak(past, 10)).toBe(30);
    expect(longestStreak(past, 45)).toBe(45);
  });
});
