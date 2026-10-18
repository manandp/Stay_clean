import { router } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { OnboardingHeader } from '@/components/onboarding-header';
import { Button, Gap, Screen, Text, usePalette } from '@/components/ui';
import { useOnboardingDraft, type OnboardingDraft } from '@/lib/onboarding-draft';
import { palettes, radius } from '@/lib/theme';

const OPTIONS: { value: OnboardingDraft['start']; label: string; detail: string }[] = [
  { value: 'today', label: "I'm starting today", detail: 'Your counter starts now.' },
  { value: 'past', label: "I've already been clean for a while", detail: 'Tell us how many days so your counter is right.' },
  { value: 'preparing', label: "I haven't started yet", detail: "We'll show you how to begin. Start the counter when you're ready." },
];

export default function StartDate() {
  const p = usePalette();
  const [draft, update] = useOnboardingDraft();
  const daysText = draft.pastDays === null ? '' : String(draft.pastDays);
  const canContinue = draft.start !== 'past' || draft.pastDays !== null;

  return (
    <Screen>
      <OnboardingHeader step={3} total={4} />
      <Text variant="title">Where are you in your journey?</Text>
      <Gap size="xxl" />
      <View accessibilityRole="radiogroup" style={{ gap: 12 }}>
        {OPTIONS.map((o) => {
          const selected = draft.start === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${o.label}. ${o.detail}`}
              onPress={() => update({ start: o.value })}
              style={[styles.option, selected ? { borderColor: p.primary, borderWidth: 2, backgroundColor: p.surfaceAlt } : { borderColor: '#D5DDD8' }]}
            >
              <Text variant="label">{o.label}</Text>
              <Text variant="bodySmall" tone="textMuted">
                {o.detail}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {draft.start === 'past' ? (
        <>
          <Gap size="xl" />
          <Text variant="label" nativeID="daysLabel">
            How many days have you been clean?
          </Text>
          <Gap size="sm" />
          <TextInput
            accessibilityLabelledBy="daysLabel"
            keyboardType="number-pad"
            value={daysText}
            maxLength={5}
            onChangeText={(t) => {
              const digits = t.replace(/\D/g, '');
              update({ pastDays: digits === '' ? null : Math.min(Number(digits), 36_500) });
            }}
            placeholder="For example: 12"
            placeholderTextColor={palettes.light.textMuted}
            style={styles.input}
          />
        </>
      ) : null}

      <Gap size="xxl" />
      <Button label="Continue" disabled={!canContinue} onPress={() => router.push('/onboarding/privacy')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: { borderRadius: radius.lg, borderWidth: 1, padding: 16, backgroundColor: '#FFFFFF', gap: 4 },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D5DDD8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: palettes.light.text,
  },
});
