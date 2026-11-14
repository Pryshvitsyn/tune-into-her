import { describe, expect, it } from 'vitest';

import {
  allLanguageRowsMeasured, createLanguageRowMeasurements, createLanguageSelection,
  languageAtWheelGestureOffset, languageAtWheelOffset, languagePickerRowHeight,
  languagePickerViewport, languageToCommit, recordLanguageRowMeasurement, reduceLanguageSelection,
} from '../src/components/languageSelection';
import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import { colors, darkColors } from '../src/theme';
import { fontFamilyForLanguage, LIBERTINE_FAMILY } from '../src/theme/typography';

const channel = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

describe('onboarding language draft', () => {
  it('does not produce a persisted value from selection or dismissal', () => {
    const initial = createLanguageSelection('en');
    expect(languageToCommit(initial)).toBeNull();
    let state = reduceLanguageSelection(initial, { type: 'open', value: 'en' });
    state = reduceLanguageSelection(state, { type: 'choose', value: 'hi' });
    expect(state.draft).toBe('hi');
    expect(state.origin).toBe('en');
    state = reduceLanguageSelection(state, { type: 'cancel' });
    expect(state.draft).toBe('en');
    expect(languageToCommit(state)).toBeNull();
    expect(state.visible).toBe(false);
  });

  it('uses only a confirmed draft and waits for the existing save operation', () => {
    let state = reduceLanguageSelection(createLanguageSelection('en'), { type: 'open', value: 'en' });
    state = reduceLanguageSelection(state, { type: 'choose', value: 'uk' });
    expect(languageToCommit(state)).toBe('uk');
    state = reduceLanguageSelection(state, { type: 'confirm' });
    expect(state.confirming).toBe(true);
    expect(state.visible).toBe(true);
    expect(languageToCommit(state)).toBeNull();
    expect(reduceLanguageSelection(state, { type: 'cancel' })).toBe(state);
    state = reduceLanguageSelection(state, { type: 'saved' });
    expect(state.visible).toBe(false);
    expect(state.confirming).toBe(false);
  });

  it('retains the draft for a recoverable failed save, and reopens from actual preferences', () => {
    let state = reduceLanguageSelection(createLanguageSelection('ru'), { type: 'open', value: 'ru' });
    state = reduceLanguageSelection(state, { type: 'choose', value: 'zh-Hans' });
    state = reduceLanguageSelection(state, { type: 'confirm' });
    state = reduceLanguageSelection(state, { type: 'failed' });
    expect(state.visible).toBe(true);
    expect(languageToCommit(state)).toBe('zh-Hans');
    state = reduceLanguageSelection(state, { type: 'cancel' });
    state = reduceLanguageSelection(state, { type: 'open', value: 'it' });
    expect(state.origin).toBe('it');
    expect(state.draft).toBe('it');
  });

  it.each(SUPPORTED_LANGUAGES)('keeps the existing %s identifier and centers its wheel index', language => {
    const index = SUPPORTED_LANGUAGES.indexOf(language);
    expect(languageAtWheelOffset(index * 64, 64)).toBe(language);
    const state = reduceLanguageSelection(createLanguageSelection('en'), { type: 'open', value: language });
    expect(languageToCommit(state)).toBe(language);
  });

  it('clamps wheel bounce safely without inventing a locale', () => {
    expect(languageAtWheelOffset(-128, 64)).toBe('en');
    expect(languageAtWheelOffset(100_000, 64)).toBe('mbf');
    expect(languageAtWheelOffset(NaN, 64)).toBe('en');
    expect(languageAtWheelOffset(30, 0)).toBe('en');
  });
});

describe('premium typography and controls', () => {
  it.each(SUPPORTED_LANGUAGES)('uses supported text font or the correct script fallback for %s', language => {
    expect(fontFamilyForLanguage(language)).toBe(language === 'hi' || language === 'zh-Hans' ? undefined : LIBERTINE_FAMILY);
  });
  it.each([colors, darkColors])('keeps primary/pressed button text readable in either palette', palette => {
    expect(contrast(palette.buttonText, palette.button)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.buttonText, palette.buttonPressed)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.text, palette.background)).toBeGreaterThanOrEqual(7);
  });
});


describe('native picker row geometry', () => {
  it('reserves actual scaled line height plus row padding before native measurement', () => {
    const empty = createLanguageRowMeasurements();
    expect(languagePickerRowHeight(1, '334:1', empty)).toBe(52);
    expect(languagePickerRowHeight(2, '334:2', empty)).toBe(74);
    expect(languagePickerRowHeight(3, '334:3', empty)).toBe(101);
  });

  it('uses the tallest measured multilingual text for every fixed wheel row', () => {
    const key = '224:3';
    let measured = createLanguageRowMeasurements();
    for (const language of SUPPORTED_LANGUAGES) {
      measured = recordLanguageRowMeasurement(measured, key, key, language, language === 'mbf' ? 243 : 81);
    }
    expect(allLanguageRowsMeasured(key, measured)).toBe(true);
    const rowHeight = languagePickerRowHeight(3, key, measured);
    expect(rowHeight).toBe(263);
    for (const language of SUPPORTED_LANGUAGES) {
      expect(rowHeight - 20).toBeGreaterThanOrEqual(measured.heights[language]!);
      expect(languageAtWheelOffset(SUPPORTED_LANGUAGES.indexOf(language) * rowHeight, rowHeight)).toBe(language);
    }
  });

  it('ignores stale native callbacks and starts fresh after width/font-scale changes', () => {
    const oldKey = '224:3', nextKey = '334:1';
    const old = recordLanguageRowMeasurement(createLanguageRowMeasurements(), oldKey, oldKey, 'mbf', 243);
    expect(recordLanguageRowMeasurement(old, nextKey, oldKey, 'mbf', 400)).toBe(old);
    expect(languagePickerRowHeight(1, nextKey, old)).toBe(52);
    const next = recordLanguageRowMeasurement(old, nextKey, nextKey, 'mbf', 27);
    expect(next.heights).toEqual({ mbf: 27 });
    expect(allLanguageRowsMeasured(nextKey, next)).toBe(false);
    expect(languagePickerRowHeight(1, nextKey, next)).toBe(52);
  });

  it('does not shrink measured multiline text due to an intermediate clipped-frame event', () => {
    const key = '224:3';
    const measured = recordLanguageRowMeasurement(createLanguageRowMeasurements(), key, key, 'mbf', 243);
    expect(recordLanguageRowMeasurement(measured, key, key, 'mbf', 81)).toBe(measured);
    for (const invalid of [0, -1, NaN, Infinity]) {
      expect(recordLanguageRowMeasurement(measured, key, key, 'en', invalid)).toBe(measured);
    }
  });

  it('never turns programmatic recentering or unsettled layout into a new locale', () => {
    // The old contentOffset is invalid after rowHeight grows. It must not select an index.
    expect(languageAtWheelGestureOffset(520, 263, { userGesture: false, layoutReady: true })).toBeNull();
    expect(languageAtWheelGestureOffset(520, 263, { userGesture: true, layoutReady: false })).toBeNull();
    expect(languageAtWheelGestureOffset(2630, 263, { userGesture: true, layoutReady: true })).toBe('mbf');
  });

  it('creates a fresh modal-layout session whenever the picker reopens', () => {
    let state = reduceLanguageSelection(createLanguageSelection('en'), { type: 'open', value: 'en' });
    const firstSession = state.session;
    state = reduceLanguageSelection(state, { type: 'cancel' });
    state = reduceLanguageSelection(state, { type: 'open', value: 'mbf' });
    expect(state.session).toBe(firstSession + 1);
    expect(state.draft).toBe('mbf');
  });

  it('keeps five equal rows in a normal wheel', () => {
    expect(languagePickerViewport(52, 400)).toEqual({ height: 260, wholeSheetScroll: false, canFitWheel: true });
  });
  it('uses an accessible scroll list when a compact viewport cannot show one whole large row', () => {
    const layout = languagePickerViewport(263, 124);
    expect(layout).toEqual({ height: 124, wholeSheetScroll: false, canFitWheel: false });
    expect(layout.height).toBeLessThanOrEqual(124);
  });
  it('lets header/actions scroll too when extreme text makes the fixed chrome taller than the modal', () => {
    expect(languagePickerViewport(300, -20)).toEqual({ height: 0, wholeSheetScroll: true, canFitWheel: false });
  });
});
