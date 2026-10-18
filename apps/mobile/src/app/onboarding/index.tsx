import { router } from 'expo-router';
import { View } from 'react-native';
import { OnboardingHeader } from '@/components/onboarding-header';
import { Button, Gap, Screen, Text } from '@/components/ui';

export default function Welcome() {
  return (
    <Screen contentStyle={{ flexGrow: 1 }}>
      <OnboardingHeader step={1} total={4} back={false} />
      <Text variant="caption" tone="accent">
        STAY CLEAN
      </Text>
      <Gap size="sm" />
      <Text variant="title">A private companion for your recovery.</Text>
      <Gap />
      <Text tone="textMuted">
        Count your clean days, get daily encouragement, talk through hard moments, and find real help when you need it.
      </Text>
      <Gap />
      <Text tone="textMuted">
        Everything you write stays encrypted on this phone. Stay Clean supports your recovery, but it is not a doctor, a therapist or an emergency
        service.
      </Text>
      <View style={{ flex: 1, minHeight: 32 }} />
      <Button label="Get started" onPress={() => router.push('/onboarding/addiction')} />
      <Gap size="md" />
      <Button variant="ghost" label="Need help right now? Get crisis support" onPress={() => router.push('/crisis')} />
    </Screen>
  );
}
