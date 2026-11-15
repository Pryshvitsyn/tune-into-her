import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

import { advanceSurfaceHandoff } from '../src/intro/surfaceHandoff';
import { INTRO_MS, validCircle } from '../src/intro/timeline';

type Element = { type: unknown; props: Record<string, unknown> };

/** Execute the actual component and effects with a small hook host. GPU ownership
 * still uses the real four-frame worklet; this does not claim a native paint test. */
async function mountSurface(launch: boolean) {
  const slots: unknown[] = [];
  let cursor = 0, dirty = true;
  let effects: (() => void)[] = [];
  let tree: Element;
  const frameCallbacks: { callback(): void; active: boolean; setActive(value: boolean): void }[] = [];
  const same = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const hooks = {
    forwardRef: (component: unknown) => component,
    useRef<T>(value: T) { const id = cursor++; return (slots[id] ??= { current: value }) as { current: T }; },
    useState<T>(initial: T) {
      const id = cursor++;
      if (!(id in slots)) slots[id] = initial;
      return [slots[id], (next: T) => { if (!Object.is(slots[id], next)) { slots[id] = next; dirty = true; } }];
    },
    useMemo<T>(factory: () => T, dependencies: unknown[]) {
      const id = cursor++, previous = slots[id] as { dependencies: unknown[]; value: T } | undefined;
      if (!previous || !same(previous.dependencies, dependencies)) slots[id] = { dependencies, value: factory() };
      return (slots[id] as { value: T }).value;
    },
    useCallback<T>(callback: T, dependencies: unknown[]) { return hooks.useMemo(() => callback, dependencies); },
    useEffect(effect: () => void | (() => void), dependencies: unknown[]) {
      const id = cursor++, previous = slots[id] as { dependencies: unknown[]; cleanup?: () => void } | undefined;
      if (!previous || !same(previous.dependencies, dependencies)) effects.push(() => {
        previous?.cleanup?.(); slots[id] = { dependencies, cleanup: effect() };
      });
    },
    useImperativeHandle() {},
  };
  const cancelAnimation = vi.fn();
  const reanimated = {
    default: { View: 'AnimatedView' }, cancelAnimation, Easing: { linear: 'linear' }, ReduceMotion: { Never: 'never' },
    runOnJS: (callback: unknown) => callback, withTiming: (value: number) => value,
    useAnimatedStyle: () => ({}),
    useSharedValue: (value: unknown) => hooks.useRef({ value }).current,
    useFrameCallback(callback: () => void) {
      const entry = hooks.useRef({ callback, active: false, setActive(value: boolean) { this.active = value; } }).current;
      entry.callback = callback;
      if (!frameCallbacks.includes(entry)) frameCallbacks.push(entry);
      return entry;
    },
  };
  const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
  const exports: Record<string, unknown> = {};
  const source = readFileSync(new URL('../src/intro/SphereIntroSurface.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(compiled, { exports, __DEV__: false, console, setTimeout, clearTimeout, require(name: string) {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return { Image: 'Image', View: 'View', StyleSheet: { absoluteFill: {} } };
    if (name === 'react-native-reanimated') return reanimated;
    if (name === 'react-native-webview') return { WebView: 'WebView' };
    if (name === '../../TuneIntoHerSphereV4') return { prepareSphereAsset: () => Promise.resolve('AAAA') };
    if (name === './ApprovedOpening') return { ApprovedOpening: 'ApprovedOpening' };
    if (name === './LaunchPresentation') return { DestinationSphere: 'DestinationSphere', useLaunchPresentation: () => ({ prepareDestinationSpheres: true }) };
    if (name === './introPresentation') return { approvedOpeningOpacity: () => 0 };
    if (name === './sphereHtml') return { makeSphereHtml: () => '<html></html>' };
    if (name === './surfaceHandoff') return { advanceSurfaceHandoff };
    if (name === './timeline') return { INTRO_MS, validCircle };
    if (name.endsWith('.png')) return 'poster';
    throw new Error('Unexpected Surface dependency: ' + name);
  } });
  const elapsed = { value: 0 }, onComplete = vi.fn(), onAssembled = vi.fn();
  const props = { launch, elapsed, onComplete, onAssembled, animate: true, active: true, preferencesReady: true,
    reducedMotion: false, ink: '#294458', view: { width: 400, height: 800 }, target: { x: 200, y: 400, radius: 100 } };
  const commands: string[] = [];
  const find = (type: string, node: unknown = tree): Element | undefined => {
    if (Array.isArray(node)) return node.map(child => find(type, child)).find(Boolean);
    if (!node || typeof node !== 'object') return;
    const element = node as Element;
    return element.type === type ? element : element.props?.children == null ? undefined : find(type, element.props.children);
  };
  const flush = async () => {
    for (let turn = 0; turn < 12; turn++) {
      if (dirty) {
        dirty = false; cursor = 0;
        tree = (exports.SphereIntroSurface as (props: unknown, ref: null) => Element)(props, null);
        const web = find('WebView');
        if (web) (web.props.ref as { current: unknown }).current = { injectJavaScript: (value: string) => commands.push(value) };
        const queued = effects; effects = []; queued.forEach(effect => effect());
      }
      await Promise.resolve();
    }
  };
  const message = async (type: string, data = {}) => {
    (find('WebView')!.props.onMessage as (event: unknown) => void)({ nativeEvent: { data: JSON.stringify({ type, ...data }) } });
    await flush();
  };
  await flush();
  (find('ApprovedOpening')!.props.onReady as () => void)(); await flush();
  await message('ready');
  return { elapsed, onComplete, onAssembled, cancelAnimation, commands, find, flush, message,
    async release() {
      await message('prepared', { token: 1, elapsed: 0 });
      for (let i = 0; i < 4; i++) frameCallbacks.filter(entry => entry.active).forEach(entry => entry.callback());
      await flush();
    },
  };
}

describe('actual Surface launch event handoff', () => {
  it('forwards launch mode, waits for release, and completes without jumping/cancelling the scene clock', async () => {
    const surface = await mountSurface(true);
    expect(surface.commands.some(command => command.includes('"launch":true'))).toBe(true);
    await surface.message('assembled'); await surface.message('complete');
    expect(surface.onAssembled).not.toHaveBeenCalled(); expect(surface.onComplete).not.toHaveBeenCalled();
    await surface.release();
    await surface.message('assembled'); await surface.message('assembled');
    expect(surface.onAssembled).toHaveBeenCalledTimes(1);
    surface.elapsed.value = 5516; surface.cancelAnimation.mockClear();
    await surface.message('complete', { elapsed: 5516 }); await surface.message('complete', { elapsed: 5516 });
    expect(surface.onComplete).toHaveBeenCalledTimes(1);
    expect(surface.elapsed.value).toBe(5516);
    expect(surface.cancelAnimation).not.toHaveBeenCalled();
  });

  it('retains the original nonlaunch Today completion clock and ignores launch assembly events', async () => {
    const surface = await mountSurface(false); await surface.release();
    await surface.message('assembled');
    expect(surface.onAssembled).not.toHaveBeenCalled();
    surface.elapsed.value = 5516; surface.cancelAnimation.mockClear();
    await surface.message('complete', { elapsed: INTRO_MS });
    expect(surface.elapsed.value).toBe(INTRO_MS);
    expect(surface.cancelAnimation).toHaveBeenCalled();
    expect(surface.onComplete).toHaveBeenCalledTimes(1);
  });

  it('recovers renderer failure with the loaded poster, bypassing the assembly hold', async () => {
    const surface = await mountSurface(true);
    (surface.find('WebView')!.props.onError as () => void)(); await surface.flush();
    (surface.find('Image')!.props.onLoad as () => void)(); await surface.flush();
    expect(surface.onAssembled).not.toHaveBeenCalled();
    expect(surface.onComplete).toHaveBeenCalledTimes(1);
    expect(surface.elapsed.value).toBe(INTRO_MS);
  });
});
