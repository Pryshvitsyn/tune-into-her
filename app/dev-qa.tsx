import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText as Text } from '../src/components/AppText';
import { Button } from '../src/components/Button';
import { Header } from '../src/components/Header';
import { Screen } from '../src/components/Screen';
import { QA_DAY_MS, QA_SCENARIOS } from '../src/devQA/scenarios';
import { internalQAEnabled, internalQASession } from '../src/devQA/session';
import { useInternalQASession } from '../src/devQA/useInternalQA';
import { type Palette, spacing } from '../src/theme';
import { useTheme } from '../src/theme/useTheme';

/** Hidden URL/Settings development entry. A production bundle cannot activate fixtures. */
export default function InternalQAScreen() {
  const qa = useInternalQASession();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (operation: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await operation(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'QA_OPERATION_FAILED'); }
    finally { setBusy(false); }
  };
  if (!internalQAEnabled) return <Redirect href="/" />;
  const expiry = qa.active ? [qa.appTrial.expiresAt, qa.entitlement.expirationDate]
    .map(value => value ? Date.parse(value) : NaN).filter(value => Number.isFinite(value) && value > qa.nowMs).sort((a, b) => a - b)[0] : undefined;
  return <Screen>
    <Header title="Internal QA" />
    <Text style={styles.disclosure}>{t('paywall.mock')}</Text>
    <Text style={styles.body}>Synthetic session only. Saved cycle, preferences, billing caches, history, device time and notification schedules are not changed.</Text>
    {qa.active ? <View style={styles.section}>
      <Text style={styles.title}>Active: {qa.scenarioId}</Text>
      <Text style={styles.body}>Simulated local time: {new Date(qa.nowMs).toLocaleString()}</Text>
      <Text style={styles.body}>Cycle: {qa.cycleSettings ? `${qa.cycleSettings.lastKnownPeriodStart} · ${qa.cycleSettings.typicalCycleLength}/${qa.cycleSettings.typicalPeriodLength}` : 'not configured'}</Text>
      <Text style={styles.body}>App access: {qa.appTrial.status} · Store access: {qa.entitlement.status}</Text>
      <Button testID="qa-advance-minute" label="Advance 1 minute" disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.advanceBy(60_000)); }} />
      <Button testID="qa-advance-day" label="Advance 1 day" disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.advanceBy(QA_DAY_MS)); }} />
      <Button testID="qa-advance-week" label="Advance 7 days" disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.advanceBy(7 * QA_DAY_MS)); }} />
      <Button testID="qa-next-0800" label="Advance to next local 08:00" disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.advanceToNextGuidanceBoundary()); }} />
      <Button testID="qa-expiry" label="Advance to access expiry" disabled={busy || expiry === undefined} variant="secondary" onPress={() => { if (expiry !== undefined) void run(() => internalQASession.advanceBy(expiry - qa.nowMs)); }} />
      {qa.scenarioId === 'store-unavailable' ? <Button testID="qa-store-online" label="Make mock store available for Retry" disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.setStoreAvailable(true)); }} /> : null}
      <Button testID="qa-refresh-access" label="Refresh simulated access" disabled={busy} variant="secondary" onPress={() => { void run(() => internalQASession.refreshAccess()); }} />
      <Button testID="qa-end" label="End QA — restore real app view" disabled={busy} onPress={() => { internalQASession.stop(); router.replace('/settings'); }} />
    </View> : <Text style={styles.body}>Choose a scenario to start. The session lasts only in this JS process. Ending it restores the real app view.</Text>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <View style={styles.section}>
      <Text style={styles.title}>Scenarios</Text>
      {QA_SCENARIOS.map(scenario => <Button key={scenario.id} testID={`qa-scenario-${scenario.id}`} label={scenario.label} disabled={busy} variant={qa.active && qa.scenarioId === scenario.id ? 'primary' : 'secondary'} onPress={() => { void run(() => internalQASession.startScenario(scenario.id)); }} />)}
    </View>
    <View style={styles.section}>
      <Text style={styles.title}>Exercise existing screens</Text>
      <Text style={styles.body}>Use the existing header emblem to test the globe return to Today. Change appearance in its existing Settings location.</Text>
      {([
        ['Today', '/today'], ['Cycle calendar', '/cycle'], ['Onboarding', '/onboarding'],
        ['Subscription / Restore', '/settings/subscription'], ['Settings / theme', '/settings'],
        ['Previous guidance', '/history'], ['Privacy', '/privacy'], ['Terms / licence', '/terms'],
      ] as const).map(([label, path]) => <Button key={path} testID={`qa-open-${path.replaceAll('/', '-')}`} label={label} disabled={busy || !qa.active} variant="secondary" onPress={() => router.push(path)} />)}
    </View>
  </Screen>;
}
const makeStyles = (colors: Palette) => StyleSheet.create({
  disclosure: { color: colors.danger, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: spacing.sm },
  body: { color: colors.secondary, fontSize: 16, lineHeight: 24, marginVertical: spacing.xs },
  title: { color: colors.text, fontSize: 23, lineHeight: 30 },
  section: { gap: spacing.sm, marginVertical: spacing.lg },
  error: { color: colors.danger, fontSize: 16, lineHeight: 24 },
});
