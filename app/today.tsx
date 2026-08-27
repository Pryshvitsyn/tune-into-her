import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { Screen } from '../src/components/Screen';
import brand from '../src/config/brand.json';
import { useApp } from '../src/context/AppContext';
import { getLocalizedCue } from '../src/domain/content/contentRepository';
import { selectDailyCue } from '../src/domain/content/dailyCueService';
import { estimateCycle, type CyclePhase } from '../src/domain/cycle/cycleEngine';
import { toDateOnly } from '../src/domain/cycle/dateOnly';
import { AsyncSelectionStore } from '../src/storage/AsyncSelectionStore';
import { colors, radius, spacing } from '../src/theme';

const selectionStore = new AsyncSelectionStore();
const phaseColors: Record<CyclePhase, string> = { menstrual: colors.rose, follicular: colors.sage, mid_cycle: colors.lavender, luteal: colors.sand };

export default function TodayScreen() {
  const { t } = useTranslation();
  const { cycleSettings, preferences, entitlement } = useApp();
  const [cueId, setCueId] = useState<string | null>(null);
  const today = toDateOnly(new Date());
  const estimate = useMemo(() => cycleSettings ? estimateCycle({ ...cycleSettings, currentLocalDate: today }) : null, [cycleSettings, today]);
  useEffect(() => {
    if (cycleSettings && estimate) void selectDailyCue({ date: today, phase: estimate.estimatedPhase, settings: cycleSettings, store: selectionStore }).then(setCueId);
  }, [cycleSettings, estimate, today]);

  if (!cycleSettings || !estimate) return null;
  const cue = cueId ? getLocalizedCue(preferences.language, cueId) : null;
  return (
    <Screen>
      <View style={styles.header}><Text style={styles.wordmark}>{brand.displayName}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('today.settings')} onPress={() => router.push('/settings')} style={styles.settings}><Text style={styles.settingsText}>•••</Text></Pressable></View>
      <View style={styles.hero}><View accessible accessibilityLabel={t('accessibility.phaseIndicator', { phase: t(`phase.${estimate.estimatedPhase}`) })} style={[styles.phaseDot, { backgroundColor: phaseColors[estimate.estimatedPhase] }]} /><Text style={styles.day}>{t('today.day', { day: estimate.estimatedCycleDay })}</Text><Text style={styles.phase}>{t('today.approxPhase', { phase: t(`phase.${estimate.estimatedPhase}`) })}</Text></View>
      {!entitlement.isActive ? <View style={styles.locked}><Text style={styles.lockedTitle}>{t('today.lockedTitle')}</Text><Text style={styles.context}>{t('today.lockedBody')}</Text><Button label={t('today.unlock')} onPress={() => router.push('/paywall')} /></View> :
        <View style={styles.card}>
          {!cue ? <ActivityIndicator color={colors.primary} /> : <>
            <Text style={styles.label}>{t('today.today')}</Text>
            <Text style={styles.context}>{estimate.isProjectedNewCycleBoundary ? t('today.newCycle') : cue.context}</Text>
            {!estimate.isProjectedNewCycleBoundary ? <><View style={styles.divider} /><Text style={styles.label}>{t('today.goodMove')}</Text><Text style={styles.cue}>{cue.cue}</Text></> : null}
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/learn/[phase]', params: { phase: estimate.estimatedPhase } })} style={styles.learn}><Text style={styles.learnText}>{t('today.learnMore')} →</Text></Pressable>
          </>}
        </View>}
      <Text style={styles.estimate}>{t('today.estimated')}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/cycle')} style={styles.update}><Text style={styles.updateText}>{t('today.update')}</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, wordmark: { color: colors.primary, fontSize: 18, fontWeight: '800', letterSpacing: 1 }, settings: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, settingsText: { color: colors.text, fontSize: 18, letterSpacing: 2 }, hero: { alignItems: 'center', paddingVertical: spacing.xl }, phaseDot: { width: 10, height: 10, borderRadius: 5, marginBottom: spacing.md }, day: { color: colors.text, fontSize: 48, fontWeight: '900', letterSpacing: 1 }, phase: { color: colors.secondary, fontSize: 15, marginTop: spacing.xs }, card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, minHeight: 290, gap: spacing.sm, shadowColor: '#3E443F', shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 2 }, locked: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg }, lockedTitle: { color: colors.text, fontSize: 26, fontWeight: '800' }, label: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }, context: { color: colors.text, fontSize: 19, lineHeight: 28 }, cue: { color: colors.text, fontSize: 23, lineHeight: 32, fontWeight: '700' }, divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md }, learn: { minHeight: 48, justifyContent: 'center', marginTop: 'auto' }, learnText: { color: colors.primary, fontSize: 16, fontWeight: '800' }, estimate: { color: colors.secondary, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: spacing.md }, update: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, updateText: { color: colors.primary, fontWeight: '700' } });
