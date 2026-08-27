import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

export function Header({ title, back = true }: { title: string; back?: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {back ? <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={10} onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable> : <View style={styles.back} />}
      <Text style={styles.title}>{title}</Text><View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({ row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }, back: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, backText: { fontSize: 38, lineHeight: 40, color: colors.text }, title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text } });
