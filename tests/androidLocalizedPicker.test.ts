import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { createInstance } from 'i18next';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../src/config/constants';
import * as dateOnly from '../src/domain/cycle/dateOnly';
import { localeForLanguage } from '../src/i18n/locale';
import picker from '../src/i18n/picker.json';
import { resources } from '../src/i18n/resources';

type Element = { type: string | ((props: Record<string, unknown>) => Element); props: Record<string, unknown> };

async function harness(file = 'AndroidDateTimePicker', language: SupportedLanguage = 'ru', platform = 'android') {
  const i18n = createInstance();
  await i18n.init({ resources, lng: language, fallbackLng: false, load: 'currentOnly' });
  const slots: unknown[] = [];
  let cursor = 0;
  const react = {
    useRef: (initial: unknown) => {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useState: (initial: unknown) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (next: unknown) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
  };
  const exports: Record<string, (props: Record<string, unknown>) => Element> = {};
  const source = readFileSync(new URL(`../src/components/${file}.tsx`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { exports, Intl, Date, require(name: string) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') {
      const jsx = (type: Element['type'], props: Element['props']) => ({ type, props });
      return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    }
    if (name === 'react-i18next') return { useTranslation: () => ({ t: i18n.t.bind(i18n) }) };
    if (name === 'react-native') return { Modal: 'Modal', Pressable: 'Pressable', ScrollView: 'ScrollView', View: 'View', Platform: { OS: platform }, StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 } };
    if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 24, bottom: 16 }) };
    if (name === '../context/AppContext') return { useApp: () => ({ preferences: { language } }) };
    if (name === '../domain/cycle/dateOnly') return dateOnly;
    if (name === '../i18n/locale') return { localeForLanguage };
    if (name === '../theme') return { spacing: { sm: 8, md: 16, lg: 24 } };
    if (name === '../theme/useTheme') return { useTheme: () => ({ dark: false, colors: { text: '#172932', secondary: '#536D80', primary: '#536D80', border: '#ccc', background: '#fff' } }) };
    if (name === './AppText') return { AppText: 'Text' };
    if (name === './Button') return { Button: 'Button' };
    if (name === './AndroidDateTimePicker') return { AndroidDateTimePicker: 'AndroidPicker' };
    if (name === '@react-native-community/datetimepicker') return { __esModule: true, default: 'NativePicker' };
    throw new Error('Unexpected picker dependency: ' + name);
  } });
  const expand = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(expand);
    if (!node || typeof node !== 'object' || !('type' in node)) return node;
    const element = node as Element;
    if (typeof element.type === 'function') return expand(element.type(element.props));
    return { ...element, props: { ...element.props, children: expand(element.props.children) } };
  };
  let tree: unknown;
  return {
    t: i18n.t.bind(i18n),
    render(name: string, props: Record<string, unknown>) { cursor = 0; tree = expand(exports[name]!(props)); return tree; },
    all() {
      const elements: Element[] = [];
      const visit = (node: unknown) => {
        if (Array.isArray(node)) { node.forEach(visit); return; }
        if (!node || typeof node !== 'object' || !('type' in node)) return;
        const element = node as Element; elements.push(element); visit(element.props.children);
      };
      visit(tree); return elements;
    },
    get(id: string) { return this.all().find(element => element.props.testID === id)!; },
    press(id: string) {
      const element = this.get(id); expect(element, id).toBeDefined(); expect(element.props.disabled, id).not.toBe(true);
      (element.props.onPress as () => void)();
    },
  };
}

describe('Android app-language date/time dialogs', () => {
  it.each(SUPPORTED_LANGUAGES)('%s uses its own labels/months/actions without consulting OS locale', async language => {
    const h = await harness('AndroidDateTimePicker', language);
    h.render('AndroidDateTimePicker', { mode: 'date', value: new Date(2024, 1, 29), maximumDate: new Date(2026, 10, 15), language, onConfirm: vi.fn(), onCancel: vi.fn() });
    expect(h.get('android-picker-month-value').props.children).toBe(new Intl.DateTimeFormat(localeForLanguage(language), { month: 'long' }).format(new Date(2024, 1, 29)));
    expect(h.get('android-picker-confirm').props.label).toBe(h.t('common.done'));
    expect(h.get('android-picker-cancel').props.label).toBe(h.t('common.cancel'));
    for (const label of Object.values(picker[language]).slice(0, 3)) expect(h.all().some(element => element.props.children === label)).toBe(true);
    expect(h.all().some(element => element.type === 'NativePicker')).toBe(false);
    h.render('AndroidDateTimePicker', { mode: 'time', value: new Date(2024, 1, 29, 8, 15), language, onConfirm: vi.fn(), onCancel: vi.fn() });
    for (const label of Object.values(picker[language]).slice(3)) expect(h.all().some(element => element.props.children === label)).toBe(true);
  });

  it('holds a leap-day draft until Done and clamps it when changing to a non-leap year', async () => {
    const h = await harness(), onConfirm = vi.fn(), onCancel = vi.fn();
    const props = { mode: 'date', value: new Date(2024, 1, 29), maximumDate: new Date(2026, 10, 15), language: 'ru', onConfirm, onCancel };
    h.render('AndroidDateTimePicker', props); h.press('android-picker-year-increase'); h.render('AndroidDateTimePicker', props);
    expect(h.get('android-picker-day-value').props.children).toBe('28');
    expect(onConfirm).not.toHaveBeenCalled();
    h.press('android-picker-confirm'); h.press('android-picker-confirm');
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(dateOnly.toDateOnly(onConfirm.mock.calls[0]![0])).toBe('2025-02-28');
  });

  it('enforces the maximum calendar date before explicit confirmation', async () => {
    const h = await harness(), onConfirm = vi.fn();
    const props = { mode: 'date', value: new Date(2027, 2, 30), maximumDate: new Date(2026, 10, 15), language: 'ru', onConfirm, onCancel: vi.fn() };
    h.render('AndroidDateTimePicker', props);
    for (const field of ['day', 'month', 'year']) expect(h.get(`android-picker-${field}-increase`).props.disabled).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();
    h.press('android-picker-confirm');
    expect(dateOnly.toDateOnly(onConfirm.mock.calls[0]![0])).toBe('2026-11-15');
  });

  it('cancels by button or Android hardware back without committing a draft', async () => {
    for (const hardwareBack of [false, true]) {
      const h = await harness(), onConfirm = vi.fn(), onCancel = vi.fn();
      const props = { mode: 'time', value: new Date(2026, 0, 1, 8, 15), language: 'ru', onConfirm, onCancel };
      h.render('AndroidDateTimePicker', props); h.press('android-picker-minute-increase'); h.render('AndroidDateTimePicker', props);
      if (hardwareBack) (h.all().find(e => e.type === 'Modal')!.props.onRequestClose as () => void)();
      else h.press('android-picker-cancel');
      expect(onConfirm).not.toHaveBeenCalled(); expect(onCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('uses bounded 24-hour time controls and commits the chosen time only once', async () => {
    const h = await harness(), onConfirm = vi.fn();
    const props = { mode: 'time', value: new Date(2026, 0, 1, 23, 58), language: 'ru', onConfirm, onCancel: vi.fn() };
    h.render('AndroidDateTimePicker', props); expect(h.get('android-picker-hour-increase').props.disabled).toBe(true);
    h.press('android-picker-minute-increase'); h.render('AndroidDateTimePicker', props);
    expect(h.get('android-picker-minute-increase').props.disabled).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled(); h.press('android-picker-confirm');
    const chosen = onConfirm.mock.calls[0]![0] as Date;
    expect([chosen.getHours(), chosen.getMinutes()]).toEqual([23, 59]);
    for (const control of h.all().filter(e => e.type === 'Pressable')) expect(control.props.style).toContainEqual(expect.objectContaining({ width: 48, height: 48 }));
    expect(h.all().find(e => e.type === 'ScrollView')).toBeDefined();
    expect(h.all().find(e => e.type === 'View' && e.props.accessibilityViewIsModal)?.props.importantForAccessibility).toBe('yes');
  });

  it('keeps an unset Cycle field unset through open/cancel and commits only a confirmed date', async () => {
    const h = await harness('CycleDateField'), onChange = vi.fn();
    const props = { value: null, onChange, maximumDate: new Date(2026, 10, 15) };
    h.render('CycleDateField', props);
    (h.all().find(e => e.type === 'Button')!.props.onPress as () => void)(); h.render('CycleDateField', props);
    expect(h.all().some(e => e.type === 'NativePicker')).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    const modal = h.all().find(e => e.type === 'AndroidPicker')!;
    (modal.props.onCancel as () => void)(); h.render('CycleDateField', props);
    expect(onChange).not.toHaveBeenCalled();
    (h.all().find(e => e.type === 'Button')!.props.onPress as () => void)(); h.render('CycleDateField', props);
    (h.all().find(e => e.type === 'AndroidPicker')!.props.onConfirm as (date: Date) => void)(new Date(2026, 10, 12));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2026-11-12');
  });

  it.each(['cancel', 'confirm'])('the shared reminder field changes its parent only on confirmation (%s)', async action => {
    const h = await harness(), onChange = vi.fn();
    const props = { value: new Date(2026, 10, 15, 8, 15), language: 'ru', onChange };
    h.render('AndroidTimeField', props); h.press('android-time-open'); h.render('AndroidTimeField', props);
    h.press('android-picker-hour-increase'); h.render('AndroidTimeField', props);
    expect(onChange).not.toHaveBeenCalled(); h.press(`android-picker-${action}`);
    if (action === 'confirm') {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]![0].getHours()).toBe(9);
    } else expect(onChange).not.toHaveBeenCalled();
    h.render('AndroidTimeField', props);
    expect(h.all().some(element => element.type === 'Modal')).toBe(false);
  });

  it('preserves iOS native spinner candidate/Done/Cancel behavior and selected locale', async () => {
    const h = await harness('CycleDateField', 'ru', 'ios'), onChange = vi.fn();
    const props = { value: '2026-11-10', onChange, maximumDate: new Date(2026, 10, 15) };
    h.render('CycleDateField', props);
    (h.all().find(e => e.type === 'Button')!.props.onPress as () => void)(); h.render('CycleDateField', props);
    const native = h.all().find(e => e.type === 'NativePicker')!;
    expect(native.props).toMatchObject({ display: 'spinner', mode: 'date', locale: 'ru', themeVariant: 'light' });
    expect(h.all().some(e => e.type === 'AndroidPicker')).toBe(false);
    (native.props.onChange as (event: object, date: Date) => void)({}, new Date(2026, 10, 11)); h.render('CycleDateField', props);
    expect(onChange).not.toHaveBeenCalled();
    (h.all().find(e => e.type === 'Button' && e.props.label === h.t('common.done'))!.props.onPress as () => void)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2026-11-11');
  });
});
