import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

export function NumberStepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange(value: number): void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View><Text style={styles.label}>{label}</Text><Text style={styles.value}>{t('common.days', { count: value })}</Text></View>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('accessibility.decrease', { label })} disabled={value <= min} onPress={() => onChange(value - 1)} style={styles.control}><Text style={styles.symbol}>−</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('accessibility.increase', { label })} disabled={value >= max} onPress={() => onChange(value + 1)} style={styles.control}><Text style={styles.symbol}>+</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }, label: { color: colors.secondary, fontSize: 14 }, value: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 3 }, controls: { flexDirection: 'row', gap: spacing.sm }, control: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' }, symbol: { fontSize: 26, color: colors.text } });
