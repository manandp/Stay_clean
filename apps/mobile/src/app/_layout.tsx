import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppLockGate } from '@/components/app-lock';
import { AppStateProvider, useAppState } from '@/lib/app-state';

void SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { ready, profile } = useAppState();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  const onboarded = !!profile;
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
    <AppStateProvider>
      <AppLockGate>
        <RootStack />
      </AppLockGate>
    </AppStateProvider>
  );
}
