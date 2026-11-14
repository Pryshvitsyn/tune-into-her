const fs = require('node:fs/promises');
const path = require('node:path');

const { withAppDelegate, withDangerousMod, withMod } = require('expo/config-plugins');
const { parseStringPromise } = require('xml2js');

/** Register BEFORE expo-splash-screen, whose storyboard provider must remain last. */
function withApprovedLaunchSplash(config) {
  config = withAppDelegate(config, async config => {
    if (config.modResults.language !== 'swift') throw new Error('The early native launch bridge requires the existing Swift AppDelegate');
    const helper = await fs.readFile(path.join(config.modRequest.projectRoot, 'assets/launch/EarlyLaunchWindow.swift'), 'utf8');
    config.modResults.contents = withEarlyLaunchBridge(config.modResults.contents, helper);
    return config;
  });
  config = withMod(config, {
    platform: 'ios',
    mod: 'splashScreenStoryboard',
    action: async config => {
      const template = await fs.readFile(path.join(config.modRequest.projectRoot, 'assets/launch/SplashScreen.storyboard'), 'utf8');
      config.modResults = await parseStringPromise(template);
      return config;
    },
  });
  return withDangerousMod(config, ['ios', async config => {
    const source = path.join(config.modRequest.projectRoot, 'assets/launch');
    const images = path.join(config.modRequest.platformProjectRoot, config.modRequest.projectName, 'Images.xcassets');
    for (const [name, filename, scale] of [
      ['LaunchLogo', 'official-launch-mark.png', '2x'],
      ['LaunchSteelBackground', 'steel-background.png', '1x'],
    ]) {
      const target = path.join(images, `${name}.imageset`);
      await fs.mkdir(target, { recursive: true });
      await fs.copyFile(path.join(source, filename), path.join(target, filename));
      await fs.writeFile(path.join(target, 'Contents.json'), JSON.stringify({ images: [{ idiom: 'universal', filename, scale }], info: { version: 1, author: 'expo' } }, null, 2) + '\n');
    }
    return config;
  }]);
}
module.exports = withApprovedLaunchSplash;
function withEarlyLaunchBridge(contents, helper) {
  const begin = '// @generated TIH_EARLY_LAUNCH_BEGIN';
  const end = '// @generated TIH_EARLY_LAUNCH_END';
  let source = contents.replace(/\/\/ @generated TIH_EARLY_LAUNCH_BEGIN[\s\S]*?\/\/ @generated TIH_EARLY_LAUNCH_END\s*/g, '').trimEnd();
  for (const name of ['UIKit', 'QuartzCore']) {
    if (!source.includes('import ' + name)) source = source.replace('import React\n', 'import React\nimport ' + name + '\n');
  }
  if (!source.includes('launchWindow.startAfterNativeFrame')) {
    const old = /    let delegate = ReactNativeDelegate\(\)[\s\S]*?    return super\.application/;
    if (!old.test(source)) throw new Error('Expo AppDelegate startup boundary changed; review the early native bridge');
    source = source.replace(old, [
      '#if DEBUG',
      '    window = UIWindow(frame: UIScreen.main.bounds)',
      '    startReactNative(launchOptions: launchOptions)',
      '#else',
      '    let launchWindow = TIHEarlyLaunchWindow(frame: UIScreen.main.bounds)',
      '    window = launchWindow',
      '    launchWindow.startAfterNativeFrame { [weak self] in',
      '      self?.startReactNative(launchOptions: launchOptions)',
      '    }',
      '#endif',
      '',
      '    return super.application',
    ].join('\n'));
    source = source.replace('  // Linking API', [
      '  private func startReactNative(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {',
      '    let delegate = ReactNativeDelegate()',
      '    let factory = ExpoReactNativeFactory(delegate: delegate)',
      '    delegate.dependencyProvider = RCTAppDependencyProvider()',
      '    reactNativeDelegate = delegate',
      '    reactNativeFactory = factory',
      '    factory.startReactNative(withModuleName: "main", in: window, launchOptions: launchOptions)',
      '  }',
      '',
      '  // Linking API',
    ].join('\n'));
  }
  if (!source.includes('TIHEarlyLaunchWindow.current?.expoSplashInstalled')) {
    source = source.replace('  // Extension point for config-plugins', [
      '  // Extension point for config-plugins',
      '  override func customize(_ rootView: UIView) {',
      '    super.customize(rootView)',
      '    TIHEarlyLaunchWindow.current?.expoSplashInstalled(on: rootView)',
      '  }',
    ].join('\n'));
  }
  if (!source.includes('super.customize(rootView)') || !source.includes('private func startReactNative')) throw new Error('Early launch lifecycle integration incomplete');
  return source + '\n\n' + begin + '\n' + helper.trim() + '\n' + end + '\n';
}

module.exports.withEarlyLaunchBridge = withEarlyLaunchBridge;
