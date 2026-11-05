import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, StyleSheet, Text, View } from 'react-native';

import { AdviceBlocks } from '../src/components/AdviceBlocks';
import { Button } from '../src/components/Button';
import { Screen } from '../src/components/Screen';
import { acceleratedDemoEnabled } from '../src/config/acceleratedDemo';
import { useApp } from '../src/context/AppContext';
import { buildDemoDays, getDemoProgress, type DemoDay } from '../src/domain/demo/acceleratedDemo';
import { demoNotificationTarget } from '../src/domain/navigation/demoNotificationTarget';
import { getDemoCopy } from '../src/i18n/acceleratedDemo';
import { useInterface } from '../src/i18n/useInterface';
import { completeDemoSession, loadDemoSession, startDemoSession, stopDemoSession } from '../src/services/notifications/acceleratedDemo';
import type { AcceleratedDemoSession } from '../src/storage/AcceleratedDemoStore';
import type { Palette } from '../src/theme';
import { useTheme } from '../src/theme/useTheme';

type ErrorKind = 'permission' | 'schedule' | 'cleanup' | 'load' | null;

export default function DemoScreen() {
  const { ready, preferences, cycleSettings } = useApp();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const copy = getDemoCopy(preferences.language);
  const ui = useInterface();
  const params = useLocalSearchParams<{ runId?: string; day?: string; receivedAt?: string }>();
  const [session, setSession] = useState<AcceleratedDemoSession | null | undefined>(undefined);
  const [content, setContent] = useState<{ language: string; days: DemoDay[] } | null>(null);
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKind>(null);
  const [notice, setNotice] = useState<'stopped' | null>(null);
  const completedRun = useRef<string | null>(null);
  const mounted = useRef(true);
  const operation = useRef(false);

  const refresh = useCallback(() => {
    return loadDemoSession().then(saved => {
      if (mounted.current) {
        setSession(saved);
        setNow(Date.now());
        setError(current => current === 'load' ? null : current);
      }
    }).catch(() => {
      if (mounted.current) setError('load');
    });
  }, [setError, setSession, setNow]);

  useFocusEffect(useCallback(() => {
    if (acceleratedDemoEnabled) void refresh();
  }, [refresh]));

  useEffect(() => {
    mounted.current = true;
    if (!acceleratedDemoEnabled) return;
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => {
      mounted.current = false;
      clearInterval(clock);
      subscription.remove();
    };
  }, [refresh]);

  useEffect(() => {
    if (!acceleratedDemoEnabled) return;
    let active = true;
    void buildDemoDays(preferences.language).then(value => {
      if (active) setContent({ language: preferences.language, days: value });
    }).catch(() => { if (active) setError('load'); });
    return () => { active = false; };
  }, [preferences.language]);

  const progress = session ? getDemoProgress(session.startedAt, now) : null;

  useEffect(() => {
    if (!session || !progress?.completed || completedRun.current === session.runId) return;
    completedRun.current = session.runId;
    void completeDemoSession(session.runId).catch(() => {
      if (mounted.current) setError('cleanup');
    });
  }, [progress?.completed, session]);

  const close = () => router.replace(preferences.onboardingComplete && cycleSettings ? '/today' : '/onboarding');
  const start = async () => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await startDemoSession(preferences.language, { title: copy.notificationTitle, body: copy.notificationBody });
      if (mounted.current) {
        setSession(saved);
        setNow(saved.startedAt);
        completedRun.current = null;
        router.setParams({ runId: '', day: '', receivedAt: '' });
      }
    } catch (caught) {
      if (mounted.current) {
        const code = caught instanceof Error ? caught.message : '';
        setError(code.includes('PERMISSION_DENIED') ? 'permission' : code.includes('CLEANUP') ? 'cleanup' : 'schedule');
        // A failed replacement must not leave an old run displayed as active.
        try {
          const saved = await loadDemoSession();
          if (mounted.current) setSession(saved);
        } catch { if (mounted.current) setError('load'); }
      }
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const stop = async () => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError(null);
    try {
      await stopDemoSession();
      if (mounted.current) {
        setSession(null);
        setNotice('stopped');
        router.setParams({ runId: '', day: '', receivedAt: '' });
      }
    } catch { if (mounted.current) setError('cleanup'); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  };

  if (!acceleratedDemoEnabled) return <Screen><Text style={styles.body}>{copy.unavailable}</Text><Button label={copy.close} onPress={close} /></Screen>;
  if (!ready) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;

  const liveDay = progress?.day ?? 1;
  const pending = demoNotificationTarget({ kind: 'accelerated-demo', runId: params.runId, demoDay: params.day }, session ?? null, now);
  const receivedAt = params.receivedAt && /^\d+$/.test(params.receivedAt) ? Number(params.receivedAt) : NaN;
  const receivedOnDay = session && Number.isSafeInteger(receivedAt) && receivedAt >= session.startedAt && receivedAt <= now
    ? getDemoProgress(session.startedAt, receivedAt).day : null;
  const shownDay = pending && receivedOnDay === liveDay ? Number(pending.params.day) : liveDay;
  const days = content?.language === preferences.language ? content.days : null;
  const day = days?.[shownDay - 1];
  const remainingSeconds = progress?.nextChangeAt ? Math.max(0, Math.ceil((progress.nextChangeAt - now) / 1000)) : 0;
  const time = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const errorText = error === 'permission' ? copy.permissionDenied : error === 'schedule' ? copy.scheduleError : error === 'cleanup' ? copy.cleanupError : error === 'load' ? copy.loadError : null;

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.label}>{copy.title}</Text>
        <Text style={styles.day} accessibilityLiveRegion="polite">{copy.day.replace('{{day}}', String(shownDay))}</Text>
        <Text style={styles.body}>{copy.syntheticNote}</Text>
        {day ? <Text style={styles.phase}>{ui[day.phase]}</Text> : null}
        <Text style={styles.body}>{progress?.completed ? copy.complete : session ? copy.nextIn.replace('{{time}}', time) : copy.intro}</Text>
      </View>
      {errorText ? <View style={styles.status}><Text accessibilityRole="alert" style={styles.error}>{errorText}</Text>
        {error === 'permission' ? <Button label={copy.openSettings} variant="secondary" onPress={() => { void Linking.openSettings().catch(() => setError('permission')); }} /> : null}
        {error === 'load' ? <Button label={copy.retry} onPress={() => { void refresh(); void buildDemoDays(preferences.language).then(value => setContent({ language: preferences.language, days: value })).catch(() => setError('load')); }} /> : null}
      </View> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.body}>{copy.stopped}</Text> : null}
      <View style={styles.controls}>
        {session && !progress?.completed ? <Button label={copy.stop} disabled={busy} variant="secondary" onPress={() => { void stop(); }} />
          : <Button label={busy ? copy.preparing : session ? copy.restart : copy.start} disabled={busy || !days || session === undefined || error === 'load'} onPress={() => { void start(); }} />}
        {error === 'cleanup' ? <Button label={copy.retry} disabled={busy} variant="secondary" onPress={() => { void stop(); }} /> : null}
        <Button label={copy.close} disabled={busy} variant="ghost" onPress={close} />
      </View>
      {day ? <AdviceBlocks key={`${preferences.language}:${shownDay}`} advice={day.cue} date={day.date} /> : <ActivityIndicator color={colors.primary} />}
    </Screen>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  heading: { gap: 10, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  label: { color: colors.secondary, fontSize: 14, textAlign: 'center' },
  day: { color: colors.text, fontSize: 25, lineHeight: 34, fontWeight: '600', textAlign: 'center' },
  phase: { color: colors.text, fontSize: 18, textAlign: 'center' },
  body: { color: colors.secondary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  controls: { gap: 8, marginVertical: 12 },
  status: { gap: 10, marginVertical: 12 },
  error: { color: colors.danger, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
