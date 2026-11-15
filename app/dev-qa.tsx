import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';


import { AppText as Text } from '../src/components/AppText';
import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { Screen } from '../src/components/Screen';
import { useApp } from '../src/context/AppContext';
import { QA_DAY_MS, QA_SCENARIOS } from '../src/devQA/scenarios';
import { internalQAEnabled, internalQASession, standaloneQAEnabled } from '../src/devQA/session';
import { useInternalQASession } from '../src/devQA/useInternalQA';
import { type Palette, spacing } from '../src/theme';
import { useTheme } from '../src/theme/useTheme';

/** Hidden URL/Settings development entry. A production bundle cannot activate fixtures. */
export default function InternalQAScreen() {
  const qa = useInternalQASession();
  const { t } = useTranslation();
  const { preferences } = useApp();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (operation: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await operation(); } catch { setError('QA_OPERATION_FAILED'); }
    finally { setBusy(false); }
  };
  if (!internalQAEnabled) return <Redirect href="/" />;
  const expiry = qa.active ? [qa.appTrial.expiresAt, qa.entitlement.expirationDate]
    .map(value => value ? Date.parse(value) : NaN).filter(value => Number.isFinite(value) && value > qa.nowMs).sort((a, b) => a - b)[0] : undefined;
  return <Screen>
    <Header title={t('qa.title')} />
    {standaloneQAEnabled ? <Text style={styles.body}>{t('qa.standaloneHint')}</Text> : null}
    {qa.active ? <View style={styles.section}>
      <Button testID="qa-open-selected" label={t('qa.openScenario', { scenario: t(`qa.scenario.${qa.scenarioId}`) })} disabled={busy || !qa.accessReady} onPress={() => router.push(qa.preferences.onboardingComplete ? '/today' : '/onboarding')} />
      <Text style={styles.title}>{t('qa.active', { value: t(`qa.scenario.${qa.scenarioId}`) })}</Text>
      <Text style={styles.body}>{t('qa.time', { value: new Date(qa.nowMs).toLocaleString(preferences.language === 'mbf' ? 'ms' : preferences.language) })}</Text>
      <Text style={styles.body}>{t('qa.cycle', { value: qa.cycleSettings ? `${qa.cycleSettings.lastKnownPeriodStart} · ${qa.cycleSettings.typicalCycleLength}/${qa.cycleSettings.typicalPeriodLength}` : t('qa.notConfigured') })}</Text>
      <Text style={styles.body}>{t('qa.appAccess', { value: t(`qa.status.${qa.appTrial.status}`) })} · {t('qa.storeAccess', { value: t(`qa.status.${qa.entitlement.status}`) })}</Text>
    </View> : <Text style={styles.body}>{t('qa.choose')}</Text>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{t('qa.error')}</Text> : null}
    <View style={styles.section}>
      <Text style={styles.title}>{t('qa.scenarios')}</Text>
      {QA_SCENARIOS.map(scenario => <Button key={scenario.id} testID={`qa-scenario-${scenario.id}`} label={t(`qa.scenario.${scenario.id}`)} disabled={busy} variant={qa.active && qa.scenarioId === scenario.id ? 'primary' : 'secondary'} onPress={() => { void run(() => internalQASession.startScenario(scenario.id, preferences)); }} />)}
    </View>
    {qa.active ? <View style={styles.section}>
      <Text style={styles.body}>{t('qa.disclosure')}</Text>
      <Button testID="qa-advance-minute" label={t('qa.advanceMinute')} disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.advanceBy(60_000)); }} />
      <Button testID="qa-advance-day" label={t('qa.advanceDay')} disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.advanceBy(QA_DAY_MS)); }} />
      <Button testID="qa-advance-week" label={t('qa.advanceWeek')} disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.advanceBy(7 * QA_DAY_MS)); }} />
      <Button testID="qa-next-0800" label={t('qa.next0800')} disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.advanceToNextGuidanceBoundary()); }} />
      <Button testID="qa-expiry" label={t('qa.expiry')} disabled={busy || expiry === undefined} variant="secondary" onPress={() => { if (expiry !== undefined) void run(() => internalQASession.advanceBy(expiry - qa.nowMs)); }} />
      {qa.scenarioId === 'store-unavailable' ? <Button testID="qa-store-online" label={t('qa.storeOnline')} disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.setStoreAvailable(true)); }} /> : null}
      <Button testID="qa-refresh-access" label={t('qa.refreshAccess')} disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.refreshAccess()); }} />
      <Button testID="qa-end" label={t(standaloneQAEnabled ? 'qa.resetSession' : 'qa.end')} disabled={busy} onPress={() => { internalQASession.stop(); router.replace('/settings'); }} />
    </View> : null}
    <View style={styles.section}>
      <Text style={styles.title}>{t('qa.screens')}</Text>
      <Text style={styles.body}>{t('qa.screenHelp')}</Text>
      {([
        ['today.today', '/today'], ['settings.cycle', '/cycle'], ['onboarding.welcomeTitle', '/onboarding'],
        ['settings.subscription', '/settings/subscription'], ['settings.title', '/settings'],
        ['qa.history', '/history'], ['privacy.title', '/privacy'], ['paywall.terms', '/terms'],
      ] as const).map(([label, path]) => <Button key={path} testID={`qa-open-${path.replaceAll('/', '-')}`} label={t(label)} disabled={busy || !qa.active} variant="secondary" onPress={() => router.push(path)} />)}
    </View>
  </Screen>;
}
const makeStyles = (colors: Palette) => StyleSheet.create({
  body: { color: colors.secondary, fontSize: 16, lineHeight: 24, marginVertical: spacing.xs },
  title: { color: colors.text, fontSize: 23, lineHeight: 30 },
  section: { gap: spacing.sm, marginVertical: spacing.lg },
  error: { color: colors.danger, fontSize: 16, lineHeight: 24 },
});
