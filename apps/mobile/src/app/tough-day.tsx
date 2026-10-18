import Ionicons from '@expo/vector-icons/Ionicons';
import { ADDICTIONS, COPING_TOOLS } from '@stay-clean/shared';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Card, Gap, Screen, Text, usePalette } from '@/components/ui';
import { api } from '@/lib/api';
import { todayKey, useAppState } from '@/lib/app-state';
import { personalizationEntries, recordToughDay } from '@/lib/db';
import { callNumber, openWeb, textNumber } from '@/lib/links';
import { scheduleToughDayFollowUp } from '@/lib/notifications';
import { radius } from '@/lib/theme';

const PHASES = [
  { label: 'Breathe in', seconds: 4, scale: 1 },
  { label: 'Hold', seconds: 7, scale: 1 },
  { label: 'Breathe out', seconds: 8, scale: 0.6 },
] as const;

function BreathingGuide() {
  const p = usePalette();
  const [scale] = useState(() => new Animated.Value(0.6));
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState<number>(PHASES[0].seconds);

  useEffect(() => {
    let reduceMotion = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => (reduceMotion = v));
    let current = 0;
    let remaining: number = PHASES[0].seconds;
    const tick = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        current = (current + 1) % PHASES.length;
        remaining = PHASES[current]!.seconds;
        setPhase(current);
        const target = PHASES[current]!;
        if (!reduceMotion) {
          Animated.timing(scale, { toValue: target.scale, duration: target.seconds * 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
        }
      }
      setCount(remaining);
    }, 1000);
    Animated.timing(scale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
    return () => clearInterval(tick);
  }, [scale]);

  const current = PHASES[phase]!;
  return (
    <Card style={styles.breathCard}>
      <View style={[styles.breathOuter, { backgroundColor: p.surfaceAlt }]}>
        <Animated.View style={[styles.breathInner, { backgroundColor: p.primary, transform: [{ scale }] }]}>
          <Text variant="heading">{count}</Text>
        </Animated.View>
      </View>
      <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
        <Text variant="label">
          {current.label} for {current.seconds}
        </Text>
        <Text variant="bodySmall" tone="textSecondary">
          In for 4, hold for 7, out for 8. Cravings peak and pass, usually within 15 to 30 minutes.
        </Text>
      </View>
    </Card>
  );
}

function Action({ label, icon, onPress, tone = 'surface' }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; tone?: 'primary' | 'surface' | 'danger' }) {
  const p = usePalette();
  const bg = tone === 'primary' ? p.primary : tone === 'danger' ? 'transparent' : p.surface;
  const fg = tone === 'danger' ? p.danger : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: bg, borderColor: tone === 'danger' ? p.dangerBorder : bg, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Ionicons name={icon} size={18} color={fg} />
      <Text variant="label" style={{ color: fg, fontSize: 15, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Pick a short sentence the person wrote, to remind them of their own reasons. */
function pickOwnWords(bodies: string[]): string | null {
  const sentences = bodies
    .flatMap((b) => b.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 140 && /\b(want|because|worth|proud|love|for my|grateful|better|free)\b/i.test(s));
  return sentences[0] ?? null;
}

export default function ToughDay() {
  usePreventScreenCapture();
  const { profile, daysClean, longest, settings, supportContext } = useAppState();
  const [coach, setCoach] = useState<string | null>(null);
  const [ownWords, setOwnWords] = useState<string | null>(null);
  const [timerEnds, setTimerEnds] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    void recordToughDay(todayKey());
    void personalizationEntries(20).then((entries) => setOwnWords(pickOwnWords(entries.map((e) => e.body))));
    // Offline content shows immediately; a personalized message replaces it when it arrives.
    void (async () => {
      const ctx = await supportContext();
      if (!ctx) return;
      try {
        const res = await api.toughDay(ctx);
        if (res.crisis) router.replace({ pathname: '/crisis', params: { fromCoach: '1' } });
        else setCoach(res.message);
      } catch {
        // Keep the offline content.
      }
    })();
    // Run once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!timerEnds) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [timerEnds]);

  if (!profile) return null;
  const content = ADDICTIONS[profile.addiction];
  const meeting = content.resources.find((r) => r.kind === 'meeting' && r.url);
  const fallbackTool = COPING_TOOLS.find((t) => t.id === 'urge-surfing')!;
  const secondsLeft = timerEnds ? Math.max(0, Math.round((timerEnds - now) / 1000)) : 0;

  return (
    <Screen palette="dark">
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
        <Text variant="bodySmall" tone="textMuted">
          Day {daysClean} · longest {longest}
        </Text>
      </View>
      <Text variant="title" style={{ fontSize: 25 }}>
        You reached out instead of giving in. That counts.
      </Text>
      <Gap />
      <BreathingGuide />
      <Gap size="md" />
      <Card>
        <View style={styles.companionTitle}>
          <Ionicons name="heart-outline" size={20} color="#7FD1BF" />
          <Text variant="label" tone="accent">
            Recovery Companion
          </Text>
        </View>
        <Gap size="sm" />
        <Text tone="textSecondary">
          {coach ??
            `You've made it ${daysClean} ${daysClean === 1 ? 'day' : 'days'}, and you can make it through this moment too. ${fallbackTool.steps}`}
        </Text>
      </Card>
      {ownWords ? (
        <>
          <Gap size="md" />
          <View style={styles.quote}>
            <Text variant="caption" tone="textMuted">
              IN YOUR OWN WORDS
            </Text>
            <Gap size="xs" />
            <Text style={{ fontStyle: 'italic' }}>"{ownWords}"</Text>
          </View>
        </>
      ) : null}
      <Gap />
      {timerEnds && secondsLeft > 0 ? (
        <Card style={{ alignItems: 'center' }}>
          <Text variant="heading" accessibilityLiveRegion="polite">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </Text>
          <Text variant="bodySmall" tone="textSecondary">
            Wait it out. Drink water, change rooms, move your body.
          </Text>
        </Card>
      ) : null}
      <Gap size="md" />
      <View style={styles.grid}>
        <Action
          tone="primary"
          icon="chatbubble-outline"
          label={settings.supportName ? `Text ${settings.supportName}` : 'Text my support person'}
          onPress={() => (settings.supportPhone ? void textNumber(settings.supportPhone, "I'm having a rough moment. Can you talk?") : router.replace('/(tabs)/profile'))}
        />
        <Action
          icon="timer-outline"
          label="Start 15-min timer"
          onPress={() => {
            const start = Date.now();
            setNow(start);
            setTimerEnds(start + 15 * 60 * 1000);
            void scheduleToughDayFollowUp(settings.discreet).catch(() => undefined);
          }}
        />
        <Action icon="people-outline" label="Find a meeting" onPress={() => (meeting?.url ? void openWeb(meeting.url) : router.replace('/(tabs)/resources'))} />
        <Action tone="danger" icon="call-outline" label="Call or text 988" onPress={() => void callNumber('988')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconButton: { width: 44, height: 44, justifyContent: 'center' },
  breathCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  breathOuter: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  breathInner: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  companionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quote: { padding: 14, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: '#4C6A72' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { width: '48%', flexGrow: 1, minHeight: 56, borderRadius: radius.md, borderWidth: 1, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
