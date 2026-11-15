import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

import { hasValidPreviousDestination } from '../src/navigation/screenNavigation';

type Element = { type: string; props: Record<string, unknown> };

function renderSecondaryNav() {
  let stack: { index: number; routes: { name: string }[] } = { index: 0, routes: [{ name: 'privacy' }] };
  let canGoBack = false;
  let hardwareBack: (() => boolean) | undefined;
  const router = { back: vi.fn(), replace: vi.fn(), dismissTo: vi.fn() };
  const exports: Record<string, unknown> = {};
  const source = readFileSync(new URL('../src/components/SecondaryNav.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(compiled, { exports, require(name: string) {
    if (name === 'react') return { useCallback: (callback: unknown) => callback };
    if (name === 'react/jsx-runtime') {
      const jsx = (type: string, props: Record<string, unknown>) => ({ type, props });
      return { jsx, jsxs: jsx };
    }
    if (name === 'expo-router') return { router, useFocusEffect: (callback: () => void) => callback(), useNavigation: () => ({
      canGoBack: () => canGoBack, getState: () => stack,
    }) };
    if (name === 'react-i18next') return { useTranslation: () => ({ t: (key: string) => ({
      'common.back': 'Localized Back', 'settings.title': 'Localized Settings',
    } as Record<string, string>)[key] }) };
    if (name === 'react-native') return { View: 'View', Pressable: 'Pressable', BackHandler: {
      addEventListener: (_event: string, callback: () => boolean) => { hardwareBack = callback; return { remove() {} }; },
    } };
    if (name === '../navigation/screenNavigation') return { hasValidPreviousDestination };
    if (name === '../theme/useTheme') return { useTheme: () => ({ colors: { primary: '#536D80', background: '#F5F8FA' } }) };
    if (name === './AppText') return { AppText: 'AppText' };
    throw new Error('Unexpected secondary footer dependency: ' + name);
  } });
  const element = (exports.SecondaryNav as () => Element)();
  const controls = element.props.children as Element[];
  const get = (id: string) => controls.find(control => control.props.testID === id)!;
  return { router, get, hardwareBack: () => hardwareBack!(), setNavigation(value: typeof stack, canBack = true) { stack = value; canGoBack = canBack; } };
}

describe('icon-only secondary footer', () => {
  it('exposes localized button names while drawing only decorative arrow and existing gear glyphs', () => {
    const footer = renderSecondaryNav();
    for (const [id, label, glyph] of [
      ['secondary-back', 'Localized Back', '←'], ['secondary-settings', 'Localized Settings', '⚙'],
    ]) {
      const control = footer.get(id!);
      expect(control.props.accessibilityRole).toBe('button');
      expect(control.props.accessibilityLabel).toBe(label);
      const icon = control.props.children as Element;
      expect(icon.props.children).toBe(glyph);
      expect(icon.props.accessible).toBe(false);
      expect(icon.props.allowFontScaling).toBe(false);
      expect(control.props.style).toMatchObject({ minHeight: 48, minWidth: 48 });
    }
  });

  it('retains the Settings destination', () => {
    const footer = renderSecondaryNav();
    (footer.get('secondary-settings').props.onPress as () => void)();
    expect(footer.router.dismissTo).toHaveBeenCalledWith('/settings');
  });

  it('reads the current owning stack at gesture time and retains the Today fallback', () => {
    const footer = renderSecondaryNav();
    (footer.get('secondary-back').props.onPress as () => void)();
    expect(footer.router.replace).toHaveBeenCalledWith('/today');
    footer.setNavigation({ index: 1, routes: [{ name: 'settings/index' }, { name: 'privacy' }] });
    expect(footer.hardwareBack()).toBe(true);
    expect(footer.router.back).toHaveBeenCalledTimes(1);
    footer.setNavigation({ index: 1, routes: [{ name: 'index' }, { name: 'privacy' }] });
    (footer.get('secondary-back').props.onPress as () => void)();
    expect(footer.router.back).toHaveBeenCalledTimes(1);
    expect(footer.router.replace).toHaveBeenCalledTimes(2);
  });
});
