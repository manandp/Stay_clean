import * as Crypto from 'expo-crypto';
import {
  daysClean as computeDaysClean,
  localDateKey,
  longestStreak,
  totalCleanDays,
  type PastStreak,
  type SupportContext,
} from '@stay-clean/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { api } from './api';
import {
  addPastStreak,
  getPastStreaks,
  getProfile,
  getSetting,
  personalizationEntries,
  saveProfile,
  setSetting,
  toughDayCount,
  type Profile,
} from './db';
import { rescheduleDailyNotifications } from './notifications';

export function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function todayKey(): string {
  return localDateKey(new Date(), currentTimeZone());
}

export interface Settings {
  appLock: boolean;
  discreet: boolean;
  notifyHour: number;
  supportName: string;
  supportPhone: string;
  salt: string;
}

interface AppStateValue {
  ready: boolean;
  profile: Profile | null;
  settings: Settings;
  daysClean: number;
  longest: number;
  total: number;
  toughDaysBeaten: number;
  /** Re-reads everything from storage. */
  refresh: () => Promise<void>;
  saveProfile: (p: Profile) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  startToday: () => Promise<void>;
  /** Ends the current streak (kept in history) and starts a new one today. */
  restartAfterSlip: (note: string | null) => Promise<void>;
  /** What the AI server may know: addiction, days, and a short on-device theme summary. */
  supportContext: () => Promise<SupportContext | null>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const DEFAULT_SETTINGS: Settings = { appLock: false, discreet: false, notifyHour: 9, supportName: '', supportPhone: '', salt: '' };

async function loadSettings(): Promise<Settings> {
  let salt = await getSetting('salt');
  if (!salt) {
    salt = Crypto.randomUUID();
    await setSetting('salt', salt);
  }
  return {
    appLock: (await getSetting('appLock')) === '1',
    discreet: (await getSetting('discreet')) === '1',
    notifyHour: Number((await getSetting('notifyHour')) ?? '9'),
    supportName: (await getSetting('supportName')) ?? '',
    supportPhone: (await getSetting('supportPhone')) ?? '',
    salt,
  };
}

const THEMES_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Refreshes the short journal-themes summary at most once a day, only with consent. */
async function themesFor(profile: Profile): Promise<string | undefined> {
  const cached = await getSetting('themes');
  const updatedAt = Number((await getSetting('themesUpdatedAt')) ?? '0');
  const dirty = (await getSetting('themesDirty')) === '1';
  if (cached && (!dirty || Date.now() - updatedAt < THEMES_MAX_AGE_MS)) return cached;
  const entries = await personalizationEntries(20);
  if (entries.length === 0) return cached ?? undefined;
  try {
    const { summary } = await api.summarize({ addiction: profile.addiction, entries: entries.map((e) => e.body.slice(0, 4000)) });
    await setSetting('themes', summary);
    await setSetting('themesUpdatedAt', String(Date.now()));
    await setSetting('themesDirty', null);
    return summary;
  } catch {
    return cached ?? undefined;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [past, setPast] = useState<PastStreak[]>([]);
  const [toughDaysBeaten, setToughDaysBeaten] = useState(0);
  const [dayKey, setDayKey] = useState(todayKey);

  const refresh = useCallback(async () => {
    const [p, s, ps, td] = await Promise.all([getProfile(), loadSettings(), getPastStreaks(), toughDayCount()]);
    setProfile(p);
    setSettings(s);
    setPast(ps);
    setToughDaysBeaten(td);
    setDayKey(todayKey());
    setReady(true);
  }, []);

  useEffect(() => {
    // Loads from encrypted storage on launch; state is set after the reads resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // Roll the counter over at midnight and when the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setDayKey(todayKey());
    });
    const timer = setInterval(() => setDayKey(todayKey()), 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);

  const daysClean = useMemo(() => {
    if (!profile || profile.status !== 'active' || !profile.startDate) return 0;
    return computeDaysClean(profile.startDate, new Date(), currentTimeZone());
    // dayKey changes at midnight and re-runs this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, dayKey]);

  // Keep two weeks of daily notifications scheduled.
  useEffect(() => {
    if (!ready || !profile || profile.status !== 'active') return;
    void rescheduleDailyNotifications({
      hour: settings.notifyHour,
      discreet: settings.discreet,
      addiction: profile.addiction,
      daysCleanToday: daysClean,
      salt: settings.salt,
      timeZone: currentTimeZone(),
    }).catch(() => undefined);
  }, [ready, profile, settings.notifyHour, settings.discreet, settings.salt, daysClean]);

  const value = useMemo<AppStateValue>(
    () => ({
      ready,
      profile,
      settings,
      daysClean,
      longest: longestStreak(past, daysClean),
      total: totalCleanDays(past, daysClean),
      toughDaysBeaten,
      refresh,
      saveProfile: async (p) => {
        await saveProfile(p);
        setProfile(p);
      },
      updateSettings: async (patch) => {
        const next = { ...settings, ...patch };
        await setSetting('appLock', next.appLock ? '1' : '0');
        await setSetting('discreet', next.discreet ? '1' : '0');
        await setSetting('notifyHour', String(next.notifyHour));
        await setSetting('supportName', next.supportName.trim() || null);
        await setSetting('supportPhone', next.supportPhone.trim() || null);
        setSettings(next);
      },
      startToday: async () => {
        if (!profile) return;
        const p: Profile = { ...profile, status: 'active', startDate: todayKey(), startedAt: new Date().toISOString() };
        await saveProfile(p);
        setProfile(p);
      },
      restartAfterSlip: async (note) => {
        if (!profile?.startDate) return;
        const today = todayKey();
        await addPastStreak({ startDate: profile.startDate, endDate: today }, note);
        const p: Profile = { ...profile, status: 'active', startDate: today, startedAt: new Date().toISOString() };
        await saveProfile(p);
        setProfile(p);
        setPast(await getPastStreaks());
      },
      supportContext: async () => {
        if (!profile || !profile.aiConsent) return null;
        const themes = await themesFor(profile);
        return {
          addiction: profile.addiction,
          substance: profile.substance ?? undefined,
          otherLabel: profile.otherLabel ?? undefined,
          daysClean,
          themes,
        };
      },
    }),
    [ready, profile, settings, daysClean, past, toughDaysBeaten, refresh],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
