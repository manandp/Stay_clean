import {
  AddictionTypeSchema,
  DrugSubstanceSchema,
  LocalDateSchema,
  type AddictionType,
  type DrugSubstance,
  type PastStreak,
} from '@stay-clean/shared';
import { z } from 'zod';

/**
 * Browser demo storage. Same API as db.ts, but kept in this browser's
 * localStorage, unencrypted. The web build is a demo only; the phone apps
 * use the SQLCipher database in db.ts.
 */

const STORE_KEY = 'stayclean.demo.v1';

export const ProfileSchema = z.object({
  addiction: AddictionTypeSchema,
  substance: DrugSubstanceSchema.nullable(),
  otherLabel: z.string().nullable(),
  /** 'preparing' = not started yet; the counter starts when they tap "I'm starting today". */
  status: z.enum(['preparing', 'active']),
  startDate: LocalDateSchema.nullable(),
  startedAt: z.string().nullable(),
  aiConsent: z.boolean(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export interface JournalEntry {
  id: number;
  createdAt: string;
  kind: 'text' | 'voice';
  body: string;
  mood: number | null;
  coachReply: string | null;
  personalize: boolean;
}

interface Store {
  profile: Profile | null;
  streaks: { startDate: string; endDate: string; note: string | null }[];
  entries: JournalEntry[];
  nextId: number;
  dailySeen: Record<string, string>;
  toughDays: string[];
  settings: Record<string, string>;
}

const empty = (): Store => ({ profile: null, streaks: [], entries: [], nextId: 1, dailySeen: {}, toughDays: [], settings: {} });

let memory: Store | null = null;

function load(): Store {
  if (memory) return memory;
  try {
    const raw = globalThis.localStorage?.getItem(STORE_KEY);
    memory = raw ? { ...empty(), ...(JSON.parse(raw) as Partial<Store>) } : empty();
  } catch {
    memory = empty();
  }
  return memory;
}

function save(): void {
  try {
    globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(memory));
  } catch {
    // Private mode or storage blocked: keep working in memory.
  }
}

export async function wipeEverything(): Promise<void> {
  memory = empty();
  try {
    globalThis.localStorage?.removeItem(STORE_KEY);
  } catch {
    // Nothing stored.
  }
}

// ---------- Profile ----------

export async function getProfile(): Promise<Profile | null> {
  const p = load().profile;
  return p ? ProfileSchema.parse(p) : null;
}

export async function saveProfile(p: Profile): Promise<void> {
  load().profile = ProfileSchema.parse(p);
  save();
}

// ---------- Streak history ----------

export async function addPastStreak(streak: PastStreak, note: string | null): Promise<void> {
  load().streaks.push({ startDate: streak.startDate, endDate: streak.endDate, note });
  save();
}

export async function getPastStreaks(): Promise<PastStreak[]> {
  return load().streaks.map((s) => ({ startDate: s.startDate, endDate: s.endDate }));
}

// ---------- Journal ----------

const newestFirst = (a: JournalEntry, b: JournalEntry) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id - a.id);

export async function addEntry(e: Pick<JournalEntry, 'kind' | 'body' | 'mood'>): Promise<number> {
  const s = load();
  const id = s.nextId++;
  s.entries.push({ id, createdAt: new Date().toISOString(), kind: e.kind, body: e.body, mood: e.mood, coachReply: null, personalize: true });
  save();
  return id;
}

function update(id: number, change: Partial<JournalEntry>): void {
  const s = load();
  s.entries = s.entries.map((e) => (e.id === id ? { ...e, ...change } : e));
  save();
}

export async function setCoachReply(id: number, reply: string): Promise<void> {
  update(id, { coachReply: reply });
}

export async function setPersonalize(id: number, personalize: boolean): Promise<void> {
  update(id, { personalize });
}

export async function deleteEntry(id: number): Promise<void> {
  const s = load();
  s.entries = s.entries.filter((e) => e.id !== id);
  save();
}

export async function getEntry(id: number): Promise<JournalEntry | null> {
  return load().entries.find((e) => e.id === id) ?? null;
}

export async function listEntries(limit = 200): Promise<JournalEntry[]> {
  return [...load().entries].sort(newestFirst).slice(0, limit);
}

export async function personalizationEntries(limit = 20): Promise<JournalEntry[]> {
  return [...load().entries].filter((e) => e.personalize).sort(newestFirst).slice(0, limit);
}

// ---------- Daily messages, tough days, settings ----------

export async function recordDailySeen(date: string, messageId: string): Promise<void> {
  const s = load();
  s.dailySeen[date] ??= messageId;
  save();
}

export async function recentDailyIds(sinceDate: string, today: string): Promise<Set<string>> {
  return new Set(
    Object.entries(load().dailySeen)
      .filter(([date]) => date >= sinceDate && date !== today)
      .map(([, id]) => id),
  );
}

export async function recordToughDay(date: string): Promise<void> {
  load().toughDays.push(date);
  save();
}

export async function toughDayCount(): Promise<number> {
  return load().toughDays.length;
}

export async function getSetting(key: string): Promise<string | null> {
  return load().settings[key] ?? null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  const s = load();
  if (value === null) delete s.settings[key];
  else s.settings[key] = value;
  save();
}

export async function exportAll(): Promise<Record<string, unknown>> {
  const s = load();
  return {
    exportedAt: new Date().toISOString(),
    profile: s.profile,
    pastStreaks: s.streaks,
    journal: await listEntries(100_000),
    toughDays: s.toughDays,
    settings: s.settings,
  };
}

export type { AddictionType, DrugSubstance };
