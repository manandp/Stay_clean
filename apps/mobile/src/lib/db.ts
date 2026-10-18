import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
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
 * All personal data lives in one SQLCipher-encrypted database on the phone.
 * The 256-bit key is generated on first launch and kept in the Keychain /
 * Android Keystore, available only while the device is unlocked and never
 * synced or backed up.
 */

const DB_NAME = 'stayclean.db';
const KEY_NAME = 'stayclean.dbkey.v1';

async function getOrCreateKey(): Promise<string> {
  const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
  const existing = await SecureStore.getItemAsync(KEY_NAME, options);
  if (existing && /^[0-9a-f]{64}$/.test(existing)) return existing;
  const bytes = await Crypto.getRandomBytesAsync(32);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(KEY_NAME, hex, options);
  return hex;
}

const MIGRATIONS: string[] = [
  `CREATE TABLE profile (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     addiction TEXT NOT NULL,
     substance TEXT,
     other_label TEXT,
     status TEXT NOT NULL,
     start_date TEXT,
     started_at TEXT,
     ai_consent INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL
   );
   CREATE TABLE streak_history (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     start_date TEXT NOT NULL,
     end_date TEXT NOT NULL,
     note TEXT
   );
   CREATE TABLE journal_entries (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     created_at TEXT NOT NULL,
     kind TEXT NOT NULL,
     body TEXT NOT NULL,
     mood INTEGER,
     coach_reply TEXT,
     personalize INTEGER NOT NULL DEFAULT 1
   );
   CREATE TABLE daily_seen (date TEXT PRIMARY KEY, message_id TEXT NOT NULL);
   CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
   CREATE TABLE tough_days (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL);`,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= openDb();
  return dbPromise;
}

async function openDb(): Promise<SQLite.SQLiteDatabase> {
  const key = await getOrCreateKey();
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  // Must run before any other statement, or SQLCipher treats the file as plaintext.
  await db.execAsync(`PRAGMA key = "x'${key}'";`);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  for (let v = version; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]!);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
  return db;
}

/** Deletes the database and its key. Used by "Delete everything". */
export async function wipeEverything(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME).catch(() => undefined);
  await SecureStore.deleteItemAsync(KEY_NAME);
}

// ---------- Profile ----------

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

interface ProfileRow {
  addiction: string;
  substance: string | null;
  other_label: string | null;
  status: string;
  start_date: string | null;
  started_at: string | null;
  ai_consent: number;
}

export async function getProfile(): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ProfileRow>('SELECT * FROM profile WHERE id = 1');
  if (!row) return null;
  return ProfileSchema.parse({
    addiction: row.addiction,
    substance: row.substance,
    otherLabel: row.other_label,
    status: row.status,
    startDate: row.start_date,
    startedAt: row.started_at,
    aiConsent: row.ai_consent === 1,
  });
}

export async function saveProfile(p: Profile): Promise<void> {
  const v = ProfileSchema.parse(p);
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO profile (id, addiction, substance, other_label, status, start_date, started_at, ai_consent, created_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET addiction = excluded.addiction, substance = excluded.substance,
       other_label = excluded.other_label, status = excluded.status, start_date = excluded.start_date,
       started_at = excluded.started_at, ai_consent = excluded.ai_consent`,
    v.addiction,
    v.substance,
    v.otherLabel,
    v.status,
    v.startDate,
    v.startedAt,
    v.aiConsent ? 1 : 0,
    new Date().toISOString(),
  );
}

// ---------- Streak history ----------

export async function addPastStreak(streak: PastStreak, note: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO streak_history (start_date, end_date, note) VALUES (?, ?, ?)', streak.startDate, streak.endDate, note);
}

export async function getPastStreaks(): Promise<PastStreak[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ start_date: string; end_date: string }>('SELECT start_date, end_date FROM streak_history ORDER BY id');
  return rows.map((r) => ({ startDate: r.start_date, endDate: r.end_date }));
}

// ---------- Journal ----------

export interface JournalEntry {
  id: number;
  createdAt: string;
  kind: 'text' | 'voice';
  body: string;
  mood: number | null;
  coachReply: string | null;
  personalize: boolean;
}

interface EntryRow {
  id: number;
  created_at: string;
  kind: string;
  body: string;
  mood: number | null;
  coach_reply: string | null;
  personalize: number;
}

function toEntry(r: EntryRow): JournalEntry {
  return {
    id: r.id,
    createdAt: r.created_at,
    kind: r.kind === 'voice' ? 'voice' : 'text',
    body: r.body,
    mood: r.mood,
    coachReply: r.coach_reply,
    personalize: r.personalize === 1,
  };
}

export async function addEntry(e: Pick<JournalEntry, 'kind' | 'body' | 'mood'>): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO journal_entries (created_at, kind, body, mood) VALUES (?, ?, ?, ?)',
    new Date().toISOString(),
    e.kind,
    e.body,
    e.mood,
  );
  return res.lastInsertRowId;
}

export async function setCoachReply(id: number, reply: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE journal_entries SET coach_reply = ? WHERE id = ?', reply, id);
}

export async function setPersonalize(id: number, personalize: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE journal_entries SET personalize = ? WHERE id = ?', personalize ? 1 : 0, id);
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM journal_entries WHERE id = ?', id);
}

export async function getEntry(id: number): Promise<JournalEntry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EntryRow>('SELECT * FROM journal_entries WHERE id = ?', id);
  return row ? toEntry(row) : null;
}

export async function listEntries(limit = 200): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EntryRow>('SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT ?', limit);
  return rows.map(toEntry);
}

/** Recent entries the person allowed us to use for personalized messages. */
export async function personalizationEntries(limit = 20): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EntryRow>(
    'SELECT * FROM journal_entries WHERE personalize = 1 ORDER BY created_at DESC LIMIT ?',
    limit,
  );
  return rows.map(toEntry);
}

// ---------- Daily messages, tough days, settings ----------

export async function recordDailySeen(date: string, messageId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO daily_seen (date, message_id) VALUES (?, ?)', date, messageId);
}

/** Message ids shown since `sinceDate`, not counting `today` (so today's pick stays stable). */
export async function recentDailyIds(sinceDate: string, today: string): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ message_id: string }>(
    'SELECT message_id FROM daily_seen WHERE date >= ? AND date <> ?',
    sinceDate,
    today,
  );
  return new Set(rows.map((r) => r.message_id));
}

export async function recordToughDay(date: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO tough_days (date) VALUES (?)', date);
}

export async function toughDayCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM tough_days');
  return row?.n ?? 0;
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  const db = await getDb();
  if (value === null) await db.runAsync('DELETE FROM settings WHERE key = ?', key);
  else await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
}

/** Everything we store, for the "Export my data" button. */
export async function exportAll(): Promise<Record<string, unknown>> {
  const db = await getDb();
  return {
    exportedAt: new Date().toISOString(),
    profile: await getProfile(),
    pastStreaks: await db.getAllAsync('SELECT * FROM streak_history'),
    journal: await listEntries(100_000),
    toughDays: await db.getAllAsync('SELECT * FROM tough_days'),
    settings: await db.getAllAsync('SELECT * FROM settings'),
  };
}

export type { AddictionType, DrugSubstance };
