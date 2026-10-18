import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Button, Card, Gap, LinkRow, Screen, Text, usePalette } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { exportAll, setSetting, wipeEverything } from '@/lib/db';
import { openWeb } from '@/lib/links';
import { cancelAllNotifications, requestNotificationPermission } from '@/lib/notifications';
import { palettes, radius } from '@/lib/theme';
import { Alert } from '@/lib/alert';

// TODO(release): replace with your hosted privacy policy and terms pages.
const PRIVACY_URL = 'https://example.com/stay-clean/privacy';

function ToggleRow({ title, detail, value, onChange }: { title: string; detail: string; value: boolean; onChange: (v: boolean) => void }) {
  const p = usePalette();
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label">{title}</Text>
        <Text variant="bodySmall" tone="textMuted">
          {detail}
        </Text>
      </View>
      <Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ true: p.primary, false: '#C7D0CC' }} />
    </View>
  );
}

async function confirmWithDevice(prompt: string): Promise<boolean> {
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  if (level === LocalAuthentication.SecurityLevel.NONE) return true;
  return (await LocalAuthentication.authenticateAsync({ promptMessage: prompt })).success;
}

export default function Profile() {
  const { profile, settings, saveProfile, updateSettings, refresh } = useAppState();
  const [supportName, setSupportName] = useState(settings.supportName);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);

  if (!profile) return null;

  async function toggleLock(on: boolean) {
    if (on && !(await confirmWithDevice('Turn on App lock'))) return;
    if (!on && !(await confirmWithDevice('Turn off App lock'))) return;
    await updateSettings({ appLock: on });
  }

  async function exportData() {
    if (!(await confirmWithDevice('Export your data'))) return;
    const data = await exportAll();
    Alert.alert('Export your data', 'The export is not encrypted. Only save or send it somewhere you trust.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => void Share.share({ title: 'Stay Clean export', message: JSON.stringify(data, null, 2) }) },
    ]);
  }

  function deleteEverything() {
    Alert.alert('Delete everything?', 'This permanently deletes your counter, journal and settings from this phone. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            if (!(await confirmWithDevice('Delete all Stay Clean data'))) return;
            await cancelAllNotifications();
            await wipeEverything();
            await refresh();
          })(),
      },
    ]);
  }

  return (
    <Screen>
      <Text variant="title">Profile</Text>
      <Gap />

      <Text variant="caption" tone="textMuted">
        SUPPORT PERSON
      </Text>
      <Gap size="sm" />
      <Card>
        <Text variant="bodySmall" tone="textMuted">
          Someone you can text on a tough day: a sponsor, friend or family member.
        </Text>
        <Gap size="md" />
        <TextInput
          accessibilityLabel="Support person's name"
          value={supportName}
          onChangeText={setSupportName}
          placeholder="Name"
          placeholderTextColor={palettes.light.textMuted}
          style={styles.input}
          maxLength={60}
        />
        <Gap size="sm" />
        <TextInput
          accessibilityLabel="Support person's phone number"
          value={supportPhone}
          onChangeText={setSupportPhone}
          placeholder="Phone number"
          placeholderTextColor={palettes.light.textMuted}
          keyboardType="phone-pad"
          style={styles.input}
          maxLength={20}
        />
        <Gap size="md" />
        <Button variant="outline" label="Save support person" onPress={() => void updateSettings({ supportName, supportPhone })} />
      </Card>

      <Gap size="xl" />
      <Text variant="caption" tone="textMuted">
        PRIVACY
      </Text>
      <Gap size="sm" />
      <Card style={{ gap: 16 }}>
        <ToggleRow
          title="Recovery Companion replies"
          detail="Send what you write to our server and an AI model to get a supportive reply. Nothing is stored by us."
          value={profile.aiConsent}
          onChange={(aiConsent) => {
            void saveProfile({ ...profile, aiConsent });
            if (!aiConsent) {
              void setSetting('themes', null);
              void setSetting('themesUpdatedAt', null);
            }
          }}
        />
        <ToggleRow title="App lock" detail="Face ID, fingerprint or passcode to open the app." value={settings.appLock} onChange={(v) => void toggleLock(v)} />
        <ToggleRow
          title="Discreet notifications"
          detail='Notifications say "Daily check-in" and never mention recovery.'
          value={settings.discreet}
          onChange={(discreet) => void updateSettings({ discreet })}
        />
      </Card>

      <Gap size="xl" />
      <Text variant="caption" tone="textMuted">
        DAILY MESSAGE
      </Text>
      <Gap size="sm" />
      <Card>
        <View style={styles.toggleRow}>
          <Text variant="label" style={{ flex: 1 }}>
            Time: {settings.notifyHour}:00
          </Text>
          <Button
            variant="outline"
            label="−"
            accessibilityLabel="Earlier"
            onPress={() => void updateSettings({ notifyHour: (settings.notifyHour + 23) % 24 })}
            style={{ minWidth: 52 }}
          />
          <Button
            variant="outline"
            label="+"
            accessibilityLabel="Later"
            onPress={() => void updateSettings({ notifyHour: (settings.notifyHour + 1) % 24 })}
            style={{ minWidth: 52 }}
          />
        </View>
        <Gap size="sm" />
        <Button variant="ghost" label="Turn on notifications" onPress={() => void requestNotificationPermission().then(() => refresh())} />
      </Card>

      <Gap size="xl" />
      <Text variant="caption" tone="textMuted">
        YOUR DATA
      </Text>
      <Gap size="sm" />
      <Card style={{ paddingVertical: 4 }}>
        <LinkRow label="Get help now" detail="Crisis lines you can call or text" onPress={() => router.push('/crisis')} />
        <LinkRow label="Export my data" detail="A copy of everything stored on this phone" onPress={() => void exportData()} />
        <LinkRow label="Privacy policy" onPress={() => void openWeb(PRIVACY_URL)} last />
      </Card>
      <Gap />
      <Button variant="danger" label="Delete everything" onPress={deleteEverything} />

      <Gap size="xl" />
      <Text variant="bodySmall" tone="textMuted">
        Stay Clean is a self-help companion. It is not medical advice, therapy or an emergency service. If you are in danger, call 911. For
        withdrawal symptoms or medication questions, talk to a doctor.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D5DDD8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 16,
    color: palettes.light.text,
  },
});
