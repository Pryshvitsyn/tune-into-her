const fs = require('node:fs/promises');
const path = require('node:path');

const { withDangerousMod, withMod } = require('expo/config-plugins');
const { parseStringPromise } = require('xml2js');

/** Register BEFORE expo-splash-screen, whose storyboard provider must remain last. */
function withApprovedLaunchSplash(config) {
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
      ['LaunchSilverGradient', 'silver-gradient.png', '1x'],
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
