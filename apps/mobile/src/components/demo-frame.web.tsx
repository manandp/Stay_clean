import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { palettes } from '@/lib/theme';
import { Text } from './ui';
import { DialogHost } from './web-dialog';

/**
 * Browser demo: shows the app at phone width with a note that this is a demo,
 * so nobody mistakes it for the private, encrypted phone app.
 */
export function DemoFrame({ children }: { children: ReactNode }) {
  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <View style={styles.banner} accessibilityRole="summary">
          <Text variant="caption" style={styles.bannerText}>
            Demo. Your entries stay in this browser only and are not encrypted. AI replies and reminders work in the phone app.
          </Text>
        </View>
        <View style={styles.content}>{children}</View>
        <DialogHost />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#E4E8E6', alignItems: 'center' },
  phone: { flex: 1, width: '100%', maxWidth: 440, backgroundColor: palettes.dark.background, overflow: 'hidden' },
  banner: { backgroundColor: '#FFE8A3', paddingHorizontal: 12, paddingVertical: 6 },
  bannerText: { color: '#3D3200', textAlign: 'center' },
  // minHeight 0 lets the app shrink to fit under the banner instead of overflowing.
  content: { flex: 1, minHeight: 0 },
});
