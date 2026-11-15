import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { isEstimatedPeriodDate } from '../src/domain/cycle/calendarPeriodEstimate';
import { toDateOnly } from '../src/domain/cycle/dateOnly';
import copy from '../src/i18n/interface.json';

type Element = { type: string; props: Record<string, unknown> };

function renderCalendar(compact: boolean, fontScale = 1) {
  let offset = 0;
  const settings = Object.freeze({ lastKnownPeriodStart: '2026-11-03', typicalCycleLength: 28, typicalPeriodLength: 5 });
  const exports: Record<string, unknown> = {};
  const source = readFileSync(new URL('../src/components/CycleCalendar.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(compiled, { exports, Date, require(name: string) {
    if (name === 'react') return { useState: () => [offset, (update: (value: number) => number) => { offset = update(offset); }] };
    if (name === 'react/jsx-runtime') {
      const jsx = (type: string, props: Record<string, unknown>) => ({ type, props });
      return { jsx, jsxs: jsx };
    }
    if (name === 'react-native') return { Pressable: 'Pressable', ScrollView: 'ScrollView', View: 'View', useWindowDimensions: () => ({ width: 375, height: 667, fontScale }) };
    if (name === '../context/AppContext') return { useApp: () => ({ cycleSettings: settings, preferences: { language: 'en' }, now: () => new Date(2026, 10, 15, 12) }) };
    if (name === '../domain/cycle/calendarPeriodEstimate') return { isEstimatedPeriodDate };
    if (name === '../domain/cycle/dateOnly') return { toDateOnly };
    if (name === '../i18n/useInterface') return { useInterface: () => copy.en };
    if (name === '../theme/useTheme') return { useTheme: () => ({ colors: { text: '#263A49', secondary: '#657A89', overlay: '#E7EEF3' } }) };
    if (name === './AppText') return { AppText: 'AppText' };
    throw new Error('Unexpected Calendar dependency: ' + name);
  } });
  const render = () => (exports.CycleCalendar as (props: unknown) => Element)({ compact });
  const all = (tree: unknown, type: string): Element[] => {
    if (Array.isArray(tree)) return tree.flatMap(child => all(child, type));
    if (!tree || typeof tree !== 'object') return [];
    const node = tree as Element;
    return [...(node.type === type ? [node] : []), ...all(node.props?.children, type)];
  };
  return { render, all, settings };
}

describe('compact calendar preserves the actual cycle presentation', () => {
  it('retains every date, sixth week and future estimate when spacing is compact', () => {
    const regular = renderCalendar(false), compact = renderCalendar(true);
    const dates = (calendar: ReturnType<typeof renderCalendar>) => calendar.all(calendar.render(), 'AppText')
      .filter(node => node.props.accessibilityLabel).map(node => ({ label: node.props.accessibilityLabel, day: node.props.children, estimate: (node.props.style as { backgroundColor: string }).backgroundColor }));
    const entries = dates(compact);
    expect(entries).toEqual(dates(regular));
    expect(entries).toHaveLength(42);
    expect(entries.at(-1)?.day).toBe(6); // December6 remains in the sixth week
    expect(entries.filter(entry => entry.estimate === '#E7EEF3')).toHaveLength(10);
    expect(compact.settings).toEqual({ lastKnownPeriodStart: '2026-11-03', typicalCycleLength: 28, typicalPeriodLength: 5 });
  });

  it('keeps month controls usable and navigation reversible without changing saved data', () => {
    const calendar = renderCalendar(true);
    const before = calendar.all(calendar.render(), 'AppText').map(node => node.props.children);
    const next = calendar.all(calendar.render(), 'Pressable').find(node => node.props.accessibilityLabel === copy.en.nextMonth)!;
    expect(next.props.style).toMatchObject({ minHeight: 44, minWidth: 44 });
    (next.props.onPress as () => void)();
    expect(calendar.all(calendar.render(), 'AppText').some(node => node.props.children === 'December 2026')).toBe(true);
    const previous = calendar.all(calendar.render(), 'Pressable').find(node => node.props.accessibilityLabel === copy.en.previousMonth)!;
    (previous.props.onPress as () => void)();
    expect(calendar.all(calendar.render(), 'AppText').map(node => node.props.children)).toEqual(before);
  });

  it('keeps all dates and horizontal room at maximum Dynamic Type without clamping text', () => {
    const calendar = renderCalendar(true, 3.57), tree = calendar.render();
    const scroll = calendar.all(tree, 'ScrollView')[0]!;
    expect(scroll.props.horizontal).toBe(true);
    expect((scroll.props.contentContainerStyle as { minWidth: number }).minWidth).toBeGreaterThan(327);
    const dates = calendar.all(tree, 'AppText').filter(node => node.props.accessibilityLabel);
    expect(dates).toHaveLength(42);
    expect(dates.every(node => node.props.numberOfLines === undefined && node.props.allowFontScaling !== false)).toBe(true);
  });
});
