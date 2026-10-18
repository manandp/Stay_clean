import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { usePreventScreenCapture } from '@/lib/screen-capture';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Gap, Screen, Text, usePalette } from '@/components/ui';
import { listEntries, type JournalEntry } from '@/lib/db';
import { palettes, radius } from '@/lib/theme';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function JournalList() {
  usePreventScreenCapture();
  const p = usePalette();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      void listEntries().then(setEntries);
    }, []),
  );

  const q = query.trim().toLowerCase();
  const shown = q ? entries.filter((e) => e.body.toLowerCase().includes(q)) : entries;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={26} color={p.text} />
        </Pressable>
      </View>
      <Text variant="title">My journal</Text>
      <Gap size="md" />
      <TextInput
        accessibilityLabel="Search your journal"
        value={query}
        onChangeText={setQuery}
        placeholder="Search"
        placeholderTextColor={palettes.light.textMuted}
        style={styles.search}
      />
      <Gap size="md" />
      <Button label="New entry" onPress={() => router.push('/talk')} />
      <Gap />
      {shown.length === 0 ? (
        <Text tone="textMuted">{entries.length === 0 ? 'Nothing here yet. Tap New entry to start.' : 'No entries match your search.'}</Text>
      ) : (
        shown.map((e) => (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            accessibilityLabel={`Entry from ${formatDate(e.createdAt)}`}
            onPress={() => router.push({ pathname: '/journal/[id]', params: { id: String(e.id) } })}
            style={{ marginBottom: 10 }}
          >
            <Card>
              <View style={styles.meta}>
                <Text variant="bodySmall" tone="textMuted">
                  {formatDate(e.createdAt)}
                </Text>
                {e.kind === 'voice' ? <Ionicons name="mic-outline" size={14} color={p.textMuted} /> : null}
                {e.coachReply ? <Ionicons name="heart-outline" size={14} color={p.accent} /> : null}
              </View>
              <Gap size="xs" />
              <Text numberOfLines={2}>{e.body}</Text>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row' },
  iconButton: { width: 44, height: 44, justifyContent: 'center' },
  search: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D5DDD8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 16,
    color: palettes.light.text,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
