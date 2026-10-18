import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { useAppState } from '@/lib/app-state';
import { palettes } from '@/lib/theme';
import { Button, Text } from './ui';

const LOCK_AFTER_MS = 60_000;

/**
 * Hides everything behind Face ID / fingerprint / device passcode when the
 * person has turned on App lock, and blurs the app in the app switcher.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
  const { ready, settings } = useAppState();
  // Only matters while App lock is on; starts locked so nothing shows before Face ID.
  const [locked, setLocked] = useState(true);
  const backgroundedAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Stay Clean' });
    if (result.success) setLocked(false);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'ios') void ScreenCapture.enableAppSwitcherProtectionAsync(0.9).catch(() => undefined);
  }, []);

  // Prompt once at launch. Turning the lock on later should not lock the open app.
  const launched = useRef(false);
  useEffect(() => {
    if (!ready || launched.current) return;
    launched.current = true;
    // Runs once at launch. Unlock state is set from the Face ID result or, when
    // the lock is off, right away so turning it on later doesn't lock the open app.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (settings.appLock) void unlock();
    else setLocked(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready, settings.appLock, unlock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && settings.appLock && backgroundedAt.current !== null) {
        if (Date.now() - backgroundedAt.current > LOCK_AFTER_MS) {
          setLocked(true);
          void unlock();
        }
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, [settings.appLock, unlock]);

  if (!ready) return <View style={styles.cover} />;
  if (settings.appLock && locked) {
    return (
      <View style={[styles.cover, styles.center]}>
        <Text variant="title" style={{ color: palettes.dark.text, textAlign: 'center' }}>
          Stay Clean is locked
        </Text>
        <View style={{ height: 24 }} />
        <Button label="Unlock" onPress={() => void unlock()} style={{ backgroundColor: palettes.dark.primary, borderColor: palettes.dark.primary, minWidth: 200 }} />
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  cover: { flex: 1, backgroundColor: palettes.dark.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
});
