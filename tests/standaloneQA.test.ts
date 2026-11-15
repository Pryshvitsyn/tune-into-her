import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { scopeAppContext } from '../src/devQA/appScope';
import { QA_SCENARIOS } from '../src/devQA/scenarios';
import * as normalQA from '../src/devQA/session';
import { todayEntry } from '../src/domain/navigation/todayEntry';

const require = createRequire(import.meta.url);
const { prepareStandaloneQA, verifyStandaloneBundle, PROTECTED_INPUTS } = require('./native-launch/standalone-qa.cjs');
const fixtureRoots: string[] = [];
afterEach(() => { for (const root of fixtureRoots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function prepare() {
  const root = mkdtempSync(path.join(tmpdir(), 'tih-standalone-qa-test-')); fixtureRoots.push(root);
  for (const file of PROTECTED_INPUTS) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), readFileSync(new URL('../' + file, import.meta.url)));
  }
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({ main: 'expo-router/entry' }));
  return { root, manifest: prepareStandaloneQA({ projectRoot: root, acknowledge: true }) };
}
function loadPrivateSession(file: string) {
  const module = { exports: {} as typeof normalQA & { startStandaloneQA(): Promise<void> } };
  vm.runInNewContext(readFileSync(file, 'utf8'), { module, require: () => normalQA });
  return module.exports;
}

/** Actual AppProvider effects, with real-device service methods replaced by tripwires. */
function mountActualProvider(qa: ReturnType<typeof loadPrivateSession>) {
  const effects: (() => void)[] = [];
  const forbidden = vi.fn(() => { throw new Error('REAL_SERVICE_MUST_NOT_RUN'); });
  class LazyStore { get = forbidden; save = forbidden; readAll = forbidden; writeAll = forbidden; }
  class LazyNotifications { rebuild = forbidden; cancelAll = forbidden; }
  const paid = { getEntitlement: forbidden, addEntitlementListener: forbidden, getCachedEntitlement: forbidden };
  const trial = { getState: forbidden, getCachedState: forbidden, start: forbidden };
  const react = {
    createContext: () => ({ Provider: 'Provider' }), useContext: () => null,
    useCallback: (fn: unknown) => fn, useMemo: (fn: () => unknown) => fn(),
    useState: (initial: unknown) => [initial, vi.fn()],
    useEffect: (fn: () => void) => effects.push(fn),
  };
  const exports: Record<string, unknown> = {};
  const code = ts.transpileModule(readFileSync(new URL('../src/context/AppContext.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, process: { env: {} }, setTimeout, clearTimeout, setInterval, clearInterval, require(name: string) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (_type: unknown, props: unknown) => ({ props }) };
    if (name === 'react-native') return { AppState: { addEventListener: () => ({ remove() {} }) } };
    if (name === '@react-native-async-storage/async-storage') return { default: { multiRemove: forbidden } };
    if (name === 'expo-secure-store') return { deleteItemAsync: forbidden };
    if (name === '../config/brand.json') return { default: { displayName: 'Tune Into Her' } };
    if (name === '../devQA/appScope') return { scopeAppContext };
    if (name === '../devQA/session') return qa;
    if (name === '../devQA/useInternalQA') return { useInternalQASession: qa.internalQASession.getSnapshot };
    if (name === '../domain/content/dailyCueService') return { invalidateFutureSelections: forbidden };
    if (name === '../domain/cycle/cycleEngine') return { validateCycleSettings: () => [] };
    if (name === '../domain/cycle/dateOnly') return { toDateOnly: () => '2026-11-09' };
    if (name === '../i18n') return { initialLanguage: 'en', i18n: { changeLanguage: async () => undefined } };
    if (name === '../services/notifications/ExpoNotificationBackend') return { ExpoNotificationBackend: class {} };
    if (name === '../services/notifications/NotificationScheduler') return { NotificationScheduler: LazyNotifications };
    if (name === '../services/notifications/acceleratedDemo') return { stopDemoSession: forbidden };
    if (name === '../services/purchases') return { purchaseService: paid };
    if (name === '../services/trial') return { appTrialService: trial };
    if (name === '../storage/AsyncFeedbackStore') return { AsyncFeedbackStore: LazyStore };
    if (name === '../storage/AsyncSelectionStore') return { AsyncSelectionStore: LazyStore };
    if (name === '../storage/LocalManualCycleProvider') return { LocalManualCycleProvider: LazyStore };
    if (name === '../storage/keys') return { storageKeys: {} };
    if (name === '../storage/preferences') return { defaultPreferences: { language: 'en', onboardingComplete: false }, loadPreferences: forbidden, savePreferences: forbidden };
    throw new Error('Unexpected provider dependency: ' + name);
  } });
  const value = (exports.AppProvider as (props: object) => { props: { value: ReturnType<typeof scopeAppContext> } })({ children: null }).props.value;
  effects.forEach(effect => effect());
  return { value, forbidden };
}

describe('explicit build-only standalone QA tooling', () => {
  it('requires explicit preparation and keeps normal guard/context/index/entry inputs unchanged', () => {
    expect(() => prepareStandaloneQA()).toThrow('Explicit');
    const { root, manifest } = prepare();
    expect(manifest).toMatchObject({ scenario: 'paid-active', entry: 'panel', developmentJavaScript: false, normalProductionGatesUnchanged: true });
    for (const file of PROTECTED_INPUTS) {
      expect(readFileSync(path.join(root, file))).toEqual(readFileSync(new URL('../' + file, import.meta.url)));
    }
    expect(normalQA.createInternalQASession(false, 'true').enabled).toBe(false);
    expect(normalQA.standaloneQAEnabled).toBe(false);
    expect(readFileSync(manifest.files.index, 'utf8')).toContain('/dev-qa');
    expect(loadPrivateSession(manifest.files.session).standaloneQAEnabled).toBe(true);
    const today = prepareStandaloneQA({ projectRoot: root, acknowledge: true, entry: 'today' });
    expect(readFileSync(today.files.index, 'utf8')).toContain('/today');
    expect(() => prepareStandaloneQA({ projectRoot: root, acknowledge: true, entry: 'public' })).toThrow('Unsupported');
  });

  it('enables aliases only for its exact explicit Release entry and avoids an original-session import cycle', () => {
    const { root, manifest } = prepare();
    function loadConfig(env: Record<string, string>) {
      const module = { exports: {} as { resolver: { resolveRequest(context: object, name: string, platform: string): { filePath: string } } } };
      vm.runInNewContext(readFileSync(manifest.files.config, 'utf8'), { module, process: { env }, require(name: string) {
        if (name === 'node:path') return path;
        if (name === 'node:fs') return { realpathSync };
        if (name === 'expo/metro-config') return { getDefaultConfig: () => ({ resolver: {} }) };
        throw new Error('Unexpected config dependency');
      } });
      return module.exports;
    }
    expect(() => loadConfig({})).toThrow('explicit QA Release');
    expect(() => loadConfig({ ...manifest.requiredEnvironment, ENTRY_FILE: 'expo-router/entry' })).toThrow('explicit QA Release');
    expect(() => loadConfig({ ...manifest.requiredEnvironment, CONFIGURATION: 'Debug' })).toThrow('explicit QA Release');
    expect(() => loadConfig({ ...manifest.requiredEnvironment, EXPO_OVERRIDE_METRO_CONFIG: '' })).toThrow('explicit QA Release');
    expect(manifest.requiredEnvironment.EXPO_OVERRIDE_METRO_CONFIG).toBe(manifest.files.config);
    const resolver = loadConfig(manifest.requiredEnvironment).resolver.resolveRequest;
    const context = { originModulePath: path.join(root, 'src/context/AppContext.tsx'), resolveRequest: (_ctx: object, filePath: string) => ({ type: 'sourceFile', filePath }) };
    const original = path.join(root, 'src/devQA/session.ts');
    expect(resolver(context, original, 'ios').filePath).toBe(manifest.files.session);
    expect(resolver({ ...context, originModulePath: manifest.files.session }, original, 'ios').filePath).toBe(original);
    expect(resolver(context, path.join(root, 'app/index.tsx'), 'ios').filePath).toBe(manifest.files.index);
    const today = path.join(root, 'app/today.tsx');
    expect(resolver(context, today, 'ios').filePath).toBe(today);
  });

  it('rejects the emitted bootstrap-only graph that left AppProvider bound to the disabled singleton', () => {
    const module = (id: number, body: string, dependencies: number[]) => `__d(function (global, require, i, a, module, exports, _dependencyMap) { ${body} },${id},[${dependencies.join(',')}]);\n`;
    const graph = (sessionId: number) => [
      module(2, 'class InternalQASession {}', []),
      module(1, 'var original = require(_dependencyMap[0]); class StandaloneQASession extends original.InternalQASession {}', [2]),
      module(0, 'var qa = require(_dependencyMap[0]); throw new Error("STANDALONE_QA_SCOPE_REQUIRED");', [1]),
      module(3, 'var _session = require(_dependencyMap[0]); function AppProvider() { return _session.internalQAEnabled; }', [sessionId]),
      module(4, 'var _session = require(_dependencyMap[0]); function useInternalQASession() { return _session.internalQASession; }', [sessionId]),
      module(5, 'function StandaloneQAIndex() { return "/dev-qa"; }', []),
    ].join('');
    expect(() => verifyStandaloneBundle(graph(2))).toThrow('DISABLED_SINGLETON');
    expect(verifyStandaloneBundle(graph(1))).toMatchObject({ result: 'PASS', AppProviderUsesPrivateSession: true, hookUsesSamePrivateSession: true, entry: 'panel' });
    expect(() => verifyStandaloneBundle(graph(1).replace('StandaloneQAIndex', 'Index'))).toThrow('REQUIRED_MODULE');
    expect(() => verifyStandaloneBundle('Hermes binary is not the audited plain JS')).toThrow('UNSUPPORTED_METRO_FORMAT');
  });

  it('publishes memory ownership before synchronous native main registration and loads actual Today gates', async () => {
    const { manifest } = prepare(), qa = loadPrivateSession(manifest.files.session);
    const register = vi.fn(() => {
      expect(qa.internalQASession.getSnapshot()).toMatchObject({ active: true, accessReady: false });
      const provider = mountActualProvider(qa);
      expect(provider.value).toMatchObject({ qaActive: true, ready: true, accessReady: false });
      expect(provider.forbidden).not.toHaveBeenCalled();
    });
    vm.runInNewContext(readFileSync(manifest.files.entry, 'utf8'), { console, require(name: string) {
      if (name === manifest.files.session) return qa;
      if (name === 'expo-router/entry') { register(); return {}; }
      throw new Error('Unexpected entry dependency');
    } });
    expect(register).toHaveBeenCalledTimes(1); // must not wait for the async grant/Metro
    await qa.startStandaloneQA();
    const { value, forbidden } = mountActualProvider(qa);
    expect(value).toMatchObject({ ready: true, accessReady: true, qaActive: true, hasAccess: true });
    expect(value.entitlement.isMock).toBe(true);
    expect(todayEntry({ ready: value.ready, onboardingComplete: value.preferences.onboardingComplete, hasCycleSettings: Boolean(value.cycleSettings), hasAccess: value.hasAccess })).toBe('guidance');
    await value.refreshEntitlement(); await value.updatePreferences({ theme: 'dark' }, true);
    await value.selectionStore.writeAll([]); await value.rebuildNotifications();
    expect(forbidden).not.toHaveBeenCalled();
  });

  it('keeps all Founder scenarios in the existing isolated services before effects can mount', async () => {
    const { manifest } = prepare(), qa = loadPrivateSession(manifest.files.session);
    await qa.startStandaloneQA();
    for (const scenario of QA_SCENARIOS) {
      await qa.internalQASession.startScenario(scenario.id);
      const { value, forbidden } = mountActualProvider(qa);
      expect(value.qaActive).toBe(true);
      expect(qa.internalQASession.getSnapshot()).toMatchObject({ active: true, scenarioId: scenario.id });
      await value.refreshEntitlement();
      expect(forbidden).not.toHaveBeenCalled();
    }
  });

  it('never returns to personal stores/services if the standalone session is stopped', async () => {
    const { manifest } = prepare(), qa = loadPrivateSession(manifest.files.session);
    await qa.startStandaloneQA(); const previous = qa.internalQASession.getSnapshot();
    qa.internalQASession.stop();
    expect(qa.internalQASession.getSnapshot()).toMatchObject({ active: true, accessReady: false });
    await qa.internalQASession.refreshAccess();
    expect(qa.internalQASession.getSnapshot()).not.toBe(previous);
    const { value, forbidden } = mountActualProvider(qa);
    expect(value.qaActive).toBe(true); expect(forbidden).not.toHaveBeenCalled();
  });
});
