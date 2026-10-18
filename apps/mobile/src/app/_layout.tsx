import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AppLockGate } from '@/components/app-lock';
import { DemoFrame } from '@/components/demo-frame';
import { AppStateProvider, useAppState } from '@/lib/app-state';

void SplashScreen.preventAutoHideAsync();

/** The URL the browser demo was opened at, before the router changes it. */
const initialWebPath = Platform.OS === 'web' ? window.location.pathname : '/';

function RootStack() {
  const { ready, profile } = useAppState();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  const onboarded = !!profile;
  const pathname = usePathname();

  // In the browser the page opens at whatever URL was loaded, so send people
  // to the screen they can actually use. The phone apps start there already.
  useEffect(() => {
    if (Platform.OS !== 'web' || !ready) return;
    const inOnboarding = pathname.startsWith('/onboarding');
    if (!onboarded && !inOnboarding && initialWebPath !== '/crisis') router.replace('/onboarding');
    if (onboarded && inOnboarding) router.replace('/');
  }, [ready, onboarded, pathname]);
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="talk" options={{ presentation: 'modal' }} />
          <Stack.Screen name="tough-day" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="journal" />
        </Stack.Protected>
        <Stack.Screen name="crisis" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <DemoFrame>
      <AppStateProvider>
        <AppLockGate>
          <RootStack />
        </AppLockGate>
      </AppStateProvider>
    </DemoFrame>
  );
}
