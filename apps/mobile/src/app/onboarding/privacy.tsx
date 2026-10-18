import { localDateKey } from '@stay-clean/shared';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { OnboardingHeader } from '@/components/onboarding-header';
import { Button, Card, Gap, Screen, Text, usePalette } from '@/components/ui';
import { currentTimeZone, todayKey, useAppState } from '@/lib/app-state';
import { requestNotificationPermission } from '@/lib/notifications';
import { useOnboardingDraft } from '@/lib/onboarding-draft';

function ToggleRow({ title, detail, value, onChange }: { title: string; detail: string; value: boolean; onChange: (v: boolean) => void }) {
  const p = usePalette();
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="label">{title}</Text>
        <Text variant="bodySmall" tone="textMuted">
          {detail}
        </Text>
      </View>
      <Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ true: p.primary, false: '#C7D0CC' }} />
    </View>
  );
}

export default function PrivacyAndSetup() {
  const [draft] = useOnboardingDraft();
  const { saveProfile, updateSettings, settings } = useAppState();
  const [aiConsent, setAiConsent] = useState(false);
  const [appLock, setAppLock] = useState(false);
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  async function toggleLock(on: boolean) {
    if (!on) return setAppLock(false);
    const enrolled = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
    if (!enrolled) {
      // Device passcode still works as a fallback.
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) return;
    }
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Turn on App lock' });
    setAppLock(result.success);
  }

  async function finish() {
    if (!draft.addiction) return;
    setSaving(true);
    try {
      if (notify) await requestNotificationPermission();
      await updateSettings({ ...settings, appLock });
      const started = draft.start === 'past' && draft.pastDays !== null ? new Date(Date.now() - draft.pastDays * 86_400_000) : new Date();
      await saveProfile({
        addiction: draft.addiction,
        substance: draft.addiction === 'drugs' ? draft.substance : null,
        otherLabel: draft.addiction === 'other' ? draft.otherLabel.trim() : null,
        status: draft.start === 'preparing' ? 'preparing' : 'active',
        startDate: draft.start === 'preparing' ? null : draft.start === 'past' ? localDateKey(started, currentTimeZone()) : todayKey(),
        startedAt: draft.start === 'preparing' ? null : started.toISOString(),
        aiConsent,
      });
      router.replace(draft.start === 'preparing' ? '/(tabs)/resources' : '/(tabs)');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <OnboardingHeader step={4} total={4} />
      <Text variant="title">Your privacy comes first</Text>
      <Gap size="sm" />
      <Text tone="textMuted">Your journal and progress are encrypted and stored only on this phone. There is no account and no one else can read them.</Text>
      <Gap size="xl" />
      <Card>
        <ToggleRow
          title="Replies from your Recovery Companion"
          detail="When you ask for a reply, what you wrote is sent securely to our server and an AI model, used once to write a response, and not stored by us. You can use everything else without this."
          value={aiConsent}
          onChange={setAiConsent}
        />
      </Card>
      <Gap size="md" />
      <Card>
        <ToggleRow title="App lock" detail="Require Face ID, fingerprint or your passcode to open Stay Clean." value={appLock} onChange={(v) => void toggleLock(v)} />
      </Card>
      <Gap size="md" />
      <Card>
        <ToggleRow title="Daily encouragement" detail="A short message each morning. You can make it discreet in Profile." value={notify} onChange={setNotify} />
      </Card>
      <Gap size="xxl" />
      <Button label="Finish setup" loading={saving} onPress={() => void finish()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
