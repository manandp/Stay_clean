import { useSyncExternalStore } from 'react';
import { Modal, StyleSheet, View, type AlertButton } from 'react-native';
import { palettes, radius } from '@/lib/theme';
import { Button, Text } from './ui';

/**
 * In-page dialogs for the browser demo. Browsers embedded in other pages
 * often block window.alert and window.confirm, so the demo draws its own.
 */

interface Dialog {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

let current: Dialog | null = null;
const listeners = new Set<() => void>();

function set(next: Dialog | null): void {
  current = next;
  listeners.forEach((l) => l());
}

export function showDialog(title: string, message?: string, buttons?: AlertButton[]): void {
  set({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function DialogHost() {
  const dialog = useSyncExternalStore(subscribe, () => current);
  if (!dialog) return null;
  const p = palettes.light;
  const press = (b: AlertButton) => {
    set(null);
    b.onPress?.();
  };
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => set(null)}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: p.surface }]} accessibilityRole="alert">
          <Text variant="heading">{dialog.title}</Text>
          {dialog.message ? <Text tone="textSecondary">{dialog.message}</Text> : null}
          <View style={styles.buttons}>
            {dialog.buttons.map((b) => (
              <Button
                key={b.text}
                label={b.text ?? 'OK'}
                variant={b.style === 'cancel' ? 'ghost' : 'primary'}
                onPress={() => press(b)}
                style={b.style === 'destructive' ? { backgroundColor: p.danger, borderColor: p.danger } : undefined}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,27,41,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: radius.lg, padding: 20, gap: 12 },
  buttons: { gap: 8, marginTop: 4 },
});
