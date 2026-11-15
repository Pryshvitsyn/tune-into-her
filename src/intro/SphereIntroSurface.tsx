import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, runOnJS, type SharedValue, useAnimatedStyle, useFrameCallback, useSharedValue, withTiming } from 'react-native-reanimated';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { prepareSphereAsset } from '../../TuneIntoHerSphereV4';

import { ApprovedOpening } from './ApprovedOpening';
import { DestinationSphere, useLaunchPresentation } from './LaunchPresentation';
import { approvedOpeningOpacity } from './introPresentation';
import { makeSphereHtml } from './sphereHtml';
import { advanceSurfaceHandoff, type SurfaceHandoffStage } from './surfaceHandoff';
import { INTRO_MS, type Circle, type Size, validCircle } from './timeline';

export interface SphereIntroHandle { finish(): void }
export type IntroFirstFrame = 'gpu' | 'fallback';
interface Props {
  view: Size;
  target: Circle;
  elapsed: SharedValue<number>;
  animate: boolean;
  active: boolean;
  /** Cold launch waits for the native splash hide request; Home is already visible. */
  playbackAllowed?: boolean;
  preferencesReady: boolean;
  reducedMotion: boolean;
  ink: string;
  /** The global surface owns the visible sphere; destination surfaces wait for handoff. */
  launch?: boolean;
  /** Actual configured GPU frame or a loaded, visually compatible native fallback. */
  onFirstFrame?(kind: IntroFirstFrame): void;
  /** Launch-only: settled sphere has had a foreground presentation opportunity. */
  onAssembled?(): void;
  onComplete(): void;
  onError?(message: string): void;
}

function rgb(hex: string): number[] {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return [0.16, 0.27, 0.35];
  return [1,3,5].map(offset => parseInt(hex.slice(offset,offset+2),16)/255);
}

/** Shared launch/Today surface. The same WebView keeps animating V4 after completion. */
export const SphereIntroSurface = forwardRef<SphereIntroHandle, Props>(function SphereIntroSurface(
  {target, elapsed, animate, active, playbackAllowed = true, preferencesReady, reducedMotion, ink, launch = false, onFirstFrame, onAssembled, onComplete, onError}, forwardedRef,
) {
  const { prepareDestinationSpheres } = useLaunchPresentation();
  const preparationAllowed = launch || prepareDestinationSpheres;
  const web = useRef<WebView>(null);
  const alive = useRef(true);
  const [texture, setTexture] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [preparedForCommit, setPreparedForCommit] = useState(false);
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const posterFailureReported = useRef(false);
  const started = useRef(false);
  const skipped = useRef(false);
  const delivered = useRef(false);
  const assemblyDelivered = useRef(false);
  const firstFrameDelivered = useRef(false);
  const failedRef = useRef(false);
  const prepared = useRef(false);
  const released = useRef(false);
  const playbackActive = active && playbackAllowed;
  const activeRef = useRef(playbackActive);
  activeRef.current = playbackActive;
  const opening = animate && !reducedMotion && !finished && !skipped.current;
  const handoffStage = useSharedValue<SurfaceHandoffStage>(0);
  const uiActive = useSharedValue(playbackActive);
  const uiAlive = useSharedValue(true);
  const uiCoverReady = useSharedValue(false);
  const callbacks = useRef({onFirstFrame,onAssembled,onComplete,onError});
  callbacks.current = {onFirstFrame,onAssembled,onComplete,onError};

  const complete = useCallback(() => {
    if (!alive.current || delivered.current) return;
    delivered.current = true;
    callbacks.current.onComplete();
  }, []);
  const firstFrame = useCallback((kind: IntroFirstFrame) => {
    if (!alive.current || firstFrameDelivered.current) return;
    firstFrameDelivered.current = true;
    callbacks.current.onFirstFrame?.(kind);
  }, []);
  const send = useCallback((command: object) => {
    if (!alive.current) return;
    const data = JSON.stringify(command).replace(/</g, '\\u003c');
    web.current?.injectJavaScript(`window.__TIH_CONTROL__ && window.__TIH_CONTROL__(${data}); true;`);
  }, []);
  const releasePrepared = useCallback((token: number) => {
    if (!alive.current || failedRef.current || !prepared.current || released.current || token !== 1) return;
    if (!activeRef.current) {
      // Activity or native splash ownership may change after this callback was queued.
      // Re-present the opaque cover before retrying; a backgrounded display
      // callback is not proof that its pending reveal reached the screen.
      handoffStage.value = 1;
      return;
    }
    released.current = true;
    setFrameReady(true);
    firstFrame('gpu');
    send({ type: 'release', token });
  }, [firstFrame, handoffStage, send]);
  const onHandoffFrame = useCallback(() => {
    'worklet';
    const next = advanceSurfaceHandoff(handoffStage.value, uiAlive.value && uiActive.value && uiCoverReady.value);
    handoffStage.value = next.stage;
    if (next.release) runOnJS(releasePrepared)(1);
  }, [handoffStage,releasePrepared,uiActive,uiAlive,uiCoverReady]);
  const handoffFrames = useFrameCallback(onHandoffFrame, false);
  const gpuStyle = useAnimatedStyle(() => ({ opacity: handoffStage.value > 0 ? 1 : 0 }));
  const coverStyle = useAnimatedStyle(() => ({ opacity: handoffStage.value < 4 ? 1 : 0 }));
  const photographStyle = useAnimatedStyle(() => ({
    opacity: handoffStage.value < 4 ? 1 : approvedOpeningOpacity(elapsed.value),
  }));
  const fail = useCallback((message: string) => {
    if (!alive.current || failedRef.current) return;
    failedRef.current = true;
    send({type:'dispose'});
    setFailed(true);
    setFinished(true);
    handoffStage.value = 0;
    cancelAnimation(elapsed);
    elapsed.value = INTRO_MS;
    callbacks.current.onError?.(message);
    // Completion waits for the preloaded native poster to be committed below.
  }, [elapsed,handoffStage,send]);
  const finish = useCallback(() => {
    if (!alive.current) return;
    skipped.current = true;
    setFinished(true);
    cancelAnimation(elapsed);
    elapsed.value = INTRO_MS;
    send({type:'finish'});
    // Before GPU commitment, the already-preloaded original poster owns skip.
    if (frameReady) complete();
  }, [complete,elapsed,frameReady,send]);
  useImperativeHandle(forwardedRef, () => ({finish}), [finish]);

  useEffect(() => {
    alive.current = true;
    uiAlive.value = true;
    return () => {
      alive.current = false;
      uiAlive.value = false;
      cancelAnimation(elapsed);
      // Native WebView destruction triggers its beforeunload GPU cleanup. Do not
      // dispose a still-mounted WebView during React's StrictMode effect replay.
    };
  }, [elapsed,uiAlive]);
  useEffect(() => {
    uiActive.value = playbackActive;
    if (!playbackActive && prepared.current && !released.current && !failedRef.current) handoffStage.value = 1;
  }, [playbackActive,handoffStage,uiActive]);
  useEffect(() => {
    uiCoverReady.value = !opening || coverLoaded;
  }, [opening,coverLoaded,uiCoverReady]);
  useEffect(() => {
    handoffFrames.setActive(preparedForCommit && !frameReady && !failed);
    return () => handoffFrames.setActive(false);
  }, [handoffFrames,preparedForCommit,frameReady,failed]);
  useEffect(() => {
    let current = true;
    prepareSphereAsset().then(value => {if(current && alive.current) setTexture(value);})
      .catch(error => {if(current) fail(`V4 asset: ${String(error)}`);});
    return () => {current=false;};
  }, [fail]);
  useEffect(() => {
    // A healthy prepared frame may wait indefinitely for native ownership/activity.
    if (frameReady || preparedForCommit || failed || !active || !preparationAllowed) return;
    const timer = setTimeout(() => fail('V4 first frame timed out; using the bundled poster.'), 12000);
    return () => clearTimeout(timer);
  }, [frameReady,preparedForCommit,failed,active,preparationAllowed,fail]);

  // HTML source does not change with text, theme, target rectangle, focus or animation time.
  const source = useMemo(() => texture ? {html:makeSphereHtml(texture)} : null, [texture]);
  useEffect(() => {
    if (!ready || failed || !validCircle(target)) return;
    send({type:'configure',target,ink:rgb(ink)});
  }, [ready,failed,target,ink,send]);
  useEffect(() => {
    if(!ready || failed) return;
    send({type:'active',value:playbackActive});
    if(!playbackActive) cancelAnimation(elapsed);
  }, [playbackActive,ready,failed,elapsed,send]);
  useEffect(() => {
    if(!ready || failed || !preparationAllowed || !preferencesReady || !active || !validCircle(target) || started.current) return;
    started.current = true;
    send({type:'configure',target,ink:rgb(ink)});
    send({type:'prepare',animate:animate && !skipped.current,reducedMotion,photographicOpening:true,launch,token:1});
  }, [ready,failed,preparationAllowed,preferencesReady,active,target,animate,reducedMotion,ink,launch,send]);
  useEffect(() => {
    if(ready && started.current && !failed) send({type:'reduce-motion',value:reducedMotion});
  }, [ready,reducedMotion,failed,send]);

  const posterVisible = failed || (!frameReady && !opening);
  useEffect(() => {
    if (opening && !failed && coverLoaded) firstFrame('fallback');
  }, [opening,failed,coverLoaded,firstFrame]);
  useEffect(() => {
    if (!posterVisible || (!posterLoaded && !posterFailed)) return;
    if (posterFailed && !posterFailureReported.current) {
      posterFailureReported.current = true;
      callbacks.current.onError?.('Bundled V4 poster failed; using the compatible launch background.');
    }
    firstFrame('fallback');
    if (failed || posterFailed || !animate || reducedMotion || skipped.current) complete();
  }, [posterVisible,posterLoaded,posterFailed,failed,animate,reducedMotion,firstFrame,complete]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    if (!alive.current) return;
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string; token?: number; elapsed?: number; running?: boolean; started?: boolean; message?: string;
      };
      if(data.type === 'ready') {
        if(failedRef.current) {send({type:'dispose'}); return;}
        setReady(true);
      } else if(data.type === 'prepared' && data.token === 1 && started.current && !failedRef.current && !released.current) {
        cancelAnimation(elapsed);
        elapsed.value = Math.max(0,Math.min(INTRO_MS,data.elapsed ?? 0));
        if (!prepared.current) {
          prepared.current = true;
          handoffStage.value = 1;
          setPreparedForCommit(true);
        }
      } else if(data.type === 'clock' && typeof data.elapsed === 'number' && released.current && !failedRef.current) {
        // GPU elapsed is the clock anchor. Never advance it for JS-bridge wall time.
        const t = Math.max(0,Math.min(INTRO_MS,data.elapsed));
        cancelAnimation(elapsed);
        elapsed.value=t;
        if(data.running && t<INTRO_MS) {
          elapsed.value=withTiming(INTRO_MS,{duration:INTRO_MS-t,easing:Easing.linear,reduceMotion:ReduceMotion.Never});
        }
      } else if(data.type === 'assembled') {
        if (!launch || !released.current || failedRef.current || assemblyDelivered.current) return;
        assemblyDelivered.current = true;
        callbacks.current.onAssembled?.();
      } else if(data.type === 'complete') {
        if (!released.current) return;
        setFinished(true);
        // Launch completion is a presentation milestone, not scene time9000.
        // Keep atmosphere/material motion continuous throughout readiness and fade.
        if (!launch) {cancelAnimation(elapsed); elapsed.value=INTRO_MS;}
        complete();
      } else if(data.type === 'error') {
        fail(data.message || 'V4 renderer failed');
      }
    } catch(error) {
      if(__DEV__) console.warn('[Tune Into Her intro] Invalid WebView message',error);
    }
  }, [complete,elapsed,fail,handoffStage,launch,send]);

  const content = <View testID={frameReady && !failed ? 'intro-owner-gpu' : 'intro-owner-fallback'} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    {source ? <Animated.View testID="intro-gpu-surface" style={[StyleSheet.absoluteFill,gpuStyle]}><WebView
      ref={web}
      source={source}
      originWhitelist={['*']}
      onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url === 'about:srcdoc' || request.url.startsWith('data:text/html')}
      javaScriptEnabled
      scrollEnabled={false}
      bounces={false}
      mixedContentMode="never"
      allowFileAccess={false}
      onMessage={onMessage}
      onError={() => fail('WebView error; using the bundled V4 poster.')}
      onContentProcessDidTerminate={() => fail('iOS WebView process terminated.')}
      onRenderProcessGone={() => {fail('Android WebView process terminated.');}}
      style={[StyleSheet.absoluteFill,{backgroundColor:'transparent'}]}
      containerStyle={{backgroundColor:'transparent'}}
      androidLayerType="hardware"
    /></Animated.View> : null}
    {/* The consumed/reduced-motion alternative is always the original V4 poster. */}
    <Animated.View style={[StyleSheet.absoluteFill,coverStyle]}>
      <Image
        source={require('../../assets/tune_into_her_sphere_phase0_poster.png')}
        resizeMode="contain" fadeDuration={0}
        onLoad={() => {if (alive.current) setPosterLoaded(true);}}
        onError={() => {if (alive.current) setPosterFailed(true);}}
        style={{position:'absolute',left:target.x-target.radius,top:target.y-target.radius,width:target.radius*2,height:target.radius*2,opacity:posterVisible?1:0}}
      />
    </Animated.View>
    {opening && !failed ? <Animated.View testID="intro-native-cover" style={[StyleSheet.absoluteFill,photographStyle]}>
      <ApprovedOpening onReady={() => { if (alive.current) setCoverLoaded(true); }}
        onError={() => fail('Approved opening photograph failed; using the V4 poster.')} />
    </Animated.View> : null}
  </View>;
  return launch ? content : <DestinationSphere style={StyleSheet.absoluteFill}>{content}</DestinationSphere>;
});
