import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import config from '../app.config';

const { PNG } = createRequire(import.meta.url)('pngjs') as {
  PNG: { sync: { read(value: Buffer): { width: number; height: number; data: Buffer } } };
};
const read = (file: string) => readFileSync(new URL('../' + file, import.meta.url));
const image = (file: string) => PNG.sync.read(read(file));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(read('assets/icons/manifest.generated.json').toString());
const reference = image('assets/brand/reference/founder-approved-premium-v5-20261114.png');
const master = image('assets/icon.png');
const foreground = image('assets/adaptive-icon.png');

describe('official photo icon pipeline', () => {
  it('uses the exact approved photograph and a literal centred square without changing launch art', () => {
    expect(sha(read(manifest.reference))).toBe('dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58');
    expect(manifest.cropSourcePixels).toEqual({ left: 35, top: 450, width: 780, height: 780 });
    expect(read('assets/launch/approved-opening.png').equals(read(manifest.reference))).toBe(true);
    expect(read('ios/TuneIntoHer/Images.xcassets/LaunchApprovedOpening.imageset/approved-opening.png').equals(read(manifest.reference))).toBe(true);
    expect(execFileSync(process.execPath, ['scripts/generate-official-icons.cjs', '--check'], { cwd: new URL('..', import.meta.url) }).toString()).toContain('protected assets match');
  });

  it('matches the literal photograph geometry using an independent uniform interpolation probe', () => {
    // This implementation does not import Sharp or the generator. Compare a32x32
    // grid against the original photograph with one uniform780/1024 source mapping.
    // libvips rounds/quantizes its filter near high-contrast metallic glyph edges;
    // broad geometry/colour error is bounded independently of encoded PNG hashes.
    const lanczos = (x: number) => Math.abs(x) < 1e-12 ? 1 : Math.abs(x) >= 3 ? 0 :
      3 * Math.sin(Math.PI * x) * Math.sin(Math.PI * x / 3) / (Math.PI * Math.PI * x * x);
    const errors: number[] = [];
    for (let y = 16; y < 1024; y += 32) for (let x = 16; x < 1024; x += 32) {
      const sx = 35 + (x + .5) * 780 / 1024 - .5;
      const sy = 450 + (y + .5) * 780 / 1024 - .5;
      for (let channel = 0; channel < 3; channel += 1) {
        let weighted = 0, weight = 0;
        for (let yy = Math.ceil(sy - 3); yy <= Math.floor(sy + 3); yy += 1) for (let xx = Math.ceil(sx - 3); xx <= Math.floor(sx + 3); xx += 1) {
          const w = lanczos(sx - xx) * lanczos(sy - yy);
          weighted += reference.data[(yy * reference.width + xx) * 4 + channel]! * w;
          weight += w;
        }
        const expected = Math.max(0, Math.min(255, Math.round(weighted / weight)));
        errors.push(Math.abs(expected - master.data[(y * 1024 + x) * 4 + channel]!));
      }
    }
    errors.sort((a, b) => a - b);
    expect(errors.reduce((a, b) => a + b, 0) / errors.length).toBeLessThan(1.5);
    expect(errors[Math.floor(errors.length * .95)]).toBeLessThanOrEqual(4);
    expect(errors[Math.floor(errors.length * .99)]).toBeLessThanOrEqual(22);
  });

  it('ships square opaque store/master assets and the actual native iOS icon copy', () => {
    for (const [file, side] of [['assets/icon.png', 1024], ['assets/icons/play-store-512.png', 512], ['assets/icons/adaptive-background.png', 1024]] as const) {
      const png = image(file);
      expect([png.width, png.height]).toEqual([side, side]);
      let transparent = 0;
      for (let i = 3; i < png.data.length; i += 4) if (png.data[i] !== 255) transparent += 1;
      expect(transparent).toBe(0);
      expect([...png.data.subarray(3, 4)]).toEqual([255]); // No pre-rounded production corner.
    }
    const iosMaster = read('assets/icon.png');
    expect([iosMaster[24], iosMaster[25]]).toEqual([8, 2]); // iOS8-bit RGB: no alpha channel at all.
    const play = read('assets/icons/play-store-512.png');
    expect(play.byteLength).toBeLessThanOrEqual(1024 * 1024);
    expect([play[24], play[25]]).toEqual([8, 6]); // 8-bit RGBA = Google Play32-bit PNG; alpha remains fully opaque.
    expect(read('ios/TuneIntoHer/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png').equals(read('assets/icon.png'))).toBe(true);
    expect(JSON.parse(read('ios/TuneIntoHer/Images.xcassets/AppIcon.appiconset/Contents.json').toString()).images).toEqual([
      { filename: 'App-Icon-1024x1024@1x.png', idiom: 'universal', platform: 'ios', size: '1024x1024' },
    ]);
    expect(config.icon).toBe('./assets/icon.png');
    expect(config.ios?.icon).toBeUndefined(); // Common master is the actual iOS input.
    expect(config.android?.adaptiveIcon?.foregroundImage).toBe('./assets/adaptive-icon.png');
    expect(config.android?.adaptiveIcon?.backgroundImage).toBe('./assets/icons/adaptive-background.png');
  });

  it('keeps complete wordmark/ring landmarks opaque inside the real Android safe circle', () => {
    expect([foreground.width, foreground.height]).toEqual([1024, 1024]);
    const a = manifest.adaptive;
    expect([a.photoSide, a.inset, a.layerDP, a.maskDP, a.safeCircleDP, a.outerSteelFeatherPixels]).toEqual([672, 176, 108, 72, 66, 24]);
    const safeRadius = 1024 * 66 / 108 / 2;
    for (const [sx, sy] of Object.values(a.conservativeSourceLandmarks).flat() as number[][]) {
      const x = 176 + (sx! - 35) * 672 / 780, y = 176 + (sy! - 450) * 672 / 780;
      expect(Math.hypot(x - 512, y - 512)).toBeLessThan(safeRadius);
      expect(foreground.data[(Math.round(y) * 1024 + Math.round(x)) * 4 + 3]).toBe(255);
    }
    expect(foreground.data[3]).toBe(0);
    expect(foreground.data[(512 * 1024 + 176) * 4 + 3]).toBe(0);
    expect(foreground.data[(512 * 1024 + 200) * 4 + 3]).toBe(255);
    expect(foreground.data[(512 * 1024 + 188) * 4 + 3]).toBeGreaterThan(0);
    expect(foreground.data[(512 * 1024 + 188) * 4 + 3]).toBeLessThan(255);
  });

  it('prevents the historical sphere generator from overwriting official icons', () => {
    const legacy = read('scripts/create-brand-assets.cjs').toString();
    expect(legacy).toContain("path.join(__dirname,'generate-official-icons.cjs')");
    expect(legacy).not.toContain("toFile('assets/icon.png')");
    expect(legacy).not.toContain("toFile('assets/adaptive-icon.png')");
  });

  it('provides actual-size previews separately from square production sources', () => {
    for (const [name, side] of [['iphone-home-60pt@2x', 120], ['iphone-home-60pt@3x', 180], ['iphone-settings-29pt@2x', 58], ['iphone-settings-29pt@3x', 87]] as const) {
      const png = image('assets/icons/previews/' + name + '.png');
      expect([png.width, png.height]).toEqual([side, side]);
      expect(png.data[3]).toBe(0); // Simulated mask is limited to previews.
      expect(png.data[(Math.floor(side / 2) * side + Math.floor(side / 2)) * 4 + 3]).toBe(255);
    }
    const round = image('assets/icons/previews/android-round-system-mask.png');
    expect(round.data[3]).toBe(0);
    expect(round.data[(512 * 1024 + 512) * 4 + 3]).toBe(255);
    expect(config.android?.adaptiveIcon?.foregroundImage).not.toContain('previews');
    expect(config.icon).not.toContain('previews');
  });
});
