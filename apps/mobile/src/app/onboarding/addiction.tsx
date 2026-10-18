import Ionicons from '@expo/vector-icons/Ionicons';
import { ADDICTION_TYPES, ADDICTIONS, DRUG_SUBSTANCES, SUBSTANCE_LABELS } from '@stay-clean/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { OnboardingHeader } from '@/components/onboarding-header';
import { Button, Gap, Screen, Text, usePalette } from '@/components/ui';
import { useOnboardingDraft } from '@/lib/onboarding-draft';
import { palettes, radius } from '@/lib/theme';

function Choice({ label, detail, selected, onPress }: { label: string; detail?: string; selected: boolean; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      style={[
        styles.card,
        selected ? { borderColor: p.primary, borderWidth: 2, backgroundColor: p.surfaceAlt } : { borderColor: '#D5DDD8', backgroundColor: p.surface },
      ]}
    >
      <Text variant="label">{label}</Text>
      {detail ? (
        <Text variant="bodySmall" tone="textMuted">
          {detail}
        </Text>
      ) : null}
      {selected ? (
        <View style={[styles.check, { backgroundColor: p.primary }]}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ChooseAddiction() {
  const [draft, update] = useOnboardingDraft();
  const canContinue = draft.addiction !== null && (draft.addiction !== 'other' || draft.otherLabel.trim().length > 0);

  return (
    <Screen>
      <OnboardingHeader step={2} total={4} />
      <Text variant="title">What are you working on?</Text>
      <Gap size="sm" />
      <Text tone="textMuted">We'll tailor your resources, first steps and daily support. This stays private on your phone.</Text>
      <Gap size="xxl" />
      <View style={styles.grid} accessibilityRole="radiogroup">
        {ADDICTION_TYPES.map((t) => (
          <View key={t} style={styles.cell}>
            <Choice
              label={ADDICTIONS[t].label}
              detail={ADDICTIONS[t].shortDescription}
              selected={draft.addiction === t}
              onPress={() => update({ addiction: t, substance: t === 'drugs' ? draft.substance : null })}
            />
          </View>
        ))}
      </View>

      {draft.addiction === 'drugs' ? (
        <>
          <Gap size="xl" />
          <Text variant="label">Which kind? (optional)</Text>
          <Text variant="bodySmall" tone="textMuted">
            Safety advice differs between substances.
          </Text>
          <Gap size="md" />
          <View style={styles.grid} accessibilityRole="radiogroup">
            {DRUG_SUBSTANCES.map((s) => (
              <View key={s} style={styles.cell}>
                <Choice label={SUBSTANCE_LABELS[s]} selected={draft.substance === s} onPress={() => update({ substance: s })} />
              </View>
            ))}
          </View>
        </>
      ) : null}

      {draft.addiction === 'other' ? (
        <>
          <Gap size="xl" />
          <Text variant="label" nativeID="otherLabel">
            What would you like to call it?
          </Text>
          <Gap size="sm" />
          <TextInput
            accessibilityLabelledBy="otherLabel"
            value={draft.otherLabel}
            onChangeText={(otherLabel) => update({ otherLabel })}
            maxLength={40}
            placeholder="For example: shopping"
            placeholderTextColor={palettes.light.textMuted}
            style={styles.input}
          />
        </>
      ) : null}

      <Gap size="xxl" />
      <Button label="Continue" disabled={!canContinue} onPress={() => router.push('/onboarding/start')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  cell: { width: '50%', padding: 6 },
  card: { minHeight: 76, borderRadius: radius.lg, borderWidth: 1, padding: 14, justifyContent: 'center' },
  check: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
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
