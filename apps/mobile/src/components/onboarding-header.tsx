import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { usePalette } from './ui';

/** Back button and "step N of M" progress dots for onboarding. */
export function OnboardingHeader({ step, total, back = true }: { step: number; total: number; back?: boolean }) {
  const p = usePalette();
  return (
    <View style={styles.row}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={p.text} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <View style={styles.dots} accessible accessibilityLabel={`Step ${step} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i < step ? p.primary : '#CFD8D3' }]} />
        ))}
      </View>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  back: { width: 44, height: 44, justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 18, height: 6, borderRadius: 3 },
});
