import { DAILY_MESSAGES, type DailyMessage } from './content/dailyMessages';
import type { AddictionType } from './schemas';
import { stageFor } from './streak';

/** Small, stable string hash (FNV-1a) so the same day always picks the same message. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface PickOptions {
  dateKey: string;
  daysClean: number;
  addiction: AddictionType;
  /** Ids shown recently (the app keeps the last 60 days). */
  recentIds: ReadonlySet<string>;
  /** Per-install salt so different people see different messages on the same day. */
  salt: string;
  messages?: DailyMessage[];
}

export function messagesFor(addiction: AddictionType, daysClean: number, messages = DAILY_MESSAGES): DailyMessage[] {
  const stage = stageFor(daysClean);
  return messages.filter(
    (m) =>
      (m.stages.length === 0 || m.stages.includes(stage)) &&
      (m.addictions.length === 0 || m.addictions.includes(addiction)),
  );
}

/** Deterministic per day; avoids recent repeats while fresh messages remain. */
export function pickDailyMessage(opts: PickOptions): DailyMessage {
  const all = opts.messages ?? DAILY_MESSAGES;
  const eligible = messagesFor(opts.addiction, opts.daysClean, all);
  const fresh = eligible.filter((m) => !opts.recentIds.has(m.id));
  const pool = fresh.length > 0 ? fresh : eligible.length > 0 ? eligible : all;
  const index = hashString(`${opts.salt}:${opts.dateKey}`) % pool.length;
  const picked = pool[index];
  if (!picked) throw new Error('No daily messages available');
  return picked;
}

export function milestoneMessage(days: number): string {
  if (days === 1) return 'One full day. The first one is the hardest, and you did it.';
  if (days === 3) return 'Three days. Your body is already starting to thank you.';
  if (days === 7) return 'One week! Seven days of choosing yourself.';
  if (days === 14) return 'Two weeks. New habits are taking root.';
  if (days === 30) return 'One month. That is a real milestone. Be proud.';
  if (days === 60) return 'Two months of recovery. You are building something lasting.';
  if (days === 90) return 'Ninety days. Many people call this a turning point, and you reached it.';
  if (days === 180) return 'Six months. Half a year of courage, one day at a time.';
  if (days === 270) return 'Nine months. Look at the life you are growing.';
  if (days % 365 === 0) {
    const years = days / 365;
    return years === 1 ? 'One year. Take a moment to honor how far you have come.' : `${years} years. What a journey. Thank you for staying.`;
  }
  return `${days} days. Keep going.`;
}
