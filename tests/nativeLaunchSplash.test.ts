import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import config from '../app.config';
import { INTRO_BACKGROUND_URI, INTRO_BACKGROUND_COLOR } from '../src/intro/brandBackground.generated';
import { BRAND_TEXTURE_SHA256, BRAND_TEXTURE_URI } from '../src/intro/brandTexture.generated';

const { PNG } = createRequire(import.meta.url)('pngjs') as {
  PNG: { sync: { read(value: Buffer): { width: number; height: number; data: Buffer } } };
};
const { default: { parse: parsePlist } } = createRequire(import.meta.url)('@expo/plist') as { default: { parse(value: string): Record<string, unknown> } };
const { parseStringPromise } = createRequire(import.meta.url)('xml2js') as { parseStringPromise(value: string): Promise<unknown> };
const read = (file: string) => readFileSync(new URL(file, import.meta.url));

describe('approved native launch first frame', () => {
  it('preserves native-stack status-bar control when regenerating iOS configuration', () => {
    const nativeInfo = parsePlist(read('../ios/TuneIntoHer/Info.plist').toString());
    expect(nativeInfo.UIViewControllerBasedStatusBarAppearance).toBe(true);
    expect(config.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance).toBe(nativeInfo.UIViewControllerBasedStatusBarAppearance);
  });

  it('protects every old animation foreground RGBA pixel while replacing only the opening', () => {
    const originalBytes = Buffer.from(BRAND_TEXTURE_URI.split(',')[1]!, 'base64');
    expect(createHash('sha256').update(originalBytes).digest('hex')).toBe(BRAND_TEXTURE_SHA256);
    const original = PNG.sync.read(originalBytes);
    const native = PNG.sync.read(read('../assets/launch/official-launch-mark.png'));
    expect([native.width, native.height]).toEqual([original.width, original.height]);
    let alphaDifferences = 0;
    let inkDifferences = 0;
    const materialColors = new Set<string>();
    for (let i = 0; i < native.data.length; i += 4) {
      if (native.data[i + 3] !== original.data[i + 3]) alphaDifferences += 1;
      if (native.data[i] !== original.data[i] || native.data[i + 1] !== original.data[i + 1] || native.data[i + 2] !== original.data[i + 2]) inkDifferences += 1;
      if (native.data[i + 3] === 255) materialColors.add(native.data.subarray(i, i + 3).toString('hex'));
    }
    expect(alphaDifferences).toBe(0);
    expect(inkDifferences).toBe(0);
    expect(materialColors.size).toBeGreaterThan(100);
    expect(read('../ios/TuneIntoHer/Images.xcassets/LaunchLogo.imageset/official-launch-mark.png')).toEqual(read('../assets/launch/official-launch-mark.png'));
  });

  it('retains the original destination silver colors', () => {
    const image = PNG.sync.read(read('../assets/launch/silver-gradient.png'));
    expect([image.width, image.height]).toEqual([1024, 1]);
    expect([...image.data.subarray(0, 4)]).toEqual([0xDC, 0xE3, 0xE9, 255]);
    expect([...image.data.subarray(512 * 4, 512 * 4 + 4)]).toEqual([0xF9, 0xFB, 0xFC, 255]);
    for (let x = 0; x < image.width; x += 1) {
      expect(image.data.subarray(x * 4, x * 4 + 4)).toEqual(image.data.subarray((1023 - x) * 4, (1024 - x) * 4));
    }
  });

  it('retains the existing opaque steel atmosphere for the animation', () => {
    const bytes = Buffer.from(INTRO_BACKGROUND_URI.split(',')[1]!, 'base64');
    expect(read('../assets/launch/steel-background.png').equals(bytes)).toBe(true);
    expect(read('../ios/TuneIntoHer/Images.xcassets/LaunchSteelBackground.imageset/steel-background.png').equals(bytes)).toBe(true);
    const image = PNG.sync.read(bytes);
    let translucent = 0;
    for (let i = 3; i < image.data.length; i += 4) if (image.data[i] !== 255) translucent += 1;
    expect(translucent).toBe(0);
    const splash = config.plugins!.find(value => Array.isArray(value) && value[0] === 'expo-splash-screen') as [string, { backgroundColor: string; dark: { backgroundColor: string } }];
    expect(splash[1].backgroundColor).toBe(INTRO_BACKGROUND_COLOR);
    expect(splash[1].dark.backgroundColor).toBe(INTRO_BACKGROUND_COLOR);
  });

  it('copies the immutable approved photograph verbatim into native opening resources', () => {
    const approved = read('../assets/brand/reference/founder-approved-premium-v5-20261114.png');
    expect(createHash('sha256').update(approved).digest('hex')).toBe('dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58');
    expect(read('../assets/launch/approved-opening.png').equals(approved)).toBe(true);
    expect(read('../ios/TuneIntoHer/Images.xcassets/LaunchApprovedOpening.imageset/approved-opening.png').equals(approved)).toBe(true);
    const image = PNG.sync.read(approved);
    expect([image.width, image.height]).toEqual([851, 1847]);
    let translucent = 0;
    for (let i = 3; i < image.data.length; i += 4) if (image.data[i] !== 255) translucent += 1;
    expect(translucent).toBe(0);
    expect(JSON.parse(read('../ios/TuneIntoHer/Images.xcassets/LaunchApprovedOpening.imageset/Contents.json').toString()).images).toEqual([
      { idiom: 'universal', filename: 'approved-opening.png', scale: '1x' },
    ]);
    const splash = config.plugins!.find(value => Array.isArray(value) && value[0] === 'expo-splash-screen') as [string, { image: string; dark: { image: string } }];
    expect(splash[1].image).toBe('./assets/launch/approved-opening.png');
    expect(splash[1].dark.image).toBe(splash[1].image);
  });

  it('uses one full-bounds aspect-fill photograph with no reconstructed logo overlay across prebuilds', async () => {
    const storyboard = read('../assets/launch/SplashScreen.storyboard');
    expect(await parseStringPromise(read('../ios/TuneIntoHer/SplashScreen.storyboard').toString())).toEqual(await parseStringPromise(storyboard.toString()));
    const xml = storyboard.toString();
    expect((xml.match(/<imageView\b/g) ?? []).length).toBe(1);
    expect(xml).toContain('contentMode="scaleAspectFill" image="LaunchApprovedOpening"');
    expect(xml).toContain('id="EXPO-SplashScreen"');
    for (const edge of ['leading', 'trailing', 'top', 'bottom']) {
      expect(xml).toContain(`firstItem="EXPO-SplashScreen" firstAttribute="${edge}" secondItem="EXPO-ContainerView" secondAttribute="${edge}"`);
    }
    expect(xml).not.toContain('image="LaunchLogo"');
    expect(xml).not.toContain('image="LaunchSteelBackground"');
    expect(xml).not.toContain('TIH-LogoResponsiveWidth');
    expect(xml).not.toContain('TIH-LogoAspect');
    const config = read('../app.config.ts').toString();
    expect(config.indexOf("'./plugins/with-approved-launch-splash.cjs'")).toBeLessThan(config.indexOf("'expo-splash-screen'"));
  });
});
