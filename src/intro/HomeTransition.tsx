import { router, usePathname } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, AppState, BackHandler, StyleSheet, useAnimatedValue, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { useApp } from '../context/AppContext';
import { todayEntry } from '../domain/navigation/todayEntry';
import { useTheme } from '../theme/useTheme';

import { HomeTransitionContext } from './HomeTransitionContext';
import { IntroAtmosphere } from './IntroAtmosphere';
import { LaunchPresentationContext, useLaunchPresentation } from './LaunchPresentation';
import { SphereIntroSurface } from './SphereIntroSurface';
import { INTRO_BACKGROUND_COLOR } from './brandBackground.generated';
import { initialHomeTransition, reduceHomeTransition, type HomeTransitionEvent } from './homeTransitionState';
import { markAppIntroConsumed } from './introSession';
import { LAUNCH_FADE_MS } from './launchState';

/** Same approved scene in an in-app cover; no native splash API or application restart. */
export function HomeTransition({ children }: PropsWithChildren) {
  const parent = useLaunchPresentation();
  const { reportScreenReady: parentReady, reportScreenNotReady: parentNotReady } = parent;
  const { dark } = useTheme();
  const { ready, preferences, hasAccess, cycleSettings, dataScope } = useApp();
  const waitForSphere = todayEntry({ ready, onboardingComplete: preferences.onboardingComplete, hasCycleSettings: Boolean(cycleSettings), hasAccess }) === 'guidance';
  const path = usePathname();
  const [state, dispatch] = useReducer(reduceHomeTransition, initialHomeTransition);
  const current = useRef(state);
  const pathRef = useRef(path);
  const scopeRef = useRef(dataScope);
  useLayoutEffect(() => { pathRef.current = path; scopeRef.current = dataScope; }, [path, dataScope]);
  const painted = useRef<string | null>(null);
  const [paintRevision, repaint] = useState(0);
  const [view, setView] = useState({ width: 0, height: 0 });
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [introDarkContent, setIntroDarkContent] = useState(true);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [motion, setMotion] = useState({ ready: false, reduced: true });
  const elapsed = useSharedValue(0);
  const opacity = useAnimatedValue(1);
  const active = state.phase !== 'idle';
  const palette = dark ? { edge: '#10171E', center: '#26313D', ink: '#E5EDF4' } : { edge: '#DCE3E9', center: '#F9FBFC', ink: '#294458' };
  const send = useCallback((event: HomeTransitionEvent) => {
    current.current = reduceHomeTransition(current.current, event);
    dispatch(event);
  }, []);
  useEffect(() => {
    let alive = true, reduced = false, reader = false, queried = false;
    let reducedEvent = false, readerEvent = false;
    const update = () => { if (alive && queried) setMotion({ ready: true, reduced: reduced || reader }); };
    const reduceSub = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { reducedEvent = true; reduced = value; update(); });
    const readerSub = AccessibilityInfo.addEventListener('screenReaderChanged', value => { readerEvent = true; reader = value; update(); });
    void Promise.all([AccessibilityInfo.isReduceMotionEnabled(), AccessibilityInfo.isScreenReaderEnabled()]).then(([r, s]) => {
      if (!reducedEvent) reduced = r; if (!readerEvent) reader = s; queried = true; update();
    }).catch(() => { queried = true; reduced = true; update(); });
    const app = AppState.addEventListener('change', status => setForeground(status === 'active'));
    return () => { alive = false; reduceSub.remove(); readerSub.remove(); app.remove(); };
  }, []);
  const returnHome = useCallback(() => {
    if (parent.blocking || current.current.phase !== 'idle') return;
    painted.current = null;
    setBackgroundReady(false);
    setIntroDarkContent(true);
    opacity.stopAnimation(); opacity.setValue(1); elapsed.set(0);
    markAppIntroConsumed();
    send({ type: 'start', id: current.current.id + 1 });
  }, [parent.blocking, opacity, elapsed, send]);
  const complete = useCallback(() => {
    if (current.current.phase !== 'playing') return;
    send({ type: 'complete', id: current.current.id });
    if (pathRef.current !== '/today') router.dismissTo('/today');
  }, [send]);
  const reportScreenReady = useCallback((owner?: string) => {
    parentReady(owner);
    if (owner === '/today' && pathRef.current === '/today' && scopeRef.current === dataScope) { painted.current = dataScope; repaint(value => value + 1); }
  }, [parentReady, dataScope]);
  const reportScreenNotReady = useCallback((owner?: string) => {
    parentNotReady(owner);
    if (owner !== '/today' || pathRef.current !== '/today' || scopeRef.current !== dataScope) return;
    painted.current = null;
    send({ type: 'not-ready', id: current.current.id });
  }, [parentNotReady, dataScope, send]);
  useEffect(() => {
    if ((state.phase === 'routing' || state.phase === 'fading') && path !== '/today') {
      painted.current = null;
      send({ type: 'not-ready', id: state.id });
      router.dismissTo('/today');
    }
  }, [state.phase, state.id, path, send]);
  useEffect(() => {
    if (state.phase !== 'routing' || path !== '/today' || !foreground) return;
    if (waitForSphere && painted.current !== dataScope) return;
    const id = state.id;
    let second: number | undefined;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => {
      if (pathRef.current === '/today' && (painted.current === dataScope || !waitForSphere)) send({ type: 'ready', id });
    }); });
    return () => { cancelAnimationFrame(first); if (second !== undefined) cancelAnimationFrame(second); };
  }, [state.phase, state.id, path, foreground, waitForSphere, dataScope, paintRevision, send]);
  useEffect(() => {
    if (state.phase !== 'fading' || path !== '/today' || !foreground) { opacity.stopAnimation(); if (active) opacity.setValue(1); return; }
    let alive = true;
    const id = state.id;
    const animation = Animated.timing(opacity, { toValue: 0, duration: motion.reduced ? 0 : LAUNCH_FADE_MS, useNativeDriver: true });
    animation.start(({ finished }) => { if (alive && finished && pathRef.current === '/today' && scopeRef.current === dataScope) send({ type: 'finished', id }); });
    return () => { alive = false; animation.stop(); };
  }, [state.phase, state.id, path, dataScope, active, foreground, motion.reduced, opacity, send]);
  useEffect(() => {
    if (!active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [active]);
  const presentation = useMemo(() => ({ ...parent, blocking: parent.blocking || active,
    introStatusBarStyle: active ? (introDarkContent ? 'dark' as const : 'light' as const) : parent.introStatusBarStyle,
    destinationSpheresVisible: parent.destinationSpheresVisible && !active,
    reducedMotion: motion.reduced, reportScreenReady, reportScreenNotReady,
  }), [parent, active, introDarkContent, motion.reduced, reportScreenReady, reportScreenNotReady]);
  const home = useMemo(() => ({ active, pauseDestination: state.phase === 'playing', returnHome }), [active, state.phase, returnHome]);
  const target = { x: view.width / 2, y: view.height / 2, radius: Math.max(1, Math.min(view.width * .38, view.height * .25, 180)) };
  return <HomeTransitionContext.Provider value={home}><LaunchPresentationContext.Provider value={presentation}>
    <View style={styles.root} onLayout={event => { const { width, height } = event.nativeEvent.layout; setView(old => old.width === width && old.height === height ? old : { width, height }); }}>
      <View style={styles.root} pointerEvents={active ? 'none' : 'auto'} accessibilityElementsHidden={active} importantForAccessibility={active ? 'no-hide-descendants' : 'auto'}>{children}</View>
      {active ? <Animated.View testID="home-transition" style={[StyleSheet.absoluteFill, { opacity, zIndex: 200, backgroundColor: INTRO_BACKGROUND_COLOR }]}>
        <IntroAtmosphere elapsed={elapsed} dark={dark} onReady={() => setBackgroundReady(true)} onContrastChange={setIntroDarkContent} />
        {motion.ready && view.width > 0 && view.height > 0 ? <SphereIntroSurface key={state.id} launch view={view} target={target} elapsed={elapsed}
          animate={!motion.reduced} active={foreground} preferencesReady={motion.ready && backgroundReady} reducedMotion={motion.reduced} ink={palette.ink}
          onComplete={complete} /> : null}
      </Animated.View> : null}
    </View>
  </LaunchPresentationContext.Provider></HomeTransitionContext.Provider>;
}
const styles = StyleSheet.create({ root: { flex: 1 } });
