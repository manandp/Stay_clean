import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePreventScreenCapture } from '@/lib/screen-capture';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Button, Card, Gap, Screen, Text, usePalette } from '@/components/ui';
import { deleteEntry, getEntry, setPersonalize, setSetting, type JournalEntry } from '@/lib/db';
import { Alert } from '@/lib/alert';

export default function EntryDetail() {
  usePreventScreenCapture();
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    void getEntry(Number(id)).then(setEntry);
  }, [id]);

  if (!entry) return <Screen>{null}</Screen>;

  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
        <Ionicons name="chevron-back" size={26} color={p.text} />
      </Pressable>
      <Text variant="bodySmall" tone="textMuted">
        {new Date(entry.createdAt).toLocaleString()}
        {entry.mood ? ` · mood ${entry.mood} of 5` : ''}
      </Text>
      <Gap size="sm" />
      <Card>
        <Text>{entry.body}</Text>
      </Card>
      {entry.coachReply ? (
        <>
          <Gap />
          <Card tone="surfaceAlt" style={{ borderWidth: 0 }}>
            <Text variant="label">Recovery Companion</Text>
            <Gap size="sm" />
            <Text>{entry.coachReply}</Text>
          </Card>
        </>
      ) : null}
      <Gap />
      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text variant="label">Use to personalize my messages</Text>
            <Text variant="bodySmall" tone="textMuted">
              Lets this entry shape your encouragement and tough-day messages.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Use to personalize my messages"
            value={entry.personalize}
            trackColor={{ true: p.primary, false: '#C7D0CC' }}
            onValueChange={(v) => {
              void setPersonalize(entry.id, v).then(() => setSetting('themesDirty', '1'));
              setEntry({ ...entry, personalize: v });
            }}
          />
        </View>
      </Card>
      <Gap size="xl" />
      <Button
        variant="danger"
        label="Delete entry"
        onPress={() =>
          Alert.alert('Delete this entry?', 'It will be removed from this phone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () =>
                void deleteEntry(entry.id)
                  .then(() => setSetting('themesDirty', '1'))
                  .then(() => router.back()),
            },
          ])
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconButton: { width: 44, height: 44, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
