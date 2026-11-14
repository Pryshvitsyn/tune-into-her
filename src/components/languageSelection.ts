import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../config/constants';

/** Local picker draft only. Persisted language belongs exclusively to AppContext/preferences. */
export interface LanguageSelection {
  visible: boolean;
  session: number;
  origin: SupportedLanguage;
  draft: SupportedLanguage;
  confirming: boolean;
}
export type LanguageSelectionEvent =
  | { type: 'open'; value: SupportedLanguage }
  | { type: 'choose'; value: SupportedLanguage }
  | { type: 'cancel' }
  | { type: 'confirm' }
  | { type: 'saved' }
  | { type: 'failed' };

export function createLanguageSelection(value: SupportedLanguage): LanguageSelection {
  return { visible: false, session: 0, origin: value, draft: value, confirming: false };
}
export function reduceLanguageSelection(state: LanguageSelection, event: LanguageSelectionEvent): LanguageSelection {
  switch (event.type) {
    case 'open':
      return { visible: true, session: state.session + 1, origin: event.value, draft: event.value, confirming: false };
    case 'choose':
      return state.visible && !state.confirming && SUPPORTED_LANGUAGES.includes(event.value)
        ? { ...state, draft: event.value } : state;
    case 'cancel':
      return state.confirming ? state : { ...state, visible: false, draft: state.origin };
    case 'confirm':
      return state.visible && !state.confirming ? { ...state, confirming: true } : state;
    case 'saved':
      return state.confirming ? { ...state, visible: false, confirming: false } : state;
    case 'failed':
      return state.confirming ? { ...state, confirming: false } : state;
  }
}
export function languageToCommit(state: LanguageSelection): SupportedLanguage | null {
  return state.visible && !state.confirming ? state.draft : null;
}
export function languageAtWheelOffset(offset: number, rowHeight: number): SupportedLanguage {
  const index = Number.isFinite(offset) && Number.isFinite(rowHeight) && rowHeight > 0
    ? Math.max(0, Math.min(SUPPORTED_LANGUAGES.length - 1, Math.round(offset / rowHeight))) : 0;
  return SUPPORTED_LANGUAGES[index]!;
}

export interface LanguageRowMeasurements {
  key: string;
  heights: Partial<Record<SupportedLanguage, number>>;
}
export function createLanguageRowMeasurements(): LanguageRowMeasurements { return { key: '', heights: {} }; }
/** Native events from an older width/font scale must not resize the current wheel. */
export function recordLanguageRowMeasurement(
  previous: LanguageRowMeasurements,
  activeKey: string,
  eventKey: string,
  language: SupportedLanguage,
  height: number,
): LanguageRowMeasurements {
  if (eventKey !== activeKey || !Number.isFinite(height) || height <= 0 || !SUPPORTED_LANGUAGES.includes(language)) return previous;
  const rounded = Math.ceil(height);
  const heights = previous.key === activeKey ? previous.heights : {};
  if ((heights[language] ?? 0) >= rounded) return previous;
  return { key: activeKey, heights: { ...heights, [language]: rounded } };
}
export function languagePickerRowHeight(fontScale: number, activeKey: string, measurements: LanguageRowMeasurements): number {
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const measured = measurements.key === activeKey ? Math.max(0, ...Object.values(measurements.heights)) : 0;
  // 27pt line height +20pt row padding; multiline native measurements can increase it.
  return Math.max(52, Math.ceil(27 * scale + 20), Math.ceil(measured + 20));
}
export function allLanguageRowsMeasured(activeKey: string, measurements: LanguageRowMeasurements): boolean {
  return measurements.key === activeKey && SUPPORTED_LANGUAGES.every(language => (measurements.heights[language] ?? 0) > 0);
}
/** Geometry changes/programmatic recentering are not a language-selection gesture. */
export function languageAtWheelGestureOffset(
  offset: number,
  rowHeight: number,
  interaction: { userGesture: boolean; layoutReady: boolean },
): SupportedLanguage | null {
  return interaction.userGesture && interaction.layoutReady ? languageAtWheelOffset(offset, rowHeight) : null;
}

/** When a whole row cannot fit, use a normal scroll list rather than an invalid wheel. */
export function languagePickerViewport(rowHeight: number, availableHeight: number): {
  height: number; wholeSheetScroll: boolean; canFitWheel: boolean;
} {
  const available = Number.isFinite(availableHeight) ? availableHeight : 0;
  if (available < 52) return { height: 0, wholeSheetScroll: true, canFitWheel: false };
  const row = Number.isFinite(rowHeight) && rowHeight > 0 ? rowHeight : 52;
  const height = Math.min(row * 5, available);
  return { height, wholeSheetScroll: false, canFitWheel: row <= height };
}
