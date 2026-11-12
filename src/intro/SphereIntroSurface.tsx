import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { cancelAnimation, Easing, ReduceMotion, type SharedValue, withTiming } from 'react-native-reanimated';

import { prepareSphereAsset } from '../../TuneIntoHerSphereV4';
import { BRAND_TEXTURE_URI, PADDED_LOGO_WIDTH_SCALE, PADDED_LOGO_HEIGHT_SCALE } from './brandTexture.generated';
import { makeSphereHtml } from './sphereHtml';
import { INTRO_MS, type Circle, type Size, validCircle } from './timeline';

export interface SphereIntroHandle { finish(): void }
interface Props {
  view: Size;
  target: Circle;
  elapsed: SharedValue<number>;
  animate: boolean;
  active: boolean;
  preferencesReady: boolean;
  reducedMotion: boolean;
  ink: string;
  onComplete(): void;
  onError?(message: string): void;
}

function rgb(hex: string): number[] {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return [0.16, 0.27, 0.35];
  return [1,3,5].map(offset => parseInt(hex.slice(offset,offset+2),16)/255);
}

/** One WebView from the first logo frame until Today is left. Never swapped at the end. */
export const SphereIntroSurface = forwardRef<SphereIntroHandle, Props>(function SphereIntroSurface(
  {view, target, elapsed, animate, active, preferencesReady, reducedMotion, ink, onComplete, onError}, forwardedRef,
) {
  const web = useRef<WebView>(null);
  const [texture, setTexture] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const skipped = useRef(false);
  const delivered = useRef(false);
  const failedRef = useRef(false);
  const callbacks = useRef({onComplete,onError});
  callbacks.current = {onComplete,onError};

  const complete = useCallback(() => {
    if (delivered.current) return;
    delivered.current = true;
    callbacks.current.onComplete();
  }, []);
  const send = useCallback((command: object) => {
    const data = JSON.stringify(command).replace(/</g, '\\u003c');
    web.current?.injectJavaScript(`window.__TIH_CONTROL__ && window.__TIH_CONTROL__(${data}); true;`);
  }, []);
  const fail = useCallback((message: string) => {
    if (failedRef.current) return;
    failedRef.current = true;
    send({type:'dispose'});
    setFailed(true);
    cancelAnimation(elapsed);
    elapsed.value = INTRO_MS;
    callbacks.current.onError?.(message);
    complete();
  }, [complete,elapsed,send]);
  const finish = useCallback(() => {
    skipped.current = true;
    cancelAnimation(elapsed);
    elapsed.value = INTRO_MS;
    send({type:'finish'});
    complete();
  }, [complete,elapsed,send]);
  useImperativeHandle(forwardedRef, () => ({finish}), [finish]);

  useEffect(() => {
    let alive = true;
    prepareSphereAsset().then(value => {if(alive) setTexture(value);})
      .catch(error => {if(alive) fail(`V4 asset: ${String(error)}`);});
    return () => {alive=false;};
  }, [fail]);
  useEffect(() => {
    if (ready || failed) return;
    const timer = setTimeout(() => fail('V4 first frame timed out; using the bundled poster.'), 12000);
    return () => clearTimeout(timer);
  }, [ready,failed,fail]);

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
  useEffect(() => () => {cancelAnimation(elapsed);}, [elapsed]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string; elapsed?: number; wallClock?: number; running?: boolean; message?: string;
      };
      if(data.type === 'ready') {
        if(failedRef.current) {send({type:'dispose'}); return;}
        setReady(true);
      } else if(data.type === 'clock' && typeof data.elapsed === 'number') {
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
  }, [complete,elapsed,fail,send]);

  const logoWidth = Math.min(view.width*.76,420);
  const paddedWidth = logoWidth * PADDED_LOGO_WIDTH_SCALE;
  const paddedHeight = logoWidth * PADDED_LOGO_HEIGHT_SCALE;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    {!ready && !failed && !skipped.current ? <View style={{position:'absolute',left:(view.width-paddedWidth)/2,top:(view.height-paddedHeight)/2,width:paddedWidth,height:paddedHeight}}>
      <Image source={{uri:BRAND_TEXTURE_URI}} resizeMode="contain" fadeDuration={0}
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
      style={[StyleSheet.absoluteFill,{backgroundColor:'transparent',opacity:failed?0:1}]}
      containerStyle={{backgroundColor:'transparent'}}
      androidLayerType="hardware"
    /> : null}
    {failed ? <Image
      source={require('../../assets/tune_into_her_sphere_phase0_poster.png')}
      resizeMode="contain"
      style={{position:'absolute',left:target.x-target.radius,top:target.y-target.radius,width:target.radius*2,height:target.radius*2}}
    /> : null}
  </View>;
});
