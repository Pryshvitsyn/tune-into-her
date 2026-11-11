import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Header } from '../../src/components/Header';
import { NumberStepper } from '../../src/components/NumberStepper';
import { Screen } from '../../src/components/Screen';
import { useApp } from '../../src/context/AppContext';
import { dateOnlyToLocalDate, toDateOnly } from '../../src/domain/cycle/dateOnly';
import { colors, radius, spacing } from '../../src/theme';

export default function CycleSettingsScreen() {
  const { t } = useTranslation();
  const { cycleSettings, setCycleSettings } = useApp();
  const [date, setDate] = useState(cycleSettings ? dateOnlyToLocalDate(cycleSettings.lastKnownPeriodStart) : new Date());
  const [cycleLength, setCycleLength] = useState(cycleSettings?.typicalCycleLength ?? 28);
  const [periodLength, setPeriodLength] = useState(cycleSettings?.typicalPeriodLength ?? 5);
  const regularity = cycleSettings?.regularity ?? 'regular';
  const save = async () => { try { await setCycleSettings({ lastKnownPeriodStart: toDateOnly(date), typicalCycleLength: cycleLength, typicalPeriodLength: periodLength, regularity }); Alert.alert(t('cycleSettings.saved')); router.back(); } catch { Alert.alert(t('cycleSettings.saveError')); } };
  return <Screen footer={<Button label={t('common.save')} onPress={() => void save()} />}><Header title={t('cycleSettings.partner')} /><Text style={styles.label}>{t('cycleSettings.lastPeriod')}</Text><View style={styles.picker}><DateTimePicker value={date} mode="date" display="spinner" maximumDate={new Date()} onChange={(_, value) => value && setDate(value)} /></View><NumberStepper label={t('cycleSettings.typicalCycle')} value={cycleLength} min={21} max={40} onChange={setCycleLength} /><NumberStepper label={t('cycleSettings.periodLength')} value={periodLength} min={2} max={Math.min(10, cycleLength - 1)} onChange={setPeriodLength} /><Text style={styles.regularity}>{t('cycleSettings.regularity')}: {regularity === 'regular' ? t('onboardingV2.regular') : regularity === 'varies' ? t('onboardingV2.varies') : t('onboardingV2.unknown')}</Text></Screen>;
}
const styles = StyleSheet.create({ label: { color: colors.secondary, fontSize: 13, fontWeight: '700', marginBottom: spacing.sm }, picker: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.lg }, regularity: { color: colors.secondary, fontSize: 15, marginTop: spacing.lg } });
