import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { TuneIntoHerSphereV4 } from '../TuneIntoHerSphereV4';
import { Button } from '../src/components/Button';
import { NumberStepper } from '../src/components/NumberStepper';
import { Screen } from '../src/components/Screen';
import { useApp, notificationScheduler } from '../src/context/AppContext';
import { getCatalog, getLocalizedCue } from '../src/domain/content/contentRepository';
import { estimateCycle, type CycleRegularity } from '../src/domain/cycle/cycleEngine';
import { toDateOnly } from '../src/domain/cycle/dateOnly';
import { colors, radius, spacing } from '../src/theme';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { preferences, updatePreferences, setCycleSettings, completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(new Date());
  const [cycleLength, setCycleLength] = useState(28);
  const [cycleKnown, setCycleKnown] = useState(true);
  const [regularity, setRegularity] = useState<CycleRegularity>('regular');
  const [periodLength, setPeriodLength] = useState(5);
  const [periodKnown, setPeriodKnown] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState(() => { const value = new Date(); value.setHours(8, 0, 0, 0); return value; });
  const settings = useMemo(() => ({ lastKnownPeriodStart: toDateOnly(date), typicalCycleLength: cycleKnown ? cycleLength : 28, typicalPeriodLength: periodKnown ? periodLength : 5, regularity: cycleKnown ? regularity : 'unknown' as const }), [cycleKnown, cycleLength, date, periodKnown, periodLength, regularity]);
  const estimate = useMemo(() => estimateCycle({ ...settings, currentLocalDate: toDateOnly(new Date()) }), [settings]);
  const previewCue = getLocalizedCue(preferences.language, getCatalog().find((item) => item.phases.includes(estimate.estimatedPhase))?.id ?? 'luteal_001');

  const next = async () => {
    if (step === 8) await setCycleSettings(settings);
    if (step === 8) {
      let enabled = reminderEnabled;
      if (enabled) enabled = await notificationScheduler.requestPermission();
      await updatePreferences({ reminderEnabled: enabled, reminderHour: reminderTime.getHours(), reminderMinute: reminderTime.getMinutes() });
    }
    if (step === 10) { await completeOnboarding(); router.replace('/today'); return; }
    setStep((value) => Math.min(10, value + 1));
  };

  const footer = step === 9 ? <Button label={t('common.continue')} onPress={() => setStep(10)} /> : <View style={styles.footer}>{step > 0 ? <Button label={t('common.back')} variant="ghost" onPress={() => setStep((value) => value - 1)} /> : null}<Button label={step === 10 ? t('onboarding.finish') : t('common.continue')} onPress={() => void next()} /></View>;
  return <Screen footer={footer}>
    {step > 0 ? <View style={styles.progress}><View style={[styles.progressFill, { width: `${(step / 10) * 100}%` }]} /></View> : null}
    {step === 0 ? <Intro title={t('onboarding.welcomeTitle')} body={t('onboardingV2.introBody')} sphere /> : null}
    {step === 1 ? <Intro title={t('onboardingV2.understandTitle')} body={t('onboardingV2.understandBody')} note={t('onboardingV2.understandNote')} /> : null}
    {step === 2 ? <Intro title={t('onboardingV2.moreTitle')} body={t('onboardingV2.moreBody')} /> : null}
    {step === 3 ? <Intro title={t('onboardingV2.tuneTitle')} body={t('onboardingV2.tuneBody')} /> : null}
    {step === 4 ? <View style={styles.stack}><Text style={styles.hero}>{t('onboardingV2.lastPeriodTitle')}</Text><Text style={styles.body}>{t('onboardingV2.lastPeriodBody')}</Text><View style={styles.picker}><DateTimePicker value={date} mode="date" display="spinner" maximumDate={new Date()} onChange={(_, value) => value && setDate(value)} /></View></View> : null}
    {step === 5 ? <View style={styles.stack}><Text style={styles.hero}>{t('onboardingV2.cycleTitle')}</Text><Text style={styles.body}>{t('onboarding.typicalBody')}</Text>{cycleKnown ? <NumberStepper label={t('onboarding.cycleLength')} value={cycleLength} min={21} max={40} onChange={setCycleLength} /> : null}<Choice selected={!cycleKnown} onPress={() => setCycleKnown(!cycleKnown)} label={t('onboardingV2.unsure')} /></View> : null}
    {step === 6 ? <View style={styles.stack}><Text style={styles.hero}>{t('onboardingV2.regularityTitle')}</Text><View style={styles.choices}>{(['regular', 'varies', 'unknown'] as const).map((value) => <Choice key={value} selected={regularity === value} onPress={() => setRegularity(value)} label={t(`onboardingV2.${value}`)} />)}</View></View> : null}
    {step === 7 ? <View style={styles.stack}><Text style={styles.hero}>{t('onboardingV2.periodTitle')}</Text>{periodKnown ? <NumberStepper label={t('onboarding.periodLength')} value={periodLength} min={2} max={10} onChange={setPeriodLength} /> : null}<Choice selected={!periodKnown} onPress={() => setPeriodKnown(!periodKnown)} label={t('onboardingV2.skip')} /></View> : null}
    {step === 8 ? <View style={styles.stack}><Text style={styles.hero}>{t('onboardingV2.reminderTitle')}</Text><Text style={styles.body}>{t('onboardingV2.reminderBody')}</Text><View style={styles.switchRow}><Text style={styles.switchLabel}>{t('onboardingV2.dailyReminder')}</Text><Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: colors.sage }} /></View>{reminderEnabled ? <View style={styles.picker}><Text style={styles.smallLabel}>{t('onboarding.reminderTime')}</Text><DateTimePicker value={reminderTime} mode="time" display="spinner" onChange={(_, value) => value && setReminderTime(value)} /></View> : null}</View> : null}
    {step === 9 ? <View style={styles.valueMoment}><Text style={styles.todayLabel}>{t('onboardingV2.previewTitle')}</Text><TuneIntoHerSphereV4 size={260} /><Text style={styles.phase}>{t(`phase.${estimate.estimatedPhase}`)}</Text><Text style={styles.context}>{previewCue.howSheMayFeel}</Text><Text style={styles.tuneIn}>{t('onboardingV2.previewLabel')}</Text><Text style={styles.cue}>{previewCue.whatYouCanDo}</Text><Button label={t('onboardingV2.seeHow')} variant="secondary" onPress={() => router.push({ pathname: '/learn/[phase]', params: { phase: estimate.estimatedPhase } })} /></View> : null}
    {step === 10 ? <Intro title={t('onboardingV2.privacyTitle')} body={t('onboardingV2.privacyBody')} /> : null}
  </Screen>;
}

function Intro({ title, body, note, sphere = false }: { title: string; body: string; note?: string; sphere?: boolean }) { return <View style={styles.intro}>{sphere ? <TuneIntoHerSphereV4 size={250} /> : null}<Text style={styles.hero}>{title}</Text><Text style={styles.body}>{body}</Text>{note ? <Text style={styles.note}>{note}</Text> : null}</View>; }
function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress(): void }) { return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}><View style={[styles.radio, selected && styles.radioSelected]} /><Text style={styles.choiceText}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({ progress: { height: 3, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden', marginBottom: spacing.xl }, progressFill: { height: 3, backgroundColor: colors.primary }, footer: { gap: spacing.xs }, intro: { flex: 1, justifyContent: 'center', gap: spacing.lg }, stack: { flex: 1, gap: spacing.lg }, hero: { color: colors.text, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1 }, body: { color: colors.secondary, fontSize: 18, lineHeight: 28 }, note: { color: colors.primary, fontSize: 15, lineHeight: 23, fontWeight: '700' }, picker: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md }, choices: { gap: spacing.sm }, choice: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, backgroundColor: colors.card }, choiceSelected: { borderColor: colors.primary, backgroundColor: colors.overlay }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.secondary }, radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary }, choiceText: { color: colors.text, fontSize: 17, fontWeight: '600' }, switchRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md }, switchLabel: { color: colors.text, fontSize: 17 }, smallLabel: { color: colors.secondary, fontSize: 13, fontWeight: '700' }, valueMoment: { flex: 1, gap: spacing.md, alignItems: 'center', justifyContent: 'center' }, todayLabel: { alignSelf: 'flex-start', color: colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' }, phase: { color: colors.primary, fontSize: 25, fontWeight: '800', textTransform: 'capitalize' }, context: { color: colors.text, textAlign: 'center', fontSize: 19, lineHeight: 28 }, tuneIn: { alignSelf: 'flex-start', color: colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase', marginTop: spacing.sm }, cue: { color: colors.text, textAlign: 'center', fontSize: 21, lineHeight: 30, fontWeight: '700' } });
