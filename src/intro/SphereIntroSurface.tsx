import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { cancelAnimation, Easing, ReduceMotion, type SharedValue, withTiming } from 'react-native-reanimated';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { prepareSphereAsset } from '../../TuneIntoHerSphereV4';

import { DestinationSphere, useLaunchPresentation } from './LaunchPresentation';
import { BRAND_TEXTURE_URI, PADDED_LOGO_WIDTH_SCALE, PADDED_LOGO_HEIGHT_SCALE } from './brandTexture.generated';
import { makeSphereHtml } from './sphereHtml';
import { INTRO_MS, type Circle, type Size, validCircle } from './timeline';

export interface SphereIntroHandle { finish(): void }
export type IntroFirstFrame = 'gpu' | 'fallback';
interface Props {
  view: Size;
  target: Circle;
  elapsed: SharedValue<number>;
  animate: boolean;
  active: boolean;
  preferencesReady: boolean;
  reducedMotion: boolean;
  ink: string;
  /** The global surface owns the visible sphere; destination surfaces wait for handoff. */
  launch?: boolean;
  /** Actual configured GPU frame or a loaded, visually compatible native fallback. */
  onFirstFrame?(kind: IntroFirstFrame): void;
  onComplete(): void;
  onError?(message: string): void;
}

function rgb(hex: string): number[] {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return [0.16, 0.27, 0.35];
  return [1,3,5].map(offset => parseInt(hex.slice(offset,offset+2),16)/255);
}

/** Shared launch/Today surface. The same WebView keeps animating V4 after completion. */
export const SphereIntroSurface = forwardRef<SphereIntroHandle, Props>(function SphereIntroSurface(
  {view, target, elapsed, animate, active, preferencesReady, reducedMotion, ink, launch = false, onFirstFrame, onComplete, onError}, forwardedRef,
) {
  const { prepareDestinationSpheres } = useLaunchPresentation();
  const preparationAllowed = launch || prepareDestinationSpheres;
  const web = useRef<WebView>(null);
  const alive = useRef(true);
  const [texture, setTexture] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const posterFailureReported = useRef(false);
  const started = useRef(false);
  const skipped = useRef(false);
  const delivered = useRef(false);
  const firstFrameDelivered = useRef(false);
  const failedRef = useRef(false);
  const callbacks = useRef({onFirstFrame,onComplete,onError});
  callbacks.current = {onFirstFrame,onComplete,onError};

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
  const fail = useCallback((message: string) => {
    if (!alive.current || failedRef.current) return;
    failedRef.current = true;
    send({type:'dispose'});
    setFailed(true);
    setFinished(true);
    cancelAnimation(elapsed);
    elapsed.value = INTRO_MS;
    callbacks.current.onError?.(message);
    // Completion waits for the preloaded native poster to be committed below.
  }, [elapsed,send]);
  const finish = useCallback(() => {
    if (!alive.current) return;
    skipped.current = true;
    setFinished(true);
    cancelAnimation(elapsed);
    elapsed.value = INTRO_MS;
    send({type:'finish'});
    complete();
  }, [complete,elapsed,send]);
  useImperativeHandle(forwardedRef, () => ({finish}), [finish]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      cancelAnimation(elapsed);
      // Native WebView destruction triggers its beforeunload GPU cleanup. Do not
      // dispose a still-mounted WebView during React's StrictMode effect replay.
    };
  }, [elapsed]);
  useEffect(() => {
    let current = true;
    prepareSphereAsset().then(value => {if(current && alive.current) setTexture(value);})
      .catch(error => {if(current) fail(`V4 asset: ${String(error)}`);});
    return () => {current=false;};
  }, [fail]);
  useEffect(() => {
    if (frameReady || failed || !active || !preparationAllowed) return;
    const timer = setTimeout(() => fail('V4 first frame timed out; using the bundled poster.'), 12000);
    return () => clearTimeout(timer);
  }, [frameReady,failed,active,preparationAllowed,fail]);

  // HTML source does not change with text, theme, target rectangle, focus or animation time.
  const source = useMemo(() => texture ? {html:makeSphereHtml(texture)} : null, [texture]);
  useEffect(() => {
    if (!ready || failed || !validCircle(target)) return;
    send({type:'configure',target,ink:rgb(ink)});
  }, [ready,failed,target,ink,send]);
  useEffect(() => {
    if(!ready || failed) return;
    send({type:'active',value:active});
    if(!active) cancelAnimation(elapsed);
  }, [active,ready,failed,elapsed,send]);
  useEffect(() => {
    if(!ready || failed || !preferencesReady || !active || !validCircle(target) || started.current) return;
    started.current = true;
    send({type:'configure',target,ink:rgb(ink)});
    send({type:'start',animate:animate && !skipped.current,reducedMotion});
  }, [ready,failed,preferencesReady,active,target,animate,reducedMotion,ink,send]);
  useEffect(() => {
    if(ready && started.current && !failed) send({type:'reduce-motion',value:reducedMotion});
  }, [ready,reducedMotion,failed,send]);

  const opening = animate && !reducedMotion && !finished && !skipped.current;
  const posterVisible = failed || (!frameReady && !opening);
  useEffect(() => {
    if (!posterVisible || (!posterLoaded && !posterFailed)) return;
    if (posterFailed && !posterFailureReported.current) {
      posterFailureReported.current = true;
      callbacks.current.onError?.('Bundled V4 poster failed; using the compatible launch background.');
    }
    firstFrame('fallback');
    if (failed || posterFailed || !animate || reducedMotion) complete();
  }, [posterVisible,posterLoaded,posterFailed,failed,animate,reducedMotion,firstFrame,complete]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    if (!alive.current) return;
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string; elapsed?: number; wallClock?: number; running?: boolean; started?: boolean; message?: string;
      };
      if(data.type === 'ready') {
        if(failedRef.current) {send({type:'dispose'}); return;}
        setReady(true);
      } else if(data.type === 'clock' && typeof data.elapsed === 'number') {
        if (data.started && !failedRef.current) {
          setFrameReady(true);
          firstFrame('gpu');
        }
        // Account for the small bridge delay; do not send animation frames over the bridge.
        const delay = data.running && typeof data.wallClock === 'number'
          ? Math.max(0,Math.min(150,Date.now()-data.wallClock)) : 0;
        const t = Math.max(0,Math.min(INTRO_MS,data.elapsed+delay));
        cancelAnimation(elapsed);
        elapsed.value=t;
        if(data.running && t<INTRO_MS) {
          elapsed.value=withTiming(INTRO_MS,{duration:INTRO_MS-t,easing:Easing.linear,reduceMotion:ReduceMotion.Never});
        }
      } else if(data.type === 'complete') {
        cancelAnimation(elapsed); elapsed.value=INTRO_MS; complete();
      } else if(data.type === 'error') {
        fail(data.message || 'V4 renderer failed');
      }
    } catch(error) {
      if(__DEV__) console.warn('[Tune Into Her intro] Invalid WebView message',error);
    }
  }, [complete,elapsed,fail,firstFrame,send]);

  const logoWidth = Math.min(view.width*.76,420);
  const paddedWidth = logoWidth * PADDED_LOGO_WIDTH_SCALE;
  const paddedHeight = logoWidth * PADDED_LOGO_HEIGHT_SCALE;
  const content = <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    {/* Decode once even during the logo phase: an error cannot expose a blank frame. */}
    <Image
      source={require('../../assets/tune_into_her_sphere_phase0_poster.png')}
      resizeMode="contain" fadeDuration={0}
      onLoad={() => {if (alive.current) setPosterLoaded(true);}}
      onError={() => {if (alive.current) setPosterFailed(true);}}
      style={{position:'absolute',left:target.x-target.radius,top:target.y-target.radius,width:target.radius*2,height:target.radius*2,opacity:posterVisible?1:0}}
    />
    {!frameReady && ((opening && !failed) || (failed && !posterLoaded)) ? <View style={{position:'absolute',left:(view.width-paddedWidth)/2,top:(view.height-paddedHeight)/2,width:paddedWidth,height:paddedHeight}}>
      <Image source={{uri:BRAND_TEXTURE_URI}} resizeMode="contain" fadeDuration={0}
        onLoad={() => firstFrame('fallback')}
        onError={() => fail('Bundled launch logo failed; using the V4 poster.')}
        style={{width:paddedWidth,height:paddedHeight,tintColor:ink}} />
    </View> : null}
    {source ? <WebView
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
      style={[StyleSheet.absoluteFill,{backgroundColor:'transparent',opacity:frameReady && !failed?1:0}]}
      containerStyle={{backgroundColor:'transparent'}}
      androidLayerType="hardware"
    /> : null}
  </View>;
  return launch ? content : <DestinationSphere style={StyleSheet.absoluteFill}>{content}</DestinationSphere>;
});
