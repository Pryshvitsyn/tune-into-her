import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useApp } from '../context/AppContext';
import { spacing, type Palette } from '../theme';
import { typographyForLanguage } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { AppText as Text } from './AppText';

export function NumberStepper({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange(value: number): void;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { preferences } = useApp();
  const type = typographyForLanguage(preferences.language);
  const { t } = useTranslation();
  return <View style={styles.row}>
    <View style={styles.description}>
      <Text style={[styles.label, type]}>{label}</Text>
      <Text style={[styles.value, type]}>{t('common.days', { count: value })}</Text>
    </View>
    <View style={styles.controls}>
      {([-1, 1] as const).map(direction => {
        const disabled = direction === -1 ? value <= min : value >= max;
        return <Pressable key={direction} accessibilityRole="button"
          accessibilityLabel={t(direction === -1 ? 'accessibility.decrease' : 'accessibility.increase', { label })}
          accessibilityState={{ disabled }} disabled={disabled} onPress={() => onChange(value + direction)}
          style={({ pressed }) => [styles.control, disabled && styles.disabled, pressed && styles.pressed]}>
          <Text allowFontScaling={false} style={[styles.symbol, type]}>{direction === -1 ? '−' : '+'}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}
const makeStyles = (colors: Palette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingVertical: 18 },
  description: { flex: 1 },
  label: { color: colors.secondary, fontSize: 16, lineHeight: 23 },
  value: { color: colors.text, fontSize: 21, lineHeight: 28, marginTop: 4 },
  controls: { flexDirection: 'row', gap: spacing.sm },
  control: { width: 48, height: 48, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 27, lineHeight: 33, color: colors.primary },
  disabled: { opacity: 0.4 },
  pressed: { backgroundColor: colors.pickerSelection },
});
