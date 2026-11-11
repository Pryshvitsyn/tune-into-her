import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TuneIntoHerSphereV4 } from '../TuneIntoHerSphereV4';
import { useApp } from '../src/context/AppContext';
import { getLocalizedCue } from '../src/domain/content/contentRepository';
import { selectDailyCue } from '../src/domain/content/dailyCueService';
import { estimateCycle } from '../src/domain/cycle/cycleEngine';
import { toDateOnly } from '../src/domain/cycle/dateOnly';
import { AsyncSelectionStore } from '../src/storage/AsyncSelectionStore';

const selectionStore = new AsyncSelectionStore();

export default function TodayScreen() {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const { cycleSettings, preferences, entitlement } = useApp();

  const [cueId, setCueId] = useState<string | null>(null);
  const [stageHeight, setStageHeight] = useState(0);

  const today = toDateOnly(new Date());
  const estimate = useMemo(
    () =>
      cycleSettings
        ? estimateCycle({ ...cycleSettings, currentLocalDate: today })
        : null,
    [cycleSettings, today]
  );

  useEffect(() => {
    if (!cycleSettings || !estimate) return;
    void selectDailyCue({
      date: today,
      phase: estimate.estimatedPhase,
      settings: cycleSettings,
      store: selectionStore,
    }).then(setCueId);
  }, [cycleSettings, estimate, today]);

  if (!cycleSettings || !estimate) return null;

  const cue = cueId ? getLocalizedCue(preferences.language, cueId) : null;

  const cueData = cue as unknown as {
    howSheMayFeel?: string;
    whatYouCanDo?: string;
    practicalMoves?: string[];
    context?: string;
    cue?: string;
  } | null;

  const howSheMayFeel =
    cueData?.howSheMayFeel ??
    cueData?.context ??
    '';

  const whatYouCanDo =
    cueData?.whatYouCanDo ??
    cueData?.cue ??
    '';

  const practicalMoves = Array.isArray(cueData?.practicalMoves)
    ? cueData.practicalMoves.slice(0, 3)
    : [];

  const compact = height < 760;

  const sphereSize = Math.round(
    Math.min(
      compact ? 248 : 278,
      Math.max(224, Math.min(width - 76, height * (compact ? 0.30 : 0.325)))
    )
  );

  const sphereTop = stageHeight > 0 ? (stageHeight - sphereSize) / 2 : 0;
  const sphereBottom = sphereTop + sphereSize;
  const sphereVisible = entitlement.isActive && stageHeight > 0;

  const onStageLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (Math.abs(next - stageHeight) > 1) setStageHeight(next);
  };

  return (
    <View style={styles.background}>
      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.94)', 'rgba(255,255,255,0)']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.centerLight} />
      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.86)', 'rgba(255,255,255,0)']} locations={[0, 0.46, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.centerLight} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.page}>
          <View style={styles.header}>
            <View style={styles.phaseBlock}>
              <Text style={styles.phaseEyebrow}>
                {t('todayV2.phaseTitle')}
              </Text>
              <Text style={styles.phaseValue}>
                {t(`phase.${estimate.estimatedPhase}`)}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('today.settings', { defaultValue: 'Settings' })}
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [
                styles.settingsButton,
                pressed && styles.pressed,
              ]}
              hitSlop={10}
            >
              <Text style={styles.settingsText}>{t('today.settings', { defaultValue: 'Settings' })}</Text>
            </Pressable>
          </View>

          <View style={styles.stage} onLayout={onStageLayout}>
            <View
              pointerEvents="none"
              style={[
                styles.sphereWrap,
                {
                  top: sphereTop,
                  width: sphereSize,
                  height: sphereSize,
                },
                !sphereVisible && styles.sphereHidden,
              ]}
            >
              <TuneIntoHerSphereV4 size={sphereSize} />
            </View>

          {!entitlement.isActive ? (
            <View style={styles.locked}>
              <Text style={styles.lockedTitle}>
                {t('today.lockedTitle', { defaultValue: 'Stay tuned in.' })}
              </Text>
              <Text style={styles.lockedBody}>
                {t('today.lockedBody', {
                  defaultValue: 'Start your trial to see today’s cue.',
                })}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/paywall')}
                style={({ pressed }) => [
                  styles.unlockButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.unlockText}>
                  {t('today.unlock', { defaultValue: 'Continue' })}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {!cue || stageHeight === 0 ? (
                <ActivityIndicator style={styles.loader} color="#44647E" />
              ) : (
                <>
                  <View
                    pointerEvents="none"
                    style={[
                      styles.topZone,
                      { top: 0, height: sphereTop },
                    ]}
                  >
                    <View style={styles.topCopy}>
                    <Text style={[styles.mainMessage, compact && styles.mainMessageCompact]}>
                      {howSheMayFeel}
                    </Text>
                    <Text style={[styles.mainMessage, compact && styles.mainMessageCompact]}>
                      {whatYouCanDo}
                    </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.bottomZone,
                      {
                        top: sphereBottom,
                        height: Math.max(0, stageHeight - sphereBottom),
                      },
                    ]}
                  >
                    <View style={styles.practical}>
                      <Text style={styles.practicalLabel}>
                        {t('todayV2.actionsTitle')}
                      </Text>
                      <View style={styles.moves}>
                        {practicalMoves.map((move, index) => (
                          <Text
                            key={`${cueId}-${index}`}
                            style={[styles.move, compact && styles.moveCompact]}
                          >
                            {index + 1}. {move}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>
                </>
              )}
            </>
          )}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/learn/[phase]',
                    params: { phase: estimate.estimatedPhase },
                  })
                }
                style={({ pressed }) => [
                  styles.footerButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.footerActionText}>
                  {t('today.learnMore', { defaultValue: 'Learn more' })}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/cycle')}
                style={({ pressed }) => [
                  styles.footerButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.updateText}>
                  {t('today.update', { defaultValue: 'Update cycle' })}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.timing}>
              {t('todayV2.timing')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#B8C1C8' },
  centerLight: { ...StyleSheet.absoluteFill },
  safe: { flex: 1, backgroundColor: 'transparent' },
  page: { flex: 1, paddingHorizontal: 18 },

  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  phaseBlock: { paddingTop: 7 },
  phaseEyebrow: {
    color: '#71879A',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  phaseValue: {
    color: '#4E6A80',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.65,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  settingsButton: {
    minWidth: 54,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  settingsText: {
    color: '#4E6A80',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.65,
  },

  stage: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
  },

  topZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 18,
  },
  topCopy: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  mainMessage: {
    maxWidth: 330,
    color: '#29465D',
    fontSize: 16,
    lineHeight: 20.5,
    fontWeight: '600',
    letterSpacing: -0.18,
    textAlign: 'center',
  },
  mainMessageCompact: {
    fontSize: 15,
    lineHeight: 19,
    maxWidth: 315,
  },

  sphereWrap: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereHidden: { opacity: 0 },

  bottomZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
  },
  practical: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  practicalLabel: {
    color: '#52718A',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.55,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  moves: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    marginTop: 11,
  },
  move: {
    width: '100%',
    maxWidth: 350,
    color: '#2F4D64',
    fontSize: 14.5,
    lineHeight: 18.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  moveCompact: {
    fontSize: 13.5,
    lineHeight: 17,
  },

  footer: {
    paddingTop: 5,
    paddingBottom: 5,
  },
  footerActions: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerButton: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  footerActionText: {
    color: '#597487',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  updateText: {
    color: '#597487',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  timing: {
    color: '#7890A2',
    fontSize: 9.5,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 2,
  },

  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  lockedTitle: {
    color: '#29465D',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedBody: {
    color: '#526D82',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  unlockButton: {
    minHeight: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.62)',
    marginTop: 20,
  },
  unlockText: {
    color: '#315C7B',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: { opacity: 0.72 },
});
