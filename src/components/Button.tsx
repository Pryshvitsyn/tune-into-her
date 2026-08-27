import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, radius, spacing } from '../theme';

export function Button({ label, variant = 'primary', disabled, ...props }: PressableProps & { label: string; variant?: 'primary' | 'secondary' | 'ghost' }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, disabled && styles.disabled]} {...props}>
      <Text maxFontSizeMultiplier={1.6} style={[styles.label, variant !== 'primary' && styles.darkLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({ base: { minHeight: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg }, primary: { backgroundColor: colors.primary }, secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, ghost: { backgroundColor: 'transparent' }, label: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, darkLabel: { color: colors.text }, pressed: { opacity: 0.75 }, disabled: { opacity: 0.45 } });
