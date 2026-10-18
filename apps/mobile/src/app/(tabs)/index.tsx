import Ionicons from '@expo/vector-icons/Ionicons';
import { hoursClean, localDateKey, milestoneMessage, MILESTONE_DAYS, pickDailyMessage } from '@stay-clean/shared';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Gap, Screen, Text, usePalette } from '@/components/ui';
import { api } from '@/lib/api';
import { currentTimeZone, todayKey, useAppState } from '@/lib/app-state';
import { getSetting, recentDailyIds, recordDailySeen, setSetting } from '@/lib/db';
import { radius } from '@/lib/theme';

function useTodaysMessage(): string | null {
  const { profile, daysClean, settings, supportContext } = useAppState();
  const [message, setMessage] = useState<string | null>(null);
  const date = todayKey();

  useEffect(() => {
    if (!profile || !settings.salt) return;
    let cancelled = false;
    void (async () => {
      const since = localDateKey(new Date(Date.now() - 60 * 86_400_000), currentTimeZone());
      const picked = pickDailyMessage({
        dateKey: date,
        daysClean,
        addiction: profile.addiction,
        recentIds: await recentDailyIds(since, date),
        salt: settings.salt,
      });
      const seenToday = await getSetting(`daily:${date}`);
      if (!cancelled) setMessage(seenToday ?? picked.text);
      if (seenToday || (await getSetting(`dailyTried:${date}`))) return;
      await setSetting(`dailyTried:${date}`, '1');
      await recordDailySeen(date, picked.id);
      // With consent, try a personalized message once a day; the bundled one is the fallback.
      const ctx = await supportContext();
      if (!ctx) return;
      try {
        const res = await api.daily(ctx);
        if (!res.crisis) {
          await setSetting(`daily:${date}`, res.message);
          if (!cancelled) setMessage(res.message);
        }
      } catch {
        // Offline or unavailable: keep the bundled message.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, daysClean, settings.salt, date, supportContext]);

  return message;
}

/** Celebrates a milestone once, on the first app open that reaches it. */
function useMilestone(days: number): string | null {
  const [celebrated, setCelebrated] = useState<number | null>(null);
  useEffect(() => {
    const isMilestone = (MILESTONE_DAYS as readonly number[]).includes(days) || (days > 0 && days % 365 === 0);
    if (!isMilestone) return;
    void (async () => {
      const key = `celebrated:${days}`;
      if (await getSetting(key)) return;
      await setSetting(key, '1');
      setCelebrated(days);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    })();
  }, [days]);
  return celebrated === days ? milestoneMessage(days) : null;
}

function SquareButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.square, { backgroundColor: p.surface, opacity: pressed ? 0.85 : 1 }]}
    >
      <Ionicons name={icon} size={22} color={p.accent} />
      <Text variant="label" style={{ fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Home() {
  const { profile, daysClean, startToday } = useAppState();
  const message = useTodaysMessage();
  const milestone = useMilestone(daysClean);
  if (!profile) return null;

  const preparing = profile.status === 'preparing';
  const hours = profile.startedAt ? hoursClean(new Date(profile.startedAt), new Date()) : 0;

  return (
    <Screen palette="dark">
      <View style={styles.header}>
        <Text variant="caption" tone="textMuted">
          RECOVERY COMPANION
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get help now"
          accessibilityHint="Opens crisis lines you can call or text"
          onPress={() => router.push('/crisis')}
          style={styles.helpPill}
        >
          <Ionicons name="call-outline" size={14} color="#F4B3A5" />
          <Text variant="bodySmall" tone="danger" style={{ fontWeight: '600' }}>
            Get help
          </Text>
        </Pressable>
      </View>

      {preparing ? (
        <View style={styles.counter}>
          <Text variant="title" style={{ textAlign: 'center' }}>
            Ready when you are
          </Text>
          <Gap size="sm" />
          <Text tone="textSecondary" style={{ textAlign: 'center' }}>
            Look through your first steps, then start your counter.
          </Text>
          <Gap />
          <Button label="I'm starting today" onPress={() => void startToday()} />
          <Gap size="sm" />
          <Button variant="ghost" label="See my first steps" onPress={() => router.push('/(tabs)/resources')} />
        </View>
      ) : (
        <View style={styles.counter} accessible accessibilityLabel={`${daysClean} days in recovery`}>
          <Text tone="textSecondary" style={{ fontSize: 17 }}>
            Your recovery journey
          </Text>
          <Text style={styles.bigNumber} adjustsFontSizeToFit numberOfLines={1}>
            {daysClean}
          </Text>
          <Text style={styles.daysLabel}>{daysClean === 1 ? 'DAY IN RECOVERY' : 'DAYS IN RECOVERY'}</Text>
          <Gap size="sm" />
          <Text variant="bodySmall" tone="textMuted">
            {daysClean === 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'} so far. One day at a time.` : 'One day at a time'}
          </Text>
        </View>
      )}

      {milestone ? (
        <>
          <Card tone="surfaceAlt">
            <Text variant="label" tone="accent">
              Milestone
            </Text>
            <Gap size="xs" />
            <Text>{milestone}</Text>
          </Card>
          <Gap size="md" />
        </>
      ) : null}

      <Card>
        <Text variant="label">Today's encouragement</Text>
        <Gap size="xs" />
        <Text tone="textSecondary">{message ?? ' '}</Text>
      </Card>
      <Gap />
      <Button label="Having a tough day? Tap here" onPress={() => router.push('/tough-day')} style={{ minHeight: 60 }} />
      <Gap size="md" />
      <View style={styles.row}>
        <SquareButton icon="mic-outline" label="Talk it out" onPress={() => router.push('/talk')} />
        <SquareButton icon="book-outline" label="My journal" onPress={() => router.push('/journal')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helpPill: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#6E4740',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counter: { alignItems: 'center', paddingVertical: 32 },
  bigNumber: { color: '#FFFFFF', fontSize: 120, fontWeight: '700', lineHeight: 132, letterSpacing: -3, marginTop: 8 },
  daysLabel: { color: '#FFFFFF', fontSize: 22, fontWeight: '600', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 12 },
  square: { flex: 1, minHeight: 76, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 6 },
});
