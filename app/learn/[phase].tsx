import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '../../src/components/Header';
import { Screen } from '../../src/components/Screen';
import type { CyclePhase } from '../../src/domain/cycle/cycleEngine';
import { colors, radius, spacing } from '../../src/theme';

const phases: CyclePhase[] = ['menstrual', 'follicular', 'mid_cycle', 'luteal'];

export default function LearnScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ phase?: string }>();
  const phase: CyclePhase = phases.includes(params.phase as CyclePhase) ? params.phase as CyclePhase : 'luteal';
  return <Screen><Header title={t('learn.title')} /><View style={styles.card}><Text style={styles.heading}>{t(`learn.${phase}.heading`)}</Text><Text style={styles.body}>{t(`learn.${phase}.body`)}</Text></View><Text style={styles.source}>{t('learn.noSources')}</Text></Screen>;
}

const styles = StyleSheet.create({ card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }, heading: { color: colors.text, fontSize: 28, fontWeight: '800' }, body: { color: colors.text, fontSize: 17, lineHeight: 27 }, source: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: spacing.lg } });
