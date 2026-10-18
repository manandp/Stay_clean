import { describe, expect, it } from 'vitest';
import { ADDICTIONS } from './content/addictions';
import { CRISIS_RESOURCES } from './content/crisis';
import { DAILY_MESSAGES } from './content/dailyMessages';
import { messagesFor, pickDailyMessage } from './dailyMessage';
import { screenForRisk } from './riskScreen';
import { ADDICTION_TYPES } from './schemas';

describe('content', () => {
  it('has content for every addiction type', () => {
    for (const type of ADDICTION_TYPES) {
      const c = ADDICTIONS[type];
      expect(c.type).toBe(type);
      expect(c.nextSteps.length).toBeGreaterThanOrEqual(5);
      expect(c.resources.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('uses https links and dialable numbers only', () => {
    const resources = [...Object.values(ADDICTIONS).flatMap((a) => a.resources), ...CRISIS_RESOURCES.US, ...CRISIS_RESOURCES.INTL];
    for (const r of resources) {
      if (r.url) expect(r.url).toMatch(/^https:\/\//);
      if (r.phone) expect(r.phone).toMatch(/^\d{3,11}$/);
    }
  });

  it('has unique daily message ids', () => {
    const ids = DAILY_MESSAGES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes 988 in US crisis lines', () => {
    expect(CRISIS_RESOURCES.US.some((r) => r.phone === '988')).toBe(true);
  });
});

describe('pickDailyMessage', () => {
  const base = { daysClean: 20, addiction: 'alcohol' as const, salt: 'abc', recentIds: new Set<string>() };

  it('is deterministic per day', () => {
    const a = pickDailyMessage({ ...base, dateKey: '2026-10-18' });
    const b = pickDailyMessage({ ...base, dateKey: '2026-10-18' });
    expect(a.id).toBe(b.id);
  });

  it('only picks messages for the stage and addiction', () => {
    const eligible = messagesFor('alcohol', 20);
    expect(eligible.every((m) => m.addictions.length === 0 || m.addictions.includes('alcohol'))).toBe(true);
    expect(eligible.some((m) => m.id.startsWith('e'))).toBe(false);
  });

  it('avoids recently seen messages while fresh ones remain', () => {
    const eligible = messagesFor('alcohol', 20);
    const recent = new Set(eligible.slice(1).map((m) => m.id));
    const picked = pickDailyMessage({ ...base, dateKey: '2026-10-18', recentIds: recent });
    expect(picked.id).toBe(eligible[0]?.id);
  });
});

describe('screenForRisk', () => {
  it.each([
    ['I want to kill myself tonight', 'imminent'],
    ['I took too many pills and feel weird', 'imminent'],
    ["I'm going to end it all", 'imminent'],
    ['sometimes I wish I was dead', 'elevated'],
    ['I feel hopeless about my debt', 'elevated'],
    ['I could kill for a drink right now', 'none'],
    ['Work was stressful but I made it through', 'none'],
  ])('%s -> %s', (text, expected) => {
    expect(screenForRisk(text)).toBe(expected);
  });
});
