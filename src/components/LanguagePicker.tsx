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
import { useTheme } from '../theme/useTheme';

import { AppText as Text } from './AppText';
import { Button } from './Button';
import {
  allLanguageRowsMeasured, createLanguageRowMeasurements, createLanguageSelection,
  languageAtPageGestureOffset, languagePickerRowHeight, languageToCommit,
  recordLanguageRowMeasurement, reduceLanguageSelection,
} from './languageSelection';

/** One horizontal language page at a time. Swipes edit a draft; only Done persists it. */
export function LanguagePicker({ value, onConfirm, disabled = false }: {
  value: SupportedLanguage;
  onConfirm(language: SupportedLanguage): Promise<void>;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [selection, dispatch] = useReducer(reduceLanguageSelection, value, createLanguageSelection);
  const [pageWidth, setPageWidth] = useState(0);
  const [measurements, setMeasurements] = useState(createLanguageRowMeasurements);
  const [settledLayout, setSettledLayout] = useState('');
  const scroll = useRef<ScrollView>(null);
  const row = useRef<View>(null);
  const saving = useRef(false);
  const gesture = useRef(false);
  const draft = useRef(selection.draft);
  const activeMeasurement = useRef('');
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const measurementKey = `${pageWidth.toFixed(2)}:${fontScale.toFixed(4)}`;
  const pageHeight = Math.max(144, languagePickerRowHeight(fontScale, measurementKey, measurements) + 72);
  const measuredAll = pageWidth > 0 && allLanguageRowsMeasured(measurementKey, measurements);
  const layoutKey = `${selection.session}:${measurementKey}:${pageHeight}`;
  const pagesReady = measuredAll && settledLayout === layoutKey;
  const currentIndex = SUPPORTED_LANGUAGES.indexOf(selection.draft);
  const stackActions = fontScale > 1.2 || (pageWidth > 0 && pageWidth < 300);

  useLayoutEffect(() => { draft.current = selection.draft; }, [selection.draft]);
  useLayoutEffect(() => { activeMeasurement.current = measurementKey; }, [measurementKey]);
  const measure = useCallback((language: SupportedLanguage, key: string, textHeight: number) => {
    setMeasurements(previous => recordLanguageRowMeasurement(previous, activeMeasurement.current, key, language, textHeight));
  }, []);
  const scrollToDraft = useCallback(() => {
    scroll.current?.scrollTo({ x: SUPPORTED_LANGUAGES.indexOf(draft.current) * pageWidth, animated: false });
  }, [pageWidth]);
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

  const cancel = () => {
    if (saving.current) return;
    gesture.current = false;
    dispatch({ type: 'cancel' });
  };
  const move = (index: number) => {
    if (saving.current) return;
    const next = Math.max(0, Math.min(SUPPORTED_LANGUAGES.length - 1, index));
    gesture.current = false;
    draft.current = SUPPORTED_LANGUAGES[next]!;
    dispatch({ type: 'choose', value: draft.current });
    scroll.current?.scrollTo({ x: next * pageWidth, animated: true });
  };
  const updateFromGesture = (event: NativeScrollEvent) => {
    if (saving.current) return;
    const language = languageAtPageGestureOffset(event.contentOffset.x, pageWidth, {
      userGesture: gesture.current, layoutReady: pagesReady,
    });
    if (language) { draft.current = language; dispatch({ type: 'choose', value: language }); }
  };
  const confirm = async () => {
    const language = languageToCommit(selection);
    if (!language || saving.current) return;
    saving.current = true; gesture.current = false;
    dispatch({ type: 'confirm' });
    try { await onConfirm(language); dispatch({ type: 'saved' }); }
    catch { dispatch({ type: 'failed' }); Alert.alert(t('language.saveError')); }
    finally { saving.current = false; }
  };
  const refocus = () => {
    const target = findNodeHandle(row.current);
    if (target) AccessibilityInfo.setAccessibilityFocus(target);
  };
  return <>
    <Pressable ref={row} testID="language-picker-open" disabled={disabled}
      onPress={() => dispatch({ type: 'open', value })}
      accessibilityRole="button" accessibilityLabel={t('accessibility.selectLanguage', { language: languages.labels[value] })}
      accessibilityState={{ expanded: selection.visible, disabled }}
      style={({ pressed }) => [styles.closed, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text language={value} style={styles.selected}>{languages.labels[value]}</Text>
      <Text accessible={false} allowFontScaling={false} style={styles.arrow}>▾</Text>
    </Pressable>
    <Modal visible={selection.visible} transparent animationType="none" statusBarTranslucent
      onRequestClose={cancel} onShow={scrollToDraft} onDismiss={refocus}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 12 }]}>
        <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={cancel} />
        <View accessibilityViewIsModal importantForAccessibility="yes"
          style={[styles.sheet, { maxHeight: height - insets.top - 12 }]}>
          {/* At large text sizes the whole sheet scrolls, including both actions. */}
          <ScrollView nestedScrollEnabled contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 18) }}>
            <Text accessibilityRole="header" style={styles.title}>{t('language.title')}</Text>
            <Text style={styles.hint}>{t('language.swipeHint')}</Text>
            <View onLayout={event => {
              const width = Math.round(event.nativeEvent.layout.width * 100) / 100;
              setPageWidth(previous => previous === width ? previous : width);
            }}>
              {pageWidth > 0 ? <View testID="language-pages" accessible accessibilityRole="adjustable"
                accessibilityLabel={t('language.title')}
                accessibilityLanguage={selection.draft === 'mbf' ? 'ms' : selection.draft}
                accessibilityValue={{ min: 0, max: SUPPORTED_LANGUAGES.length - 1, now: currentIndex, text: languages.labels[selection.draft] }}
                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                onAccessibilityAction={event => move(currentIndex + (event.nativeEvent.actionName === 'increment' ? 1 : -1))}>
                <ScrollView ref={scroll} horizontal pagingEnabled nestedScrollEnabled
                  style={{ height: pageHeight }} showsHorizontalScrollIndicator={false} removeClippedSubviews={false}
                  scrollEnabled={pagesReady && !selection.confirming}
                  onScrollBeginDrag={() => { gesture.current = pagesReady; }}
                  onScroll={event => updateFromGesture(event.nativeEvent)}
                  onScrollEndDrag={event => updateFromGesture(event.nativeEvent)}
                  onMomentumScrollEnd={event => { updateFromGesture(event.nativeEvent); gesture.current = false; }}
                  scrollEventThrottle={32} onLayout={scrollToDraft}>
                  {SUPPORTED_LANGUAGES.map(language => <Pressable key={language} testID={`language-choice-${language}`}
                    accessible={false} disabled={selection.confirming} onPress={() => move(SUPPORTED_LANGUAGES.indexOf(language))}
                    style={[styles.page, { width: pageWidth, height: pageHeight }]}>
                    <Text language={language} accessible={false} style={styles.option}
                      onLayout={event => measure(language, measurementKey, event.nativeEvent.layout.height)}
                      onTextLayout={event => {
                        const lines = event.nativeEvent.lines;
                        if (lines.length) measure(language, measurementKey,
                          Math.max(...lines.map(line => line.y + line.height)) - Math.min(...lines.map(line => line.y)));
                      }}>{languages.labels[language]}</Text>
                    <Text accessible={false} allowFontScaling={false} style={styles.check}>✓</Text>
                  </Pressable>)}
                </ScrollView>
              </View> : <View style={{ height: pageHeight }} />}
            </View>
            <View style={styles.paging}>
              <Pressable testID="language-previous" accessibilityRole="button" accessibilityLabel={t('language.previous')}
                disabled={selection.confirming || currentIndex === 0}
                accessibilityState={{ disabled: selection.confirming || currentIndex === 0 }} onPress={() => move(currentIndex - 1)}
                style={[styles.pageButton, (selection.confirming || currentIndex === 0) && styles.disabled]}>
                <Text allowFontScaling={false} accessible={false} style={styles.chevron}>‹</Text>
              </Pressable>
              <Text style={styles.position}>{t('language.page', { index: currentIndex + 1, count: SUPPORTED_LANGUAGES.length })}</Text>
              <Pressable testID="language-next" accessibilityRole="button" accessibilityLabel={t('language.next')}
                disabled={selection.confirming || currentIndex === SUPPORTED_LANGUAGES.length - 1}
                accessibilityState={{ disabled: selection.confirming || currentIndex === SUPPORTED_LANGUAGES.length - 1 }} onPress={() => move(currentIndex + 1)}
                style={[styles.pageButton, (selection.confirming || currentIndex === SUPPORTED_LANGUAGES.length - 1) && styles.disabled]}>
                <Text allowFontScaling={false} accessible={false} style={styles.chevron}>›</Text>
              </Pressable>
            </View>
            <View style={[styles.actions, stackActions && styles.actionsVertical]}>
              <View style={styles.action}><Button testID="language-cancel" label={t('common.cancel')} variant="ghost" disabled={selection.confirming} onPress={cancel} /></View>
              <View style={styles.action}><Button testID="language-confirm" label={t(selection.confirming ? 'common.loading' : 'common.done')} disabled={selection.confirming || !pagesReady} onPress={() => void confirm()} /></View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}
const makeStyles = (colors: Palette) => StyleSheet.create({
  closed: { minHeight: 56, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, gap: 12 },
  selected: { flex: 1, fontSize: 20, lineHeight: 27, color: colors.text },
  arrow: { fontSize: 19, color: colors.primary }, pressed: { backgroundColor: colors.pickerSelection }, disabled: { opacity: 0.4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,34,44,0.22)', justifyContent: Platform.OS === 'ios' ? 'flex-end' : 'center', paddingHorizontal: Platform.OS === 'ios' ? 0 : spacing.lg },
  sheet: { backgroundColor: colors.background, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 24, paddingHorizontal: spacing.lg, paddingTop: 22, flexShrink: 1 },
  title: { color: colors.text, textAlign: 'center', fontSize: 24, lineHeight: 31, marginBottom: 10 },
  hint: { color: colors.secondary, textAlign: 'center', fontSize: 16, lineHeight: 23, marginBottom: 14 },
  page: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 24, borderRadius: 18, backgroundColor: colors.pickerSelection },
  option: { color: colors.text, fontSize: 28, lineHeight: 36, textAlign: 'center', width: '100%' },
  check: { color: colors.primary, fontSize: 20, marginTop: 12 },
  paging: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  pageButton: { minWidth: 54, minHeight: 54, justifyContent: 'center', alignItems: 'center' },
  chevron: { color: colors.primary, fontSize: 30 }, position: { color: colors.secondary, fontSize: 16, lineHeight: 23, flexShrink: 1, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, paddingTop: 10 }, action: { flex: 1 }, actionsVertical: { flexDirection: 'column' },
});
