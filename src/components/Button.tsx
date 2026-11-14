import { useEffect } from 'react';
import { Animated, Pressable, StyleSheet, useAnimatedValue, type PressableProps } from 'react-native';

import { useApp } from '../context/AppContext';
import { spacing, type Palette } from '../theme';
import { typographyForLanguage } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { AppText as Text } from './AppText';

export function Button({
  label, variant = 'primary', disabled, onPressIn, onPressOut, accessibilityState, style, ...props
}: PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const { colors } = useTheme();
  const { preferences } = useApp();
  const styles = makeStyles(colors);
  const pressed = useAnimatedValue(0);
  const animatePress = (value: number) => {
    pressed.stopAnimation();
    Animated.timing(pressed, { toValue: value, duration: value ? 100 : 160, useNativeDriver: true }).start();
  };
  useEffect(() => () => pressed.stopAnimation(), [pressed]);
  return <Pressable
    accessibilityRole="button"
    accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
    disabled={disabled}
    onPressIn={event => { animatePress(1); onPressIn?.(event); }}
    onPressOut={event => { animatePress(0); onPressOut?.(event); }}
    style={state => [
      styles.base, styles[variant], disabled && (variant === 'primary' ? styles.disabledPrimary : styles.disabledSecondary),
      typeof style === 'function' ? style(state) : style,
    ]}
    {...props}
  >
    {variant === 'primary' && !disabled ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pressFill, { opacity: pressed }]} /> : null}
    <Text style={[styles.label, typographyForLanguage(preferences.language), variant !== 'primary' && styles.secondaryLabel]}>
      {label}
    </Text>
  </Pressable>;
}
const makeStyles = (colors: Palette) => StyleSheet.create({
  base: { minHeight: 54, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  primary: { backgroundColor: colors.button },
  secondary: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  label: { color: colors.buttonText, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  secondaryLabel: { color: colors.primary },
  pressFill: { backgroundColor: colors.buttonPressed, borderRadius: 20 },
  disabledPrimary: { backgroundColor: colors.buttonDisabled },
  disabledSecondary: { opacity: 0.5 },
});
