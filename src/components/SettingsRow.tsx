import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

export function SettingsRow({ label, value, onPress, danger = false }: { label: string; value?: string; onPress(): void; danger?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}><View style={styles.copy}><Text style={[styles.label, danger && styles.danger]}>{label}</Text>{value ? <Text style={styles.value}>{value}</Text> : null}</View><Text style={styles.chevron}>›</Text></Pressable>;
}

const styles = StyleSheet.create({ row: { minHeight: 64, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, copy: { flex: 1 }, label: { color: colors.text, fontSize: 17 }, danger: { color: colors.danger }, value: { color: colors.secondary, fontSize: 13, marginTop: 3 }, chevron: { color: colors.secondary, fontSize: 27 } });
