import Ionicons from '@expo/vector-icons/Ionicons';
import { CRISIS_MESSAGE, crisisResourcesFor } from '@stay-clean/shared';
import { getLocales } from 'expo-localization';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Gap, Screen, Text } from '@/components/ui';
import { callNumber, openWeb, textNumber } from '@/lib/links';

/** Works fully offline: everything here is bundled with the app. */
export default function Crisis() {
  const { fromCoach } = useLocalSearchParams<{ fromCoach?: string }>();
  const resources = crisisResourcesFor(getLocales()[0]?.regionCode);

  return (
    <Screen palette="dark">
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </View>
      <Text variant="title">You don't have to face this alone</Text>
      <Gap size="sm" />
      <Text tone="textSecondary">
        {fromCoach ? CRISIS_MESSAGE : 'If you are thinking about hurting yourself, may have taken too much, or feel unsafe, reach out right now. These lines are free, confidential and open 24/7.'}
      </Text>
      <Gap size="xl" />
      {resources.map((r) => (
        <View key={r.name} style={{ marginBottom: 12 }}>
          <Card>
            <Text variant="label">{r.name}</Text>
            <Text variant="bodySmall" tone="textSecondary">
              {r.detail}
            </Text>
            <Gap size="md" />
            <View style={styles.actions}>
              {r.phone ? <Button label={`Call ${r.phone}`} onPress={() => void callNumber(r.phone!)} style={{ flex: 1 }} /> : null}
              {r.sms ? (
                <Button
                  variant="outline"
                  label="Text"
                  accessibilityLabel={`Text ${r.sms}`}
                  onPress={() => void textNumber(r.sms!, r.sms === '741741' ? 'HOME' : undefined)}
                  style={{ flex: 1 }}
                />
              ) : null}
              {r.url ? <Button variant="outline" label="Open website" onPress={() => void openWeb(r.url!)} style={{ flex: 1 }} /> : null}
            </View>
          </Card>
        </View>
      ))}
      <Gap size="sm" />
      <Text variant="bodySmall" tone="textMuted">
        If someone may have overdosed: call 911, give naloxone (Narcan) if you have it, and stay with them.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'flex-end' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
