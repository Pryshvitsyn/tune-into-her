import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { NumberStepper } from '../src/components/NumberStepper';
import { Screen } from '../src/components/Screen';
import { useApp } from '../src/context/AppContext';
import { dateOnlyToLocalDate, toDateOnly } from '../src/domain/cycle/dateOnly';
import { colors, radius, spacing } from '../src/theme';

export default function CycleScreen() {
  const { t } = useTranslation();
  const { cycleSettings, setCycleSettings } = useApp();
  const [date, setDate] = useState(cycleSettings ? dateOnlyToLocalDate(cycleSettings.lastKnownPeriodStart) : new Date());
  const [cycleLength, setCycleLength] = useState(cycleSettings?.typicalCycleLength ?? 28);
  const [periodLength, setPeriodLength] = useState(cycleSettings?.typicalPeriodLength ?? 5);
  const save = async () => { try { await setCycleSettings({ lastKnownPeriodStart: toDateOnly(date), typicalCycleLength: cycleLength, typicalPeriodLength: periodLength }); Alert.alert(t('cycle.saved')); router.back(); } catch { Alert.alert(t('cycle.saveError')); } };
  return <Screen footer={<Button label={t('common.save')} onPress={() => void save()} />}><Header title={t('cycle.title')} /><Text style={styles.label}>{t('cycle.lastPeriod')}</Text><View style={styles.picker}><DateTimePicker value={date} mode="date" display="spinner" maximumDate={new Date()} onChange={(_, value) => value && setDate(value)} /></View><View style={styles.gap} /><NumberStepper label={t('onboarding.cycleLength')} value={cycleLength} min={15} max={90} onChange={setCycleLength} /><NumberStepper label={t('onboarding.periodLength')} value={periodLength} min={1} max={Math.min(20, cycleLength - 1)} onChange={setPeriodLength} /></Screen>;
}
const styles = StyleSheet.create({ label: { color: colors.secondary, fontSize: 13, fontWeight: '700', marginBottom: spacing.sm }, picker: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.sm }, gap: { height: spacing.lg } });
