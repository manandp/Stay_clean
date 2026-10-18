import Ionicons from '@expo/vector-icons/Ionicons';
import { screenForRisk } from '@stay-clean/shared';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Gap, LinkRow, Screen, Text, usePalette } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAppState } from '@/lib/app-state';
import { addEntry, setCoachReply, setSetting } from '@/lib/db';
import { textNumber } from '@/lib/links';
import { palettes, radius } from '@/lib/theme';
import { useDictation } from '@/lib/use-dictation';

const MOODS = ['Very low', 'Low', 'Okay', 'Good', 'Great'];

export default function Talk() {
  usePreventScreenCapture();
  const p = usePalette();
  const { profile, settings, supportContext } = useAppState();
  const [text, setText] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [usedVoice, setUsedVoice] = useState(false);
  const [state, setState] = useState<'writing' | 'sending' | 'replied'>('writing');
  const [reply, setReply] = useState<string | null>(null);
  const dictation = useDictation((t) => {
    setText(t);
    setUsedVoice(true);
  });

  async function send() {
    const body = text.trim();
    if (!body || !profile) return;
    if (dictation.listening) dictation.stop();
    setState('sending');
    const id = await addEntry({ kind: usedVoice ? 'voice' : 'text', body, mood });
    await setSetting('themesDirty', '1');

    // Checked on the phone first so crisis help appears even with no connection.
    if (screenForRisk(body) === 'imminent') {
      setState('replied');
      router.push({ pathname: '/crisis', params: { fromCoach: '1' } });
      return;
    }

    const ctx = await supportContext();
    if (!ctx) {
      setReply('Saved privately on your phone. To get a reply from your Recovery Companion, turn on replies in Profile.');
      setState('replied');
      return;
    }
    try {
      const res = await api.coach({ ...ctx, entry: body });
      if (res.crisis) {
        setState('replied');
        router.push({ pathname: '/crisis', params: { fromCoach: '1' } });
        return;
      }
      await setCoachReply(id, res.message);
      setReply(res.message);
    } catch (e) {
      const offline = e instanceof ApiError && e.kind === 'offline';
      setReply(
        offline
          ? "Your entry is saved. You're offline right now, so try a breathing exercise or reach out to someone, and check back for a reply later."
          : "Your entry is saved. Your Recovery Companion can't reply right now. Take a slow breath, drink some water, and reach out to someone in your corner.",
      );
    }
    setState('replied');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-down" size={26} color={p.text} />
          </Pressable>
          <View style={styles.lockNote}>
            <Ionicons name="lock-closed-outline" size={12} color={p.textMuted} />
            <Text variant="bodySmall" tone="textMuted" style={{ fontSize: 12 }}>
              Encrypted on this phone
            </Text>
          </View>
        </View>
        <Text variant="caption" tone="accent">
          PRIVATE RECOVERY SPACE
        </Text>
        <Gap size="sm" />
        <Text variant="title">Talk about what's on your mind.</Text>
        <Gap size="xs" />
        <Text tone="textMuted">This is your space to share without judgment.</Text>
        <Gap />

        <View style={styles.moods} accessibilityRole="radiogroup" accessibilityLabel="How are you feeling?">
          {MOODS.map((label, i) => {
            const selected = mood === i + 1;
            return (
              <Pressable
                key={label}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                onPress={() => setMood(i + 1)}
                style={[styles.mood, { borderColor: selected ? p.primary : '#D5DDD8', backgroundColor: selected ? p.surfaceAlt : p.surface }]}
              >
                <Text variant="label" tone={selected ? 'accent' : 'textMuted'}>
                  {i + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Gap size="md" />

        <View style={[styles.inputCard, { borderColor: p.border, backgroundColor: p.surface }]}>
          <TextInput
            accessibilityLabel="Write what's on your mind"
            value={text}
            onChangeText={setText}
            editable={state === 'writing'}
            multiline
            maxLength={4000}
            placeholder="I've been feeling..."
            placeholderTextColor={palettes.light.textMuted}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dictation.listening ? 'Stop voice input' : 'Speak instead of typing'}
            onPress={() => (dictation.listening ? dictation.stop() : void dictation.start(text))}
            disabled={state !== 'writing'}
            style={[styles.mic, dictation.listening && { backgroundColor: p.surfaceAlt }]}
          >
            <Ionicons name={dictation.listening ? 'stop-circle' : 'mic-outline'} size={22} color={p.accent} />
          </Pressable>
        </View>

        {state === 'writing' ? (
          <>
            <Gap size="md" />
            <Button label="Share" disabled={!text.trim()} onPress={() => void send()} />
          </>
        ) : null}

        {state === 'sending' ? (
          <View style={styles.sending}>
            <ActivityIndicator color={p.accent} />
            <Text tone="textMuted">Your Recovery Companion is listening...</Text>
          </View>
        ) : null}

        {reply ? (
          <>
            <Gap />
            <Card tone="surfaceAlt" style={{ borderWidth: 0 }}>
              <View style={styles.companionTitle}>
                <Ionicons name="heart-outline" size={20} color={p.accent} />
                <Text variant="label">Recovery Companion</Text>
              </View>
              <Gap size="sm" />
              <Text>{reply}</Text>
            </Card>
            <Gap />
            <Card style={{ paddingVertical: 8 }}>
              <Text variant="label">What would help right now?</Text>
              <LinkRow label="Try a grounding exercise" onPress={() => router.replace('/tough-day')} />
              <LinkRow label="Review my recovery plan" onPress={() => router.replace('/(tabs)/resources')} />
              <LinkRow
                label={settings.supportName ? `Text ${settings.supportName}` : 'Contact my support person'}
                detail={settings.supportPhone ? undefined : 'Add someone in Profile'}
                onPress={() => (settings.supportPhone ? void textNumber(settings.supportPhone) : router.replace('/(tabs)/profile'))}
                last
              />
            </Card>
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconButton: { width: 44, height: 44, justifyContent: 'center' },
  lockNote: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  moods: { flexDirection: 'row', gap: 8 },
  mood: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  inputCard: { borderRadius: radius.md, borderWidth: 1, padding: 14, paddingBottom: 52 },
  input: { minHeight: 110, fontSize: 16, lineHeight: 24, color: palettes.light.text, textAlignVertical: 'top' },
  mic: { position: 'absolute', right: 6, bottom: 6, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sending: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20 },
  companionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
