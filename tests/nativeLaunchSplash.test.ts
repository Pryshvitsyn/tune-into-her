import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import config from '../app.config';
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

  it('keeps every alpha pixel and bounds of the approved outlined logo', () => {
    const originalBytes = Buffer.from(BRAND_TEXTURE_URI.split(',')[1]!, 'base64');
    expect(createHash('sha256').update(originalBytes).digest('hex')).toBe(BRAND_TEXTURE_SHA256);
    const original = PNG.sync.read(originalBytes);
    const native = PNG.sync.read(read('../assets/launch/official-launch-mark.png'));
    expect([native.width, native.height]).toEqual([original.width, original.height]);
    let alphaDifferences = 0;
    let inkDifferences = 0;
    for (let i = 0; i < native.data.length; i += 4) {
      if (native.data[i + 3] !== original.data[i + 3]) alphaDifferences += 1;
      if (native.data[i] !== 0x29 || native.data[i + 1] !== 0x44 || native.data[i + 2] !== 0x58) inkDifferences += 1;
    }
    expect(alphaDifferences).toBe(0);
    expect(inkDifferences).toBe(0);
    expect(read('../ios/TuneIntoHer/Images.xcassets/LaunchLogo.imageset/official-launch-mark.png')).toEqual(read('../assets/launch/official-launch-mark.png'));
  });

  it('bridges with the same symmetric approved silver colors', () => {
    const image = PNG.sync.read(read('../assets/launch/silver-gradient.png'));
    expect([image.width, image.height]).toEqual([1024, 1]);
    expect([...image.data.subarray(0, 4)]).toEqual([0xDC, 0xE3, 0xE9, 255]);
    expect([...image.data.subarray(512 * 4, 512 * 4 + 4)]).toEqual([0xF9, 0xFB, 0xFC, 255]);
    for (let x = 0; x < image.width; x += 1) {
      expect(image.data.subarray(x * 4, x * 4 + 4)).toEqual(image.data.subarray((1023 - x) * 4, (1024 - x) * 4));
    }
  });

  it('preserves centered responsive iOS layout across prebuilds', async () => {
    const storyboard = read('../assets/launch/SplashScreen.storyboard');
    expect(await parseStringPromise(read('../ios/TuneIntoHer/SplashScreen.storyboard').toString())).toEqual(await parseStringPromise(storyboard.toString()));
    const xml = storyboard.toString();
    expect(xml).toContain('multiplier="0.95"');
    expect(xml).toContain('constant="525"');
    expect(xml).toContain('multiplier="10:7"');
    expect(xml).toContain('image="LaunchSilverGradient"');
    const config = read('../app.config.ts').toString();
    expect(config.indexOf("'./plugins/with-approved-launch-splash.cjs'")).toBeLessThan(config.indexOf("'expo-splash-screen'"));
  });
});
