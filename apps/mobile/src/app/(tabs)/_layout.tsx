import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { palettes } from '@/lib/theme';

function icon(name: keyof typeof Ionicons.glyphMap) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };
}

export default function TabsLayout() {
  const p = palettes.dark;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: p.background, borderTopColor: p.border },
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: '#C3CED3',
        tabBarLabelStyle: { fontSize: 13 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="resources" options={{ title: 'Resources', tabBarIcon: icon('heart-outline') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('trending-up-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}
