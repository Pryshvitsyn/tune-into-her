import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');
const helper = read('../assets/launch/EarlyLaunchWindow.swift');
const native = read('../ios/TuneIntoHer/AppDelegate.swift');
const plugin = createRequire(import.meta.url)('../plugins/with-approved-launch-splash.cjs') as {
  withEarlyLaunchBridge(contents: string, helper: string): string;
};
const capture = createRequire(import.meta.url)('./native-launch/capture-startup.cjs') as { parseOptions(args: string[]): { workers: number; workerMs: number } | null };
const normalizedImports = (source: string) => source.replace(/(?:^(?:internal )?import [^\n]+\n)+/m, imports => imports.trimEnd().split('\n').sort().join('\n') + '\n');
const baseline = execFileSync('git', ['show', '71504ac:ios/TuneIntoHer/AppDelegate.swift'], {
  cwd: new URL('..', import.meta.url), encoding: 'utf8',
});
const generated = plugin.withEarlyLaunchBridge(baseline, helper);
const method = (source: string, start: string, end: string) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));

/** Source integration checks cannot establish UIKit presentation; the guarded capture
 * runner separately records actual native frames, stage ordering and startup pressure. */
describe('app-owned early native launch integration', () => {
  it('regenerates the checked-in AppDelegate from the actual pre-bridge template, idempotently', () => {
    expect(normalizedImports(generated)).toBe(normalizedImports(native));
    expect(plugin.withEarlyLaunchBridge(generated, helper)).toBe(generated);
    expect(generated.split('final class TIHEarlyLaunchWindow: UIWindow')).toHaveLength(2);
    const emittedHelper = generated.split('// @generated TIH_EARLY_LAUNCH_BEGIN\n')[1]!.split('\n// @generated TIH_EARLY_LAUNCH_END')[0];
    expect(emittedHelper).toBe(helper.trim());
  });

  it('retains existing deep links and bundle resolution, and refuses an unknown startup template', () => {
    expect(method(generated, '  // Linking API', 'class ReactNativeDelegate')).toBe(method(baseline, '  // Linking API', 'class ReactNativeDelegate'));
    expect(generated.slice(generated.indexOf('  override func sourceURL'), generated.indexOf('// @generated TIH_EARLY_LAUNCH_BEGIN')).trim())
      .toBe(baseline.slice(baseline.indexOf('  override func sourceURL')).trim());
    expect(() => plugin.withEarlyLaunchBridge('class AppDelegate {}', helper)).toThrow('startup boundary changed');
  });

  it('creates the Release window before deferred factory initialization and preserves normal Debug startup', () => {
    const entry = method(generated, 'didFinishLaunchingWithOptions launchOptions:', '  private func startReactNative');
    const branches = entry.match(/#if DEBUG([\s\S]*?)#else([\s\S]*?)#endif/)!;
    expect(branches).not.toBeNull();
    expect(branches[1]).toContain('window = UIWindow');
    expect(branches[1]).toContain('startReactNative(launchOptions: launchOptions)');
    expect(branches[2]!.indexOf('TIHEarlyLaunchWindow(frame:')).toBeLessThan(branches[2]!.indexOf('startAfterNativeFrame'));
    expect(branches[2]).not.toContain('ExpoReactNativeFactory(');
    expect(entry).not.toContain('let factory');
    const boot = method(helper, 'override init(frame:', 'required init?');
    expect(boot).toContain('instantiateInitialViewController()');
    expect(boot).toContain('isOpaque = true');
    expect(boot).toContain('makeKeyAndVisible()');
    expect(boot).toContain('addSubview(view)');
  });

  it('retains the window-level cover through root replacement and waits for two foreground frame callbacks', () => {
    const keepCover = method(helper, 'override func didAddSubview', 'func expoSplashInstalled');
    expect(keepCover).toContain('subview !== cover');
    expect(keepCover).toContain('cover.superview === self');
    expect(keepCover).toContain('bringSubviewToFront(cover)');
    const frames = method(helper, '@objc private func onDisplayFrame', 'guard let root = candidate');
    expect(frames).toContain('applicationState != .background');
    expect(frames.indexOf('coverFrames >= 2')).toBeLessThan(frames.indexOf('trace("FACTORY_BEGIN")'));
    expect(frames.indexOf('startReact = nil')).toBeLessThan(frames.indexOf('start()'));
  });

  it('hands off only after Expo customization and an attached, sized current root has survived two callbacks', () => {
    const customization = method(generated, 'override func customize(', 'override func sourceURL');
    expect(customization.indexOf('super.customize(rootView)')).toBeLessThan(customization.indexOf('expoSplashInstalled(on: rootView)'));
    const handoff = method(helper, 'guard let root = candidate', 'private func trace');
    for (const condition of ['root.window === self', 'rootViewController?.view === root', 'root.bounds.width > 0', 'root.bounds.height > 0', 'expo.window === self', 'expo.superview != nil']) {
      expect(handoff).toContain(condition);
    }
    expect(handoff.indexOf('attachedFrames >= 2')).toBeLessThan(handoff.indexOf('cover?.removeFromSuperview()'));
    expect(handoff).toContain('link?.invalidate()');
    expect(handoff).toContain('candidate = nil');
  });

  it('accepts Expo intentional fast hide without relying on an unrelated content-ready notification', () => {
    expect(helper).toContain('|| expo.isHidden');
    expect(helper).not.toContain('RCTContentDidAppearNotification');
    const expo = read('../node_modules/expo-splash-screen/ios/SplashScreenManager.swift');
    const hide = method(expo, '  func hide()', '  func setOptions');
    // This is the pinned SDK contract that makes the fast-hide path safe in both branches.
    expect(hide.match(/loadingView\?\.isHidden = true/g)).toHaveLength(2);
  });

  it('compiles deliberate main-thread pressure only into an explicit native QA build', () => {
    const qa = helper.match(/#if TIH_NATIVE_LAUNCH_QA([\s\S]*?)#endif/)!;
    expect(qa).not.toBeNull();
    expect(qa[1]).toContain('arguments.contains("-TIHStartupStress")');
    expect(qa[1]).toContain('QA_FACTORY_PRESSURE_COMPLETE');
    const normalRelease = helper.replace(qa[0], '');
    expect(normalRelease).not.toContain('while CACurrentMediaTime()');
    expect(normalRelease).not.toContain('TIHStartupStress');
    expect(normalRelease).not.toContain('Thread.sleep');
    expect(normalRelease).not.toContain('asyncAfter');
  });
});


describe('guarded standalone capture input', () => {
  const valid = ['--device', '00000000-0000-0000-0000-000000000001', '--app', '/tmp/TuneIntoHer.app', '--out', '/tmp/new-capture', '--expected-binary-sha256', 'a'.repeat(64), '--expected-js-sha256', 'b'.repeat(64)];
  it('requires an explicit device and both current-artifact checksums before any capture', () => {
    expect(capture.parseOptions(['--help'])).toBeNull();
    expect(() => capture.parseOptions([])).toThrow('Simulator UUID');
    expect(() => capture.parseOptions([...valid.slice(0, 6)])).toThrow('checksums');
    expect(() => capture.parseOptions(['--device', 'booted', ...valid.slice(2)])).toThrow('Simulator UUID');
  });
  it('rejects unbounded host work and accepts the exact documented maximum', () => {
    expect(capture.parseOptions([...valid, '--workers', '6', '--worker-ms', '6000'])).toMatchObject({ workers: 6, workerMs: 6000 });
    expect(() => capture.parseOptions([...valid, '--workers', '7'])).toThrow('workers');
    expect(() => capture.parseOptions([...valid, '--worker-ms', '6001'])).toThrow('duration');
    expect(() => capture.parseOptions([...valid, '--workers', '1.5'])).toThrow('workers');
  });
});
