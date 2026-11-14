import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Animated, AppState, BackHandler, Pressable, StyleSheet, useAnimatedValue, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { AppText as Text } from '../components/AppText';
import { useApp } from '../context/AppContext';

import { LaunchPresentationContext } from './LaunchPresentation';
import { SphereIntroSurface } from './SphereIntroSurface';
import { markAppIntroConsumed } from './introSession';
import { getLaunchCopy } from './launchCopy';
import { launchDestinationKey, launchRouteState } from './launchRouting';
import { createLaunchState, ForegroundLaunchClock, getLaunchPhase, LAUNCH_FADE_MS, reduceLaunch, shouldAnimateLaunch } from './launchState';
import { loadPremiumTypeface } from './premiumFont';

// A JS-runtime lifetime is a native cold launch. Navigation/AppState never resets it.
let completedThisRuntime = false;
markAppIntroConsumed();
const SILVER = { edge: '#DCE3E9', center: '#F9FBFC', ink: '#294458' };

export function GlobalLaunch({ children }: PropsWithChildren) {
  const { ready, accessReady, initializationError, initializationAttempt, retryInitialization, preferences, cycleSettings, hasAccess } = useApp();
  const path = usePathname();
  const navigation = useRootNavigationState();
  const routeKey = launchDestinationKey(initializationAttempt, path, hasAccess);
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reduceLaunch, undefined, () => ({
    ...createLaunchState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive'),
    fadeComplete: completedThisRuntime,
    attempt: initializationAttempt,
    destinationKey: routeKey,
  }));
  const [font, setFont] = useState<'loading' | 'ready' | 'error'>('loading');
  const [fontAttempt, setFontAttempt] = useState(0);
  const [view, setView] = useState({ width: 0, height: 0 });
  const elapsed = useSharedValue(0);
  const opacity = useAnimatedValue(completedThisRuntime ? 0 : 1);
  const [clock] = useState(() => new ForegroundLaunchClock());
  const active = useRef(state.active);
  const frame = useRef<number | null>(null);
  const splashHidden = useRef(false);
  useLayoutEffect(() => {
    dispatch({ type: 'destination-selected', attempt: initializationAttempt, key: routeKey });
  }, [initializationAttempt, routeKey]);
  const routeState = launchRouteState({ localReady: ready, accessReady, onboardingComplete: preferences.onboardingComplete, hasCycleSettings: Boolean(cycleSettings), pathname: path });
  const currentScreenPainted = state.destinationKey === routeKey && state.destinationReady && routeState === 'ready';
  const modelPhase = getLaunchPhase(state);
  const phase = modelPhase === 'fading' && !currentScreenPainted ? 'waiting' : modelPhase;
  const blocking = phase !== 'complete';
  const copy = getLaunchCopy(preferences.language);

  useEffect(() => {
    let alive = true;
    void loadPremiumTypeface().then(() => { if (alive) setFont('ready'); }).catch(() => { if (alive) setFont('error'); });
    return () => { alive = false; };
  }, [fontAttempt]);

  useEffect(() => {
    const localStatus = initializationError || font === 'error' ? 'error'
      : ready && font === 'ready' && (!(preferences.onboardingComplete && cycleSettings) || accessReady) ? 'ready' : 'loading';
    dispatch({ type: 'initialization', status: localStatus, attempt: initializationAttempt });
  }, [ready, accessReady, initializationError, initializationAttempt, preferences.onboardingComplete, cycleSettings, font]);

  useEffect(() => {
    if (routeState === 'onboarding' && font === 'ready' && navigation?.key) router.replace('/onboarding');
  }, [routeState, navigation?.key, font]);

  const reportScreenReady = useCallback((ownerPath?: string) => {
    // Kept-alive screens must not paint or invalidate a different current route.
    if (ownerPath && ownerPath !== path) return;
    dispatch({ type: 'destination-ready', attempt: initializationAttempt, key: routeKey });
  }, [routeKey, initializationAttempt, path]);
  const reportScreenNotReady = useCallback((ownerPath?: string) => {
    if (ownerPath && ownerPath !== path) return;
    dispatch({ type: 'destination-not-ready', attempt: initializationAttempt, key: routeKey });
  }, [routeKey, initializationAttempt, path]);

  // Generic screens have no asynchronous guidance surface to await. Today reports its own readiness.
  useEffect(() => {
    if (font !== 'ready' || routeState !== 'ready' || (path === '/today' && hasAccess)) return;
    let second: number | undefined;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => reportScreenReady()); });
    return () => { cancelAnimationFrame(first); if (second !== undefined) cancelAnimationFrame(second); };
  }, [font, routeState, path, hasAccess, reportScreenReady]);

  useEffect(() => {
    let alive = true;
    let reduced = false;
    let reader = false;
    let reducedEventSeen = false;
    let readerEventSeen = false;
    let queried = false;
    const update = () => { if (alive && queried) dispatch({ type: 'accessibility', reducedMotion: reduced, screenReader: reader }); };
    const reduceSub = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { reducedEventSeen = true; reduced = value; update(); });
    const readerSub = AccessibilityInfo.addEventListener('screenReaderChanged', value => { readerEventSeen = true; reader = value; update(); });
    void Promise.all([AccessibilityInfo.isReduceMotionEnabled(), AccessibilityInfo.isScreenReaderEnabled()]).then(([initialReduced, initialReader]) => {
      if (!reducedEventSeen) reduced = initialReduced;
      if (!readerEventSeen) reader = initialReader;
      queried = true; update();
    }).catch(() => { if (!reducedEventSeen) reduced = true; queried = true; update(); });
    return () => { alive = false; reduceSub.remove(); readerSub.remove(); };
  }, []);

  useEffect(() => {
    if (!blocking) return;
    clock.sample(performance.now(), active.current);
    const sample = () => {
      const deltaMs = clock.sample(performance.now(), active.current);
      if (deltaMs > 0) dispatch({ type: 'tick', deltaMs });
      frame.current = requestAnimationFrame(sample);
    };
    frame.current = requestAnimationFrame(sample);
    const sub = AppState.addEventListener('change', value => {
      const now = performance.now();
      const deltaMs = clock.sample(now, active.current);
      if (deltaMs > 0) dispatch({ type: 'tick', deltaMs });
      active.current = value === 'active';
      clock.sample(now, active.current);
      dispatch({ type: 'active', value: active.current });
    });
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); sub.remove(); };
  }, [clock, blocking]);

  useEffect(() => {
    if (!blocking) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [blocking]);

  const onFirstFrame = useCallback((kind: 'gpu' | 'fallback') => {
    dispatch({ type: 'first-frame', kind });
    // Image onLoad/GPU completion precedes the next native commit. Retain splash through that paint.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!splashHidden.current) {
        splashHidden.current = true;
        void SplashScreen.hideAsync().catch(() => { splashHidden.current = false; });
      }
    }));
  }, []);
  const onIntroComplete = useCallback(() => {
    const now = performance.now();
    clock.sample(now, false); clock.sample(now, active.current);
    dispatch({ type: 'intro-complete' });
  }, [clock]);

  useLayoutEffect(() => {
    if (phase !== 'fading') {
      if (phase !== 'complete') {
        // A route/access change may interrupt a partially completed fade. Keep the
        // animated silver cover opaque until the new destination has actually painted.
        opacity.stopAnimation();
        opacity.setValue(1);
      }
      return;
    }
    let alive = true;
    let animation: Animated.CompositeAnimation | undefined;
    opacity.stopAnimation(value => {
      if (!alive) return;
      animation = Animated.timing(opacity, {
        toValue: 0, duration: state.reducedMotion ? 0 : LAUNCH_FADE_MS * Math.max(0, value), useNativeDriver: true,
      });
      animation.start(({ finished }) => {
        if (finished && alive) {
          dispatch({ type: 'fade-complete', attempt: initializationAttempt, key: routeKey });
        }
      });
    });
    return () => { alive = false; animation?.stop(); };
  }, [phase, opacity, state.reducedMotion, initializationAttempt, routeKey]);

  useEffect(() => {
    if (state.fadeComplete) completedThisRuntime = true;
  }, [state.fadeComplete]);

  const retry = () => {
    dispatch({ type: 'retry' });
    retryInitialization();
    if (font === 'error') { setFont('loading'); setFontAttempt(value => value + 1); }
  };
  const prepareDestinationSpheres = !blocking || state.introComplete || state.reducedMotion || state.rendererFailed;
  const presentation = useMemo(() => ({ blocking, destinationSpheresVisible: !blocking, prepareDestinationSpheres, reducedMotion: state.reducedMotion, reportScreenReady, reportScreenNotReady }), [blocking, prepareDestinationSpheres, state.reducedMotion, reportScreenReady, reportScreenNotReady]);
  const target = useMemo(() => ({ x: view.width / 2, y: view.height / 2, radius: Math.max(1, Math.min(view.width * .38, view.height * .25, 180)) }), [view]);

  return <LaunchPresentationContext.Provider value={presentation}>
    <View style={styles.root} onLayout={event => {
      const { width, height } = event.nativeEvent.layout;
      setView(previous => previous.width === width && previous.height === height ? previous : { width, height });
    }}>
      <View style={styles.root} pointerEvents={blocking ? 'none' : 'auto'} accessibilityElementsHidden={blocking}
        importantForAccessibility={blocking ? 'no-hide-descendants' : 'auto'}>
        {/* Mount route text only after the real font is registered; initialization still runs in parallel. */}
        {font === 'ready' ? children : null}
      </View>
      {blocking && <Animated.View style={[StyleSheet.absoluteFill, styles.cover, { opacity }]}>
        <LinearGradient pointerEvents="none" colors={[SILVER.edge, SILVER.center, SILVER.edge]} locations={[0, .5, 1]}
          start={{ x: 0, y: .5 }} end={{ x: 1, y: .5 }} style={StyleSheet.absoluteFill} />
        {view.width > 0 && view.height > 0 && <SphereIntroSurface launch view={view} target={target} elapsed={elapsed} animate={shouldAnimateLaunch(state)}
          active={state.active} preferencesReady={state.accessibilityReady} reducedMotion={state.reducedMotion} ink={SILVER.ink}
          onFirstFrame={onFirstFrame} onComplete={onIntroComplete} onError={() => dispatch({ type: 'renderer-failed' })} />}
        {phase === 'error' && <View style={styles.error} accessibilityLiveRegion="polite">
          <Text systemFont={font !== 'ready'} accessibilityRole="alert" style={styles.errorText}>{copy.error}</Text>
          <Pressable onPress={retry} accessibilityRole="button" style={styles.retry}><Text systemFont={font !== 'ready'} style={styles.retryText}>{t('common.retry')}</Text></Pressable>
        </View>}
      </Animated.View>}
    </View>
  </LaunchPresentationContext.Provider>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SILVER.edge },
  cover: { backgroundColor: SILVER.edge, zIndex: 100 },
  error: { position: 'absolute', left: 24, right: 24, bottom: 56, gap: 16, alignItems: 'center' },
  errorText: { color: SILVER.ink, textAlign: 'center', fontSize: 17, lineHeight: 25 },
  retry: { minHeight: 54, minWidth: 160, backgroundColor: '#405D71', borderRadius: 20, paddingHorizontal: 24, justifyContent: 'center' },
  retryText: { color: '#FFFFFF', fontSize: 18, textAlign: 'center' },
});
