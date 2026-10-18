import { createContext, useContext, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextProps as RNTextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palettes, radius, space, type, type Palette, type PaletteName } from '@/lib/theme';

const PaletteContext = createContext<Palette>(palettes.light);

export function usePalette(): Palette {
  return useContext(PaletteContext);
}

export function Screen({
  palette = 'light',
  children,
  scroll = true,
  contentStyle,
}: {
  palette?: PaletteName;
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const p = palettes[palette];
  const inner = [styles.screenContent, contentStyle];
  return (
    <PaletteContext.Provider value={p}>
      <SafeAreaView style={[styles.fill, { backgroundColor: p.background }]} edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView contentContainerStyle={inner} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, inner]}>{children}</View>
        )}
      </SafeAreaView>
    </PaletteContext.Provider>
  );
}

type Variant = keyof typeof type;

export function Text({
  variant = 'body',
  tone = 'text',
  style,
  ...rest
}: RNTextProps & { variant?: Variant; tone?: 'text' | 'textSecondary' | 'textMuted' | 'accent' | 'danger' | 'onPrimary' }) {
  const p = usePalette();
  return <RNText {...rest} style={[type[variant], { color: p[tone] }, style]} />;
}

export function Card({ children, tone = 'surface', style }: { children: ReactNode; tone?: 'surface' | 'surfaceAlt'; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return <View style={[styles.card, { backgroundColor: p[tone], borderColor: p.border }, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  accessibilityHint,
  disabled,
  loading,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  const bg = { primary: p.primary, secondary: p.surface, outline: 'transparent', danger: 'transparent', ghost: 'transparent' }[variant];
  const fg = { primary: p.onPrimary, secondary: p.text, outline: p.accent, danger: p.danger, ghost: p.accent }[variant];
  const border = variant === 'outline' ? p.accent : variant === 'danger' ? p.dangerBorder : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon}
      <RNText style={[type.label, { color: fg, textAlign: 'center' }]}>{label}</RNText>
    </Pressable>
  );
}

export function LinkRow({ label, detail, onPress, last }: { label: string; detail?: string; onPress: () => void; last?: boolean }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, !last && { borderBottomWidth: 1, borderBottomColor: p.border }, pressed && { opacity: 0.7 }]}
    >
      <Text variant="label" tone="accent">
        {label}
      </Text>
      {detail ? (
        <Text variant="bodySmall" tone="textMuted">
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function Gap({ size = 'lg' }: { size?: keyof typeof space }) {
  return <View style={{ height: space[size] }} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screenContent: { padding: space.xl, paddingBottom: space.xxxl },
  card: { borderRadius: radius.md, padding: space.lg, borderWidth: StyleSheet.hairlineWidth },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
    borderWidth: 1,
  },
  linkRow: { minHeight: 48, paddingVertical: space.md, justifyContent: 'center', gap: 2 },
});
