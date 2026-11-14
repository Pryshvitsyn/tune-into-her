import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo, AppState, Modal, Pressable, ScrollView,
  StyleSheet, useWindowDimensions, View, type LayoutChangeEvent, type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppText as Text } from '../components/AppText';
import { BrandMark } from '../components/BrandMark';

import { useLaunchPresentation } from './LaunchPresentation';
import { SphereIntroSurface, type SphereIntroHandle } from './SphereIntroSurface';
import { hasConsumedAppIntro, markAppIntroConsumed } from './introSession';
import { INTRO_MS, REVEAL, type RevealName } from './timeline';

export interface AdvicePart { label: string; text: string; note: string }
export interface AnimatedTodayProps {
  /** Already localized: e.g. “12 ноября · День 10 цикла”. No invented cycle values. */
  dateLine: string;
  phaseTitle: string;
  phaseDescription?: string;
  mind: AdvicePart;
  support: AdvicePart;
  action: AdvicePart;
  dark: boolean;
  labels: { info: string; update: string; settings: string; skip: string; close: string };
  onInfo(): void;
  onUpdate(): void;
  onSettings(): void;
  onAbout(): void;
  /** Keep the existing DEVELOPMENT MOCK BILLING disclosure visible in QA. */
  disclosure?: string;
  /** QA preview only: mount with a new key to replay. Normal Today does not set this. */
  replay?: boolean;
  onIntroError?(message: string): void;
}

const LIGHT = {ink:'#294458',secondary:'#62788B',edge:'#DCE3E9',center:'#F9FBFC'};
const DARK = {ink:'#E5EDF4',secondary:'#A1B3C3',edge:'#10171E',center:'#26313D'};

function Reveal({children,clock,name,done,style}: {
  children: ReactNode; clock: SharedValue<number>; name: RevealName;
  done: boolean; style?: ViewStyle;
}) {
  const [start,end] = REVEAL[name];
  const animation = useAnimatedStyle(() => {
    const p = Math.max(0,Math.min(1,(clock.value-start)/(end-start)));
    const fade = p*p*(3-2*p);
    // Only opacity: children reserve their final space from the first layout.
    return {opacity:fade};
  });
  return <Animated.View style={[style,animation]} pointerEvents={done?'auto':'none'}
    accessibilityElementsHidden={!done} importantForAccessibility={done?'auto':'no-hide-descendants'}>
    {children}
  </Animated.View>;
}

function FooterIcon({kind,color}: {kind:'info'|'update'|'settings';color:string}) {
  const paths = {
    info: 'M3 4 Q7 2 12 5 Q17 2 21 4 V20 Q17 18 12 21 Q7 18 3 20 Z M12 5 V21',
    update: 'M20 8 A8 8 0 0 0 6 4 L3 7 M3 2 V7 H8 M4 16 A8 8 0 0 0 14 20 L21 17 M21 22 V17 H16',
    settings: 'M9 3 H15 L16 6 L19 7 L22 10 L20 13 L20 17 L17 19 L14 19 L12 22 L9 20 L5 20 L3 17 L4 14 L2 11 L4 8 L7 7 Z M16 12 A4 4 0 1 1 8 12 A4 4 0 1 1 16 12',
  };
  return <Svg width={17} height={17} viewBox="0 0 24 24"><Path d={paths[kind]} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" /></Svg>;
}

/** Presentation only. No purchase, phase-estimation, history or notification logic. */
export function AnimatedToday(props: AnimatedTodayProps) {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const { reportScreenReady } = useLaunchPresentation();
  const palette = props.dark?DARK:LIGHT;
  const [play] = useState(() => !!props.replay || !hasConsumedAppIntro());
  const clock = useSharedValue(play ? 0 : INTRO_MS);
  const surface = useRef<SphereIntroHandle>(null);
  const [done,setDone] = useState(!play);
  const [focus,setFocus] = useState(true);
  const [appActive,setAppActive] = useState(AppState.currentState !== 'background');
  const [access,setAccess] = useState({ready:false,reduce:false,reader:false});
  const [view,setView] = useState({width:0,height:0});
  const [slot,setSlot] = useState<{x:number;y:number;width:number;height:number}|null>(null);
  const [detail,setDetail] = useState<AdvicePart|null>(null);
  const [scrollY,setScrollY] = useState(0);
  const [footerHeight,setFooterHeight] = useState(0);

  useFocusEffect(useCallback(() => {setFocus(true); return () => setFocus(false);}, []));
  useEffect(() => {
    const appSub=AppState.addEventListener('change',state=>setAppActive(state==='active'));
    const reduceSub=AccessibilityInfo.addEventListener('reduceMotionChanged',value=>setAccess(old=>({...old,reduce:value})));
    const readerSub=AccessibilityInfo.addEventListener('screenReaderChanged',value=>setAccess(old=>({...old,reader:value})));
    let alive=true;
    Promise.all([AccessibilityInfo.isReduceMotionEnabled(),AccessibilityInfo.isScreenReaderEnabled()])
      .then(([reduce,reader])=>{if(alive) setAccess({ready:true,reduce,reader});})
      // On an accessibility-query failure, choose the safer static presentation.
      .catch(()=>{if(alive) setAccess({ready:true,reduce:true,reader:false});});
    return ()=>{alive=false;appSub.remove();reduceSub.remove();readerSub.remove();};
  }, []);
  const finish = useCallback(() => {
    markAppIntroConsumed();
    setDone(true);
  }, []);
  const target = useMemo(() => slot ? {
    x:slot.x+slot.width/2,
    y:slot.y+slot.height/2-scrollY,
    radius:Math.max(1,Math.min(slot.width,slot.height,360)/2),
  }:null,[slot,scrollY]);
  const onRootLayout = useCallback((event: LayoutChangeEvent) => {
    const {width,height}=event.nativeEvent.layout;
    setView(old=>old.width===width && old.height===height?old:{width,height});
  }, []);
  const onSlotLayout = useCallback((event: LayoutChangeEvent) => {
    const {x,y,width,height}=event.nativeEvent.layout;
    setSlot(old=>old && old.x===x && old.y===y && old.width===width && old.height===height?old:{x,y,width,height});
  }, []);
  const sphereSize = Math.max(216,Math.min(280,view.width-56));
  const stackedFooter = fontScale > 1.35;

  function advice(part: AdvicePart, stage: 'mind'|'support'|'action') {
    return <Reveal clock={clock} name={stage} done={done} style={{marginTop:stage==='mind'?22:20}}>
      <Pressable onPress={()=>setDetail(part)} accessibilityRole="button"
        accessibilityLabel={`${part.label}. ${part.text}. ${part.note}`}>
        <Text style={[styles.label,{color:palette.ink}]}>{part.label}</Text>
        <Text style={[styles.body,{color:palette.ink}]}>{part.text}</Text>
        <Text style={[styles.note,{color:palette.secondary}]}>
          ↳ {part.note}
        </Text>
      </Pressable>
    </Reveal>;
  }
  const footer = [
    {kind:'info' as const,label:props.labels.info,onPress:props.onInfo},
    {kind:'update' as const,label:props.labels.update,onPress:props.onUpdate},
    {kind:'settings' as const,label:props.labels.settings,onPress:props.onSettings},
  ];
  return <View onLayout={onRootLayout} style={[styles.root,{
    backgroundColor:palette.edge,
  }]}>
    <LinearGradient pointerEvents="none" colors={[palette.edge,palette.center,palette.edge]}
      start={{x:0,y:.5}} end={{x:1,y:.5}} locations={[0,.5,1]} style={StyleSheet.absoluteFill}/>
    {target && view.width>0 ? <View pointerEvents="none" style={[styles.surfaceClip,{
      width:view.width,height:done?Math.max(0,view.height-footerHeight):view.height,
    }]}><View style={{width:view.width,height:view.height}}><SphereIntroSurface
      ref={surface} view={view} target={target} elapsed={clock} animate={play}
      active={focus && appActive && !detail} preferencesReady={access.ready}
      reducedMotion={access.reduce || access.reader} ink={palette.ink}
      onFirstFrame={() => reportScreenReady('/today')} onComplete={finish} onError={message=>{props.onIntroError?.(message);if(__DEV__) console.warn('[Tune Into Her intro]',message);}}
    /></View></View> : null}

    <ScrollView style={styles.scroll} scrollEnabled={done} scrollEventThrottle={16}
      onScroll={event=>setScrollY(event.nativeEvent.contentOffset.y)}>
    <View style={[styles.content,{minHeight:Math.max(0,view.height-footerHeight),paddingTop:insets.top+6}]}>
    <Reveal clock={clock} name="chrome" done={done} style={styles.header}>
      <Pressable onPress={props.onAbout} accessibilityRole="button" accessibilityLabel="THEA" style={styles.brandHit}>
        <BrandMark corporate size={27} color={palette.secondary}/>
      </Pressable>
      <Text style={[styles.date,{color:palette.ink}]}>{props.dateLine}</Text>
      <View style={styles.brandHit}><BrandMark size={34} color={palette.ink}/></View>
    </Reveal>
    <Reveal clock={clock} name="phase" done={done} style={{marginTop:12}}>
      <Text style={[styles.phase,{color:palette.ink}]}>{props.phaseTitle}</Text>
      {props.phaseDescription ? <Text style={[styles.description,{color:palette.secondary}]}>{props.phaseDescription}</Text>:null}
      {props.disclosure ? <Text style={styles.disclosure}>{props.disclosure}</Text>:null}
    </Reveal>
    {advice(props.mind,'mind')}
    {/* Text keeps its natural height; the unchanged surface follows this measured scroll slot. */}
    <View pointerEvents="none" onLayout={onSlotLayout} style={[styles.sphereSlot,{height:sphereSize}]}/>
    {advice(props.support,'support')}
    {advice(props.action,'action')}
    </View>
    </ScrollView>
    <View onLayout={event=>setFooterHeight(event.nativeEvent.layout.height)}>
    <Reveal clock={clock} name="chrome" done={done} style={{paddingBottom:Math.max(insets.bottom,8),backgroundColor:palette.edge}}>
      <View style={[styles.footer,stackedFooter && styles.footerStack]}>{footer.map(item=><Pressable key={item.kind} onPress={item.onPress}
        accessibilityRole="button" accessibilityLabel={item.label} style={[styles.footerButton,stackedFooter && styles.footerButtonStack]}>
        <FooterIcon kind={item.kind} color={palette.ink}/>
        <Text style={[styles.footerLabel,{color:palette.ink}]}>{item.label}</Text>
      </Pressable>)}</View>
    </Reveal>
    </View>

    {!done ? <Pressable onPress={()=>surface.current?.finish()} style={StyleSheet.absoluteFill}
      accessibilityRole="button" accessibilityLabel={props.labels.skip}/>:null}

    {/* The same full content remains available as an accessible focused reading view. */}
    <Modal visible={detail!==null} transparent animationType={access.reduce?'none':'fade'} onRequestClose={()=>setDetail(null)}>
      <View style={[styles.modal,{backgroundColor:palette.edge,paddingTop:insets.top+20,paddingBottom:insets.bottom+16}]}>
        <Pressable onPress={()=>setDetail(null)} style={styles.close} accessibilityRole="button">
          <Text style={{fontSize:16,color:palette.ink}}>{props.labels.close}</Text>
        </Pressable>
        <ScrollView contentContainerStyle={{padding:24}}>
          <Text style={{fontSize:22,lineHeight:29,color:palette.ink,marginBottom:18}}>{detail?.label}</Text>
          <Text style={{fontSize:19,lineHeight:29,color:palette.ink}}>{detail?.text}</Text>
          <Text style={{fontSize:16,lineHeight:25,color:palette.secondary,marginTop:20}}>↳ {detail?.note}</Text>
        </ScrollView>
      </View>
    </Modal>
  </View>;
}

const styles=StyleSheet.create({
  root:{flex:1,overflow:'hidden'},
  surfaceClip:{position:'absolute',left:0,top:0,overflow:'hidden'},
  scroll:{flex:1},
  content:{paddingHorizontal:18,paddingBottom:24},
  header:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  brandHit:{width:44,height:44,justifyContent:'center',alignItems:'center'},
  date:{flex:1,textAlign:'center',fontSize:14,lineHeight:20,marginHorizontal:4},
  phase:{fontSize:22,lineHeight:29,textAlign:'center'},
  description:{fontSize:15,lineHeight:22,textAlign:'center',marginTop:5},
  label:{fontSize:15,lineHeight:21,letterSpacing:0.3,textAlign:'center',marginBottom:4},
  body:{fontSize:17,lineHeight:25,textAlign:'center'},
  note:{fontSize:14,lineHeight:21,textAlign:'center',marginTop:4},
  sphereSlot:{marginTop:16,marginBottom:2},
  footer:{minHeight:48,flexDirection:'row',alignItems:'center',paddingHorizontal:18,gap:8},
  footerStack:{flexDirection:'column',alignItems:'stretch'},
  footerButtonStack:{flex:0},
  footerLabel:{fontSize:14,lineHeight:20,marginLeft:6,flexShrink:1,textAlign:'center'},
  footerButton:{flex:1,minHeight:48,paddingVertical:8,flexDirection:'row',alignItems:'center',justifyContent:'center'},
  disclosure:{fontSize:13,lineHeight:19,textAlign:'center',color:'#AA3344',marginTop:4},
  modal:{flex:1},close:{minHeight:44,justifyContent:'center',alignItems:'flex-end',paddingHorizontal:24},
});
