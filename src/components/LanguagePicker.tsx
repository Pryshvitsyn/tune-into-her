import { useCallback, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo, Alert, findNodeHandle, Modal, Platform, Pressable, ScrollView,
  StyleSheet, useWindowDimensions, View, type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../config/constants';
import languages from '../config/languages.json';
import { spacing, type Palette } from '../theme';
import { typographyForLanguage } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

import { AppText as Text } from './AppText';
import { Button } from './Button';
import {
  allLanguageRowsMeasured, createLanguageRowMeasurements, createLanguageSelection,
  languageAtWheelGestureOffset, languagePickerRowHeight, languagePickerViewport, languageToCommit,
  recordLanguageRowMeasurement, reduceLanguageSelection,
} from './languageSelection';

/** One closed row; opening edits a local draft. Only Done asks AppContext to persist it. */
export function LanguagePicker({ value, onConfirm, disabled = false }: {
  value: SupportedLanguage;
  onConfirm(language: SupportedLanguage): Promise<void>;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [selection, dispatch] = useReducer(reduceLanguageSelection, value, createLanguageSelection);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [measurements, setMeasurements] = useState(createLanguageRowMeasurements);
  const [settledLayout, setSettledLayout] = useState('');
  const [chrome, setChrome] = useState<{ key: string; header?: number; actions?: number }>({ key: '' });
  const saving = useRef(false);
  const gesture = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const sheetScroll = useRef<ScrollView>(null);
  const row = useRef<View>(null);
  const draft = useRef(selection.draft);
  const measurementKeyRef = useRef('');
  const chromeKeyRef = useRef('');
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const measurementKey = `${viewportWidth.toFixed(2)}:${fontScale.toFixed(4)}`;
  const rowHeight = languagePickerRowHeight(fontScale, measurementKey, measurements);
  const measuredAll = viewportWidth > 0 && allLanguageRowsMeasured(measurementKey, measurements);
  const ios = Platform.OS === 'ios';
  const stackActions = fontScale > 1.2 || (viewportWidth > 0 && viewportWidth < 300);
  const buttonHeight = Math.max(54, 24 * fontScale + 24);
  const actionsHeight = stackActions ? buttonHeight * 2 + 12 : buttonHeight;
  const bottomPadding = Math.max(insets.bottom, 18);
  const chromeKey = `${selection.session}:${measurementKey}:${value}:${stackActions}:${selection.confirming}`;
  const measuredChrome = chrome.key === chromeKey ? chrome : undefined;
  const headerHeight = 14 + (measuredChrome?.header ?? (ios ? 20 : 0) + 31 * fontScale + 16);
  const chromeHeight = headerHeight + (measuredChrome?.actions ?? actionsHeight + 16) + bottomPadding + 2;
  const sheetHeight = stackActions ? height - insets.top : height * 0.9;
  const available = sheetHeight - chromeHeight;
  // Extreme accessibility text can make the header/actions taller than the window.
  // In that case the complete sheet scrolls, including its reachable Cancel/Done.
  const viewport = languagePickerViewport(rowHeight, available);
  const wholeSheetScroll = viewport.wholeSheetScroll;
  const listHeight = viewport.height;
  const wheel = ios && viewport.canFitWheel;
  const padding = wheel ? (listHeight - rowHeight) / 2 : 0;
  const layoutKey = `${chromeKey}:${rowHeight}:${listHeight.toFixed(2)}:${wheel}:${wholeSheetScroll}`;
  const wheelReady = measuredAll && settledLayout === layoutKey;
  const currentIndex = SUPPORTED_LANGUAGES.indexOf(selection.draft);
  const label = languages.labels[value];

  useLayoutEffect(() => { measurementKeyRef.current = measurementKey; }, [measurementKey]);
  useLayoutEffect(() => { draft.current = selection.draft; }, [selection.draft]);
  useLayoutEffect(() => { chromeKeyRef.current = chromeKey; }, [chromeKey]);
  const measureChrome = useCallback((part: 'header' | 'actions', key: string, measuredHeight: number) => {
    if (!Number.isFinite(measuredHeight) || measuredHeight <= 0) return;
    setChrome(previous => {
      if (key !== chromeKeyRef.current) return previous;
      const current = previous.key === key ? previous : { key };
      const rounded = Math.ceil(measuredHeight);
      return (current[part] ?? 0) >= rounded ? previous : { ...current, [part]: rounded };
    });
  }, []);
  const measure = useCallback((language: SupportedLanguage, key: string, textHeight: number) => {
    setMeasurements(previous => recordLanguageRowMeasurement(previous, measurementKeyRef.current, key, language, textHeight));
  }, []);
  const scrollToDraft = useCallback(() => {
    const index = SUPPORTED_LANGUAGES.indexOf(draft.current);
    if (wholeSheetScroll) {
      sheetScroll.current?.scrollTo({ y: Math.max(0, headerHeight - 14 + index * rowHeight), animated: false });
    } else {
      scroll.current?.scrollTo({
        y: wheel ? index * rowHeight : Math.max(0, index * rowHeight - Math.max(0, (listHeight - rowHeight) / 2)),
        animated: false,
      });
    }
  }, [rowHeight, wheel, wholeSheetScroll, headerHeight, listHeight]);
  useLayoutEffect(() => {
    gesture.current = false;
    if (!selection.visible || !measuredAll) return;
    scrollToDraft();
    let second: number | undefined;
    const first = requestAnimationFrame(() => {
      scrollToDraft();
      second = requestAnimationFrame(() => setSettledLayout(layoutKey));
    });
    return () => { cancelAnimationFrame(first); if (second !== undefined) cancelAnimationFrame(second); };
  }, [selection.visible, measuredAll, layoutKey, scrollToDraft]);

  const cancel = () => { if (!saving.current) dispatch({ type: 'cancel' }); };
  const move = (language: SupportedLanguage) => {
    if (saving.current) return;
    gesture.current = false;
    dispatch({ type: 'choose', value: language });
    if (wheel) scroll.current?.scrollTo({ y: SUPPORTED_LANGUAGES.indexOf(language) * rowHeight, animated: false });
  };
  const updateFromGesture = (event: NativeScrollEvent) => {
    const language = languageAtWheelGestureOffset(event.contentOffset.y, rowHeight, {
      userGesture: gesture.current, layoutReady: wheelReady && wheel,
    });
    if (language) dispatch({ type: 'choose', value: language });
  };
  const confirm = async () => {
    const language = languageToCommit(selection);
    if (!language || saving.current) return;
    saving.current = true;
    dispatch({ type: 'confirm' });
    try { await onConfirm(language); dispatch({ type: 'saved' }); }
    catch { dispatch({ type: 'failed' }); Alert.alert(t('cycle.saveError')); }
    finally { saving.current = false; }
  };
  const refocus = () => {
    const target = findNodeHandle(row.current);
    if (target) AccessibilityInfo.setAccessibilityFocus(target);
  };
  const options = SUPPORTED_LANGUAGES.map(language => <Pressable key={language} disabled={selection.confirming}
    onPress={() => move(language)} accessible={!wheel} accessibilityRole="radio"
    accessibilityLanguage={language === 'mbf' ? 'ms' : language}
    accessibilityLabel={languages.labels[language]} accessibilityState={{ checked: selection.draft === language, disabled: selection.confirming }}
    style={[styles.option, { height: rowHeight }, !wheel && selection.draft === language && styles.optionSelected]}>
    <Text key={measurementKey} language={language} accessible={false} allowFontScaling
      onLayout={event => measure(language, measurementKey, event.nativeEvent.layout.height)}
      onTextLayout={event => {
        const lines = event.nativeEvent.lines;
        if (lines.length) measure(language, measurementKey,
          Math.max(...lines.map(line => line.y + line.height)) - Math.min(...lines.map(line => line.y)));
      }}
      style={[styles.optionLabel, selection.draft !== language && styles.unselected]}>
      {languages.labels[language]}
    </Text>
  </Pressable>);
  const content = <>
    <View key={`header:${chromeKey}`} onLayout={event => measureChrome('header', chromeKey, event.nativeEvent.layout.height)}>
      {ios ? <View accessible={false} style={styles.handle} /> : null}
      <Text accessibilityRole="header" style={[styles.title, typographyForLanguage(value)]}>{t('language.title')}</Text>
    </View>
    <View style={wholeSheetScroll ? undefined : { height: listHeight }}
      onLayout={event => {
        const width = Math.round(event.nativeEvent.layout.width * 100) / 100;
        setViewportWidth(previous => previous === width ? previous : width);
      }}
      accessible={wheel} accessibilityRole={wheel ? 'adjustable' : undefined}
      accessibilityLanguage={wheel ? selection.draft === 'mbf' ? 'ms' : selection.draft : undefined}
      accessibilityLabel={wheel ? t('language.title') : undefined}
      accessibilityValue={wheel ? { min: 0, max: SUPPORTED_LANGUAGES.length - 1, now: currentIndex, text: languages.labels[selection.draft] } : undefined}
      accessibilityActions={wheel ? [{ name: 'increment' }, { name: 'decrement' }] : undefined}
      onAccessibilityAction={event => {
        const direction = event.nativeEvent.actionName === 'increment' ? 1 : -1;
        const next = Math.max(0, Math.min(SUPPORTED_LANGUAGES.length - 1, currentIndex + direction));
        move(SUPPORTED_LANGUAGES[next]!);
      }}>
      {wheel ? <View pointerEvents="none" style={[styles.wheelHighlight, { top: padding, height: rowHeight }]} /> : null}
      {wholeSheetScroll ? <View>{options}</View> : <ScrollView ref={scroll} removeClippedSubviews={false}
        scrollEnabled={!selection.confirming && (!wheel || wheelReady)} showsVerticalScrollIndicator={!wheel}
        snapToInterval={wheel ? rowHeight : undefined} decelerationRate={wheel ? 'fast' : 'normal'}
        contentContainerStyle={wheel ? { paddingVertical: padding } : undefined}
        onScrollBeginDrag={() => { gesture.current = wheelReady && wheel; }}
        onScroll={wheel ? event => updateFromGesture(event.nativeEvent) : undefined}
        onScrollEndDrag={wheel ? event => updateFromGesture(event.nativeEvent) : undefined}
        onMomentumScrollEnd={wheel ? event => { updateFromGesture(event.nativeEvent); gesture.current = false; } : undefined}
        scrollEventThrottle={32} onLayout={scrollToDraft} style={wheel && !wheelReady ? styles.measuring : undefined}>
        {options}
      </ScrollView>}
    </View>
    <View key={`actions:${chromeKey}`} onLayout={event => measureChrome('actions', chromeKey, event.nativeEvent.layout.height)} style={[styles.actions, stackActions && styles.actionsVertical]}>
      <View style={stackActions ? styles.wideAction : styles.action}><Button label={t('common.cancel')} variant="ghost" disabled={selection.confirming} onPress={cancel} /></View>
      <View style={stackActions ? styles.wideAction : styles.action}><Button label={t(selection.confirming ? 'common.loading' : 'common.done')} disabled={selection.confirming} onPress={() => void confirm()} /></View>
    </View>
  </>;
  return <>
    <Pressable ref={row} disabled={disabled} onPress={() => dispatch({ type: 'open', value })}
      accessibilityRole="button" accessibilityLabel={t('accessibility.selectLanguage', { language: label })}
      accessibilityState={{ expanded: selection.visible, disabled }}
      style={({ pressed }) => [styles.closed, pressed && styles.closedPressed, disabled && styles.disabled]}>
      <Text language={value} style={styles.selected}>{label}</Text>
      <Text accessible={false} allowFontScaling={false} style={styles.arrow}>▾</Text>
    </Pressable>
    <Modal visible={selection.visible} transparent animationType="none" onRequestClose={cancel}
      onShow={scrollToDraft} onDismiss={refocus} statusBarTranslucent>
      <View style={[styles.backdrop, ios ? styles.bottom : styles.middle]}>
        <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={cancel} />
        <View accessibilityViewIsModal importantForAccessibility="yes"
          style={[styles.sheet, ios ? styles.iosSheet : styles.androidSheet, { maxHeight: sheetHeight, paddingBottom: wholeSheetScroll ? 0 : bottomPadding }]}>
          {wholeSheetScroll ? <ScrollView ref={sheetScroll} removeClippedSubviews={false}
            contentContainerStyle={{ paddingBottom: bottomPadding }}>{content}</ScrollView> : content}
        </View>
      </View>
    </Modal>
  </>;
}
const makeStyles = (colors: Palette) => StyleSheet.create({
  closed: { minHeight: 56, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, gap: 12 },
  selected: { flex: 1, fontSize: 20, lineHeight: 27, color: colors.text },
  arrow: { fontSize: 19, color: colors.primary },
  closedPressed: { backgroundColor: colors.pickerSelection },
  disabled: { opacity: 0.5 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,34,44,0.22)' },
  bottom: { justifyContent: 'flex-end' },
  middle: { justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.background, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.lg, paddingTop: 14 },
  iosSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  androidSheet: { borderRadius: 24 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: colors.border, marginBottom: 16 },
  title: { color: colors.text, textAlign: 'center', fontSize: 24, lineHeight: 31, marginBottom: 16 },
  wheelHighlight: { position: 'absolute', left: 0, right: 0, borderRadius: 14, backgroundColor: colors.pickerSelection },
  option: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14 },
  optionSelected: { backgroundColor: colors.pickerSelection },
  optionLabel: { width: '100%', flexShrink: 0, color: colors.text, fontSize: 20, lineHeight: 27, textAlign: 'center' },
  unselected: { color: colors.secondary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16 },
  action: { flex: 1 },
  wideAction: { width: '100%' },
  actionsVertical: { flexDirection: 'column', alignItems: 'stretch' },
  measuring: { opacity: 0 },
});
