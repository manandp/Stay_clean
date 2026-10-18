import Ionicons from '@expo/vector-icons/Ionicons';
import { MILESTONE_DAYS, milestoneProgress, nextMilestone } from '@stay-clean/shared';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Gap, Screen, Text, usePalette } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { palettes, radius } from '@/lib/theme';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 32, fontWeight: '700' }}>{value}</Text>
      <Text variant="bodySmall" tone="textMuted" style={{ textAlign: 'center' }}>
        {label}
      </Text>
    </Card>
  );
}

export default function Progress() {
  const p = usePalette();
  const { profile, daysClean, longest, total, toughDaysBeaten, restartAfterSlip } = useAppState();
  const [slipOpen, setSlipOpen] = useState(false);
  const [note, setNote] = useState('');
  if (!profile) return null;

  const next = nextMilestone(daysClean);
  const active = profile.status === 'active';

  return (
    <Screen>
      <Text variant="title">Your progress</Text>
      <Gap />
      <View style={styles.row}>
        <Stat value={daysClean} label="Current streak" />
        <Stat value={longest} label="Longest streak" />
      </View>
      <Gap size="md" />
      <View style={styles.row}>
        <Stat value={total} label="Total clean days" />
        <Stat value={toughDaysBeaten} label="Tough moments faced" />
      </View>

      {active ? (
        <>
          <Gap size="xl" />
          <Card>
            <Text variant="label">Next milestone: {next} days</Text>
            <Gap size="sm" />
            <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(milestoneProgress(daysClean) * 100) }}>
              <View style={[styles.fill, { width: `${Math.round(milestoneProgress(daysClean) * 100)}%`, backgroundColor: p.primary }]} />
            </View>
            <Gap size="sm" />
            <Text variant="bodySmall" tone="textMuted">
              {next - daysClean} {next - daysClean === 1 ? 'day' : 'days'} to go
            </Text>
          </Card>
        </>
      ) : null}

      <Gap size="xl" />
      <Text variant="caption" tone="textMuted">
        MILESTONES
      </Text>
      <Gap size="sm" />
      <Card>
        {MILESTONE_DAYS.map((m) => {
          const reached = active && daysClean >= m;
          return (
            <View key={m} style={styles.milestone} accessible accessibilityLabel={`${m} days, ${reached ? 'reached' : 'not yet'}`}>
              <Ionicons name={reached ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={reached ? p.primary : '#9AA8A3'} />
              <Text tone={reached ? 'text' : 'textMuted'}>{m === 365 ? '1 year' : `${m} ${m === 1 ? 'day' : 'days'}`}</Text>
            </View>
          );
        })}
      </Card>

      {active ? (
        <>
          <Gap size="xl" />
          {slipOpen ? (
            <Card tone="surfaceAlt">
              <Text variant="heading">A slip doesn't erase your progress</Text>
              <Gap size="sm" />
              <Text tone="textSecondary">
                Your {daysClean} days still count, and they stay in your total. Many people slip on the way to lasting recovery. What matters is starting
                again.
              </Text>
              <Gap />
              <Text variant="label" nativeID="slipNote">
                What happened? (optional, private)
              </Text>
              <Gap size="sm" />
              <TextInput
                accessibilityLabelledBy="slipNote"
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={1000}
                style={styles.input}
                placeholder="What led up to it, and what might help next time"
                placeholderTextColor={palettes.light.textMuted}
              />
              <Gap />
              <Button
                label="Start again today"
                onPress={() => {
                  void restartAfterSlip(note.trim() || null);
                  setSlipOpen(false);
                  setNote('');
                }}
              />
              <Gap size="sm" />
              <Button variant="ghost" label="Cancel" onPress={() => setSlipOpen(false)} />
            </Card>
          ) : (
            <Button variant="outline" label="I had a slip" onPress={() => setSlipOpen(true)} />
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#DCE5E0', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 },
  input: {
    minHeight: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D5DDD8',
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 16,
    color: palettes.light.text,
    textAlignVertical: 'top',
  },
});
