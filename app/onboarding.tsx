import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { NumberStepper } from '../src/components/NumberStepper';
import { PaywallCard } from '../src/components/PaywallCard';
import { PhaseSphere } from '../src/components/PhaseSphere';
import { Screen } from '../src/components/Screen';
import brand from '../src/config/brand.json';
import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import { useApp, notificationScheduler } from '../src/context/AppContext';
import { getCatalog, getLocalizedCue } from '../src/domain/content/contentRepository';
import { estimateCycle } from '../src/domain/cycle/cycleEngine';
import { toDateOnly } from '../src/domain/cycle/dateOnly';
import releaseCopy from '../src/i18n/releaseCopy.json';
import { colors, radius, spacing } from '../src/theme';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { preferences, updatePreferences, setCycleSettings } = useApp();
  const [step, setStep] = useState(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [date, setDate] = useState(new Date());
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState(() => { const value = new Date(); value.setHours(8, 30, 0, 0); return value; });
  const settings = useMemo(() => ({ lastKnownPeriodStart: toDateOnly(date), typicalCycleLength: cycleLength, typicalPeriodLength: periodLength }), [date, cycleLength, periodLength]);
  const estimate = useMemo(() => estimateCycle({ ...settings, currentLocalDate: toDateOnly(new Date()) }), [settings]);
  const previewCue = getLocalizedCue(preferences.language, getCatalog().find((item) => item.phases.includes(estimate.estimatedPhase))?.id ?? 'luteal_001');

  const next = async () => {
    if (step === 2 && !acknowledged) { Alert.alert(t('onboarding.required')); return; }
    if (step === 5) await setCycleSettings(settings);
    setStep((current) => Math.min(7, current + 1));
  };
  const finish = async () => {
    let enabled = reminderEnabled;
    if (enabled) enabled = await notificationScheduler.requestPermission();
    await updatePreferences({ onboardingComplete: true, reminderEnabled: enabled, reminderHour: reminderTime.getHours(), reminderMinute: reminderTime.getMinutes() }, true);
    router.replace('/today');
  };

  return (
    <Screen footer={step < 6 ? <View style={styles.footer}>{step > 1 ? <Button label={t('common.back')} variant="ghost" onPress={() => setStep(step - 1)} /> : null}<Button label={t('common.continue')} onPress={() => void next()} /></View> : undefined}>
      <View style={styles.progress}><View style={[styles.progressFill, { width: `${(step / 7) * 100}%` }]} /></View>
      {step === 1 ? <View style={styles.center}><Text style={styles.wordmark}>{brand.displayName}</Text><PhaseSphere small /><Text style={styles.hero}>{t('onboarding.welcomeTitle')}</Text><Text style={styles.body}>{t('onboarding.welcomeBody')}</Text>{preferences.language === 'mbf' ? <Text style={styles.noteText}>{releaseCopy.mbf.beta}</Text> : null}<View style={styles.languageGrid}>{SUPPORTED_LANGUAGES.map((language) => <Pressable key={language} accessibilityRole="button" accessibilityState={{ selected: preferences.language === language }} onPress={() => void updatePreferences({ language })} style={[styles.languageChip, preferences.language === language && styles.languageSelected]}><Text style={[styles.languageText, preferences.language === language && styles.languageTextSelected]}>{t(`language.${language}`)}</Text></Pressable>)}</View></View> : null}
      {step === 2 ? <View style={styles.stack}><Text style={styles.eyebrow}>02</Text><Text style={styles.hero}>{t('onboarding.contextTitle')}</Text><Text style={styles.body}>{t('onboarding.contextBody')}</Text><View style={styles.note}><Text style={styles.noteText}>{t('onboarding.privacy')}</Text></View><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acknowledged }} onPress={() => setAcknowledged(!acknowledged)} style={styles.checkRow}><View style={[styles.checkbox, acknowledged && styles.checked]}>{acknowledged ? <Text style={styles.checkmark}>✓</Text> : null}</View><Text style={styles.checkLabel}>{t('onboarding.acknowledge')}</Text></Pressable></View> : null}
      {step === 3 ? <View style={styles.stack}><Text style={styles.eyebrow}>03</Text><Text style={styles.hero}>{t('onboarding.dateTitle')}</Text><Text style={styles.body}>{t('onboarding.dateBody')}</Text><View style={styles.pickerCard}><DateTimePicker value={date} mode="date" display="spinner" maximumDate={new Date()} onChange={(_, selected) => selected && setDate(selected)} /></View></View> : null}
      {step === 4 ? <View style={styles.stack}><Text style={styles.eyebrow}>04</Text><Text style={styles.hero}>{t('onboarding.typicalTitle')}</Text><Text style={styles.body}>{t('onboarding.typicalBody')}</Text><NumberStepper label={t('onboarding.cycleLength')} value={cycleLength} min={21} max={40} onChange={setCycleLength} /><NumberStepper label={t('onboarding.periodLength')} value={periodLength} min={2} max={10} onChange={setPeriodLength} /></View> : null}
      {step === 5 ? <View style={styles.stack}><Text style={styles.eyebrow}>05</Text><Text style={styles.hero}>{t('onboarding.previewTitle')}</Text><Text style={styles.body}>{t('onboarding.previewBody')}</Text><View style={styles.preview}><Text style={styles.day}>{t('today.day', { day: estimate.estimatedCycleDay })}</Text><Text style={styles.phase}>{t('today.approxPhase', { phase: t(`phase.${estimate.estimatedPhase}`) })}</Text><View style={styles.rule} /><Text style={styles.cardLabel}>{t('today.today')}</Text><Text style={styles.context}>{previewCue.context}</Text><Text style={styles.cardLabel}>{t('today.goodMove')}</Text><Text style={styles.cue}>{previewCue.cue}</Text></View></View> : null}
      {step === 6 ? <View style={styles.stack}><Text style={styles.eyebrow}>06</Text><PaywallCard onUnlocked={() => setStep(7)} /></View> : null}
      {step === 7 ? <View style={styles.stack}><Text style={styles.eyebrow}>07</Text><Text style={styles.hero}>{t('onboarding.reminderTitle')}</Text><Text style={styles.body}>{t('onboarding.reminderBody')}</Text><View style={styles.switchRow}><Text style={styles.switchLabel}>{t('onboarding.enableReminder')}</Text><Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: colors.sage }} /></View>{reminderEnabled ? <View style={styles.pickerCard}><Text style={styles.cardLabel}>{t('onboarding.reminderTime')}</Text><DateTimePicker value={reminderTime} mode="time" display="spinner" onChange={(_, selected) => selected && setReminderTime(selected)} /></View> : null}<Button label={t('onboarding.finish')} onPress={() => void finish()} /></View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ progress: { height: 3, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden', marginBottom: spacing.xl }, progressFill: { height: 3, backgroundColor: colors.primary }, center: { flex: 1, justifyContent: 'center', gap: spacing.md }, stack: { flex: 1, gap: spacing.lg }, footer: { gap: spacing.xs }, wordmark: { color: colors.primary, fontSize: 18, fontWeight: '800', letterSpacing: 1 }, hero: { color: colors.text, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1 }, body: { color: colors.secondary, fontSize: 18, lineHeight: 28 }, eyebrow: { color: colors.sage, fontSize: 13, letterSpacing: 2, fontWeight: '800' }, note: { backgroundColor: '#ECE9E1', borderRadius: radius.md, padding: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.sand }, noteText: { color: colors.text, fontSize: 16, lineHeight: 24 }, checkRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: colors.primary, borderColor: colors.primary }, checkmark: { color: '#fff', fontWeight: '800' }, checkLabel: { flex: 1, color: colors.text, fontSize: 16, lineHeight: 23 }, pickerCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md }, languageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }, languageChip: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, minHeight: 44, justifyContent: 'center', borderRadius: radius.pill }, languageSelected: { backgroundColor: colors.primary, borderColor: colors.primary }, languageText: { color: colors.text }, languageTextSelected: { color: '#fff', fontWeight: '700' }, preview: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }, day: { color: colors.text, fontSize: 34, fontWeight: '800' }, phase: { color: colors.secondary, fontSize: 14 }, rule: { height: 3, width: 44, backgroundColor: colors.lavender, borderRadius: 2, marginVertical: spacing.sm }, cardLabel: { color: colors.primary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }, context: { color: colors.text, fontSize: 18, lineHeight: 26 }, cue: { color: colors.text, fontSize: 20, lineHeight: 29, fontWeight: '700' }, switchRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md }, switchLabel: { color: colors.text, fontSize: 17, flex: 1 }, });

