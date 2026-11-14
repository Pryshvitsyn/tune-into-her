import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';

import { TuneIntoHerSphereV4 } from "../TuneIntoHerSphereV4";
import { AdviceBlocks } from '../src/components/AdviceBlocks';
import { AppText as Text } from '../src/components/AppText';
import { Button } from '../src/components/Button';
import { LanguagePicker } from '../src/components/LanguagePicker';
import { NumberStepper } from '../src/components/NumberStepper';
import { Screen } from '../src/components/Screen';
import { acceleratedDemoEnabled } from '../src/config/acceleratedDemo';
import { useApp, notificationScheduler } from '../src/context/AppContext';
import { getCatalog, getLocalizedCue } from '../src/domain/content/contentRepository';
import { estimateCycle } from '../src/domain/cycle/cycleEngine';
import { toDateOnly } from '../src/domain/cycle/dateOnly';
import { getDemoCopy } from '../src/i18n/acceleratedDemo';
import releaseCopy from '../src/i18n/releaseCopy.json';
import { useInterface } from '../src/i18n/useInterface';
import { DestinationSphere } from '../src/intro/LaunchPresentation';
import { type Palette } from '../src/theme';
import { typographyForLanguage } from '../src/theme/typography';
import { useTheme } from '../src/theme/useTheme';

export default function OnboardingScreen() {
  const { colors, dark } = useTheme();
  const { preferences, updatePreferences, setCycleSettings } = useApp();
  const styles = makeStyles(colors);
  const type = typographyForLanguage(preferences.language);
  const { fontScale } = useWindowDimensions();
  const backHeight = Math.max(54, 24 * fontScale + 24);
  const { t } = useTranslation();
  const c = useInterface();
  const [step, setStep] = useState(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [date, setDate] = useState(new Date());
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [working, setWorking] = useState(false);
  const busy = useRef(false);
  const [reminderTime, setReminderTime] = useState(() => {
    const value = new Date();
    value.setHours(preferences.reminderHour, preferences.reminderMinute, 0, 0);
    return value;
  });
  const settings = useMemo(() => ({
    lastKnownPeriodStart: toDateOnly(date), typicalCycleLength: cycleLength, typicalPeriodLength: periodLength,
  }), [date, cycleLength, periodLength]);
  const estimate = useMemo(() => estimateCycle({ ...settings, currentLocalDate: toDateOnly(new Date()) }), [settings]);
  const previewCue = getLocalizedCue(preferences.language,
    getCatalog().find(item => item.phases.includes(estimate.estimatedPhase))?.id ?? 'luteal_001');

  const next = async () => {
    if (step === 2 && !acknowledged) { Alert.alert(t('onboarding.required')); return; }
    if (step === 5) await setCycleSettings(settings);
    setStep(current => Math.min(6, current + 1));
  };
  const finish = async () => {
    let enabled = reminderEnabled;
    if (enabled) enabled = await notificationScheduler.requestPermission();
    await updatePreferences({
      onboardingComplete: true, reminderEnabled: enabled,
      reminderHour: reminderTime.getHours(), reminderMinute: reminderTime.getMinutes(),
    }, true);
    router.replace('/paywall');
  };
  const advance = async () => {
    if (busy.current) return;
    busy.current = true; setWorking(true);
    try { if (step === 6) await finish(); else await next(); }
    catch { Alert.alert(t('cycle.saveError')); }
    finally { busy.current = false; setWorking(false); }
  };

  return <Screen footer={<View style={styles.footer}>
    <Button label={t(working ? 'common.loading' : step === 6 ? 'onboarding.finish' : 'common.continue')}
      disabled={working} onPress={() => void advance()} />
    {step > 1 ? <Button label={t('common.back')} variant="ghost" disabled={working} onPress={() => setStep(step - 1)} />
      : <View accessible={false} style={[styles.backSpace, { minHeight: backHeight }]} />}
  </View>}>
    <View style={styles.progressHeader} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 6, now: step }}>
      <Text style={[styles.progressLabel, type]}>{String(step).padStart(2, '0')} / 06</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${step / 6 * 100}%` }]} /></View>
    </View>
    {step === 1 ? <View style={styles.center}>
      <View accessible={false} style={styles.sphere}>
        <DestinationSphere style={{ width: 132, height: 132 }}><TuneIntoHerSphereV4 size={132} /></DestinationSphere>
      </View>
      <Text style={[styles.hero, type]}>{t('onboarding.welcomeTitle')}</Text>
      <Text style={[styles.subtitle, type]}>{`${c.mind} · ${c.support} · ${c.do}`}</Text>
      <View style={styles.language}>
        <LanguagePicker value={preferences.language} disabled={working} onConfirm={language => updatePreferences({ language })} />
      </View>
      {acceleratedDemoEnabled ? <Button label={getDemoCopy(preferences.language).title} variant="secondary" onPress={() => router.push('/demo')} /> : null}
      {preferences.language === 'mbf' ? <Text style={[styles.noteText, type]}>{releaseCopy.mbf.beta}</Text> : null}
    </View> : null}
    {step === 2 ? <View style={styles.stack}>
      <Text style={[styles.hero, type]}>{preferences.language === 'en' ? 'Context,\nnever a prediction' : t('onboarding.contextTitle')}</Text>
      <Text style={[styles.body, type]}>{t('onboarding.contextBody')}</Text>
      <View style={styles.note}><Text style={[styles.noteText, type]}>{t('onboarding.privacy')}</Text></View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acknowledged }}
        onPress={() => setAcknowledged(!acknowledged)} style={styles.checkRow}>
        <View style={[styles.checkbox, acknowledged && styles.checked]}>{acknowledged ? <Text allowFontScaling={false} style={styles.checkmark}>✓</Text> : null}</View>
        <Text style={[styles.checkLabel, type]}>{t('onboarding.acknowledge')}</Text>
      </Pressable>
    </View> : null}
    {step === 3 ? <View style={styles.stack}>
      <Text style={[styles.hero, type]}>{t('onboarding.dateTitle')}</Text>
      <Text style={[styles.body, type]}>{t('onboarding.dateBody')}</Text>
      <View style={styles.picker}>
        <DateTimePicker themeVariant={dark ? 'dark' : 'light'} value={date} mode="date" display="spinner"
          maximumDate={new Date()} onChange={(_, selected) => selected && setDate(selected)} />
      </View>
    </View> : null}
    {step === 4 ? <View style={styles.stack}>
      <Text style={[styles.hero, type]}>{t('onboarding.typicalTitle')}</Text>
      <Text style={[styles.body, type]}>{t('onboarding.typicalBody')}</Text>
      <View>
        <NumberStepper label={t('onboarding.cycleLength')} value={cycleLength} min={21} max={40} onChange={setCycleLength} />
        <NumberStepper label={t('onboarding.periodLength')} value={periodLength} min={2} max={10} onChange={setPeriodLength} />
      </View>
    </View> : null}
    {step === 5 ? <View style={styles.preview}>
      <Text style={[styles.hero, type]}>{t('onboarding.previewTitle')}</Text>
      <Text style={[styles.body, type]}>{t('onboarding.previewBody')}</Text>
      <AdviceBlocks advice={previewCue} date={toDateOnly(new Date())} presentation="onboarding" />
    </View> : null}
    {step === 6 ? <View style={styles.stack}>
      <Text style={[styles.hero, type]}>{t('onboarding.reminderTitle')}</Text>
      <Text style={[styles.body, type]}>{t('onboarding.reminderBody')}</Text>
      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, type]}>{t('onboarding.enableReminder')}</Text>
        <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: colors.button }} />
      </View>
      {reminderEnabled ? <View style={styles.picker}>
        <Text style={[styles.cardLabel, type]}>{t('onboarding.reminderTime')}</Text>
        <DateTimePicker themeVariant={dark ? 'dark' : 'light'} value={reminderTime} mode="time" display="spinner"
          onChange={(_, selected) => selected && setReminderTime(selected)} />
      </View> : null}
    </View> : null}
  </Screen>;
}
const makeStyles = (colors: Palette) => StyleSheet.create({
  progressHeader: { marginTop: 8, marginBottom: 20, gap: 10 },
  progressLabel: { color: colors.secondary, textAlign: 'center', fontSize: 13, lineHeight: 18, letterSpacing: 1.2 },
  progressTrack: { height: 2, backgroundColor: colors.border, overflow: 'hidden', borderRadius: 2 },
  progressFill: { height: 2, backgroundColor: colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'stretch', gap: 18, paddingVertical: 12 },
  stack: { flex: 1, justifyContent: 'center', gap: 20, paddingVertical: 12 },
  preview: { flex: 1, gap: 16, paddingVertical: 12 },
  sphere: { alignItems: 'center', marginBottom: 8 },
  hero: { color: colors.text, fontSize: 32, lineHeight: 38, textAlign: 'center' },
  subtitle: { color: colors.secondary, fontSize: 19, lineHeight: 27, textAlign: 'center' },
  body: { color: colors.secondary, fontSize: 17, lineHeight: 25, textAlign: 'center' },
  language: { marginTop: 4, marginBottom: 8 },
  note: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingVertical: 16 },
  noteText: { color: colors.secondary, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  checkRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  checkbox: { width: 26, height: 26, borderRadius: 7, borderWidth: 1, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: colors.button, borderColor: colors.button },
  checkmark: { color: colors.buttonText, fontSize: 17 },
  checkLabel: { flex: 1, color: colors.text, fontSize: 16, lineHeight: 24 },
  picker: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingVertical: 12, alignItems: 'center' },
  cardLabel: { color: colors.secondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  switchRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingVertical: 12 },
  switchLabel: { color: colors.text, fontSize: 17, lineHeight: 25, flex: 1 },
  footer: { gap: 4 },
  backSpace: { minHeight: 54 },
});
