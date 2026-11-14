import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import { BRAND_BODY, BRAND_SOURCE_SHA256, BRAND_VIEWBOX, OFFICIAL_APP_MARK_PATH } from '../src/intro/brand.generated';
import { FIRST_FRAME_LOGO_WIDTH_FRACTION, FIRST_FRAME_LOGO_WIDTH_CAP, FIRST_FRAME_LOGO_CENTER_X, FIRST_FRAME_LOGO_CENTER_Y } from '../src/intro/brandBackground.generated';
import { BRAND_TEXTURE_URI, PADDED_LOGO_HEIGHT_SCALE, PADDED_LOGO_WIDTH_SCALE } from '../src/intro/brandTexture.generated';
import { makeSceneFragment } from '../src/intro/sphereHtml';
import { INTRO_MS, sceneAt, type Size } from '../src/intro/timeline';

const { PNG } = createRequire(import.meta.url)('pngjs') as {
  PNG: { sync: { read(value: Buffer): { width: number; height: number; data: Buffer } } };
};
type Bounds = { left: number; top: number; right: number; bottom: number };
const numbers = (value: string) => value.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)!.map(Number);
const [, , designWidth, designHeight] = numbers(BRAND_VIEWBOX) as [number, number, number, number];
const texture = PNG.sync.read(Buffer.from(BRAND_TEXTURE_URI.split(',')[1]!, 'base64'));
const tau = Math.PI * 2;
const normalize = (angle: number) => (angle % tau + tau) % tau;

/** Exact circular SVG endpoint-to-center conversion, including cardinal extrema.
 * Reject a changed path grammar instead of silently accepting untested geometry. */
function strokeBounds(path: string, strokeWidth: number): Bounds {
  let point: [number, number] = [0, 0];
  const points: [number, number][] = [];
  for (const match of path.matchAll(/([MA])([^MA]+)/g)) {
    const values = numbers(match[2]!);
    if (match[1] === 'M') {
      expect(values).toHaveLength(2);
      point = values as [number, number];
      points.push(point);
      continue;
    }
    expect(values).toHaveLength(7);
    const [rx, ry, rotation, large, sweep, x, y] = values as [number, number, number, number, number, number, number];
    expect(rx).toBe(ry);
    expect(rotation).toBe(0);
    const dx = (point[0] - x) / 2, dy = (point[1] - y) / 2;
    const factor = Math.sqrt(Math.max(0, (rx * rx - dx * dx - dy * dy) / (dx * dx + dy * dy))) * (large === sweep ? -1 : 1);
    const cx = (point[0] + x) / 2 + factor * dy;
    const cy = (point[1] + y) / 2 - factor * dx;
    const start = Math.atan2(point[1] - cy, point[0] - cx);
    const end = Math.atan2(y - cy, x - cx);
    const extent = sweep ? normalize(end - start) : normalize(start - end);
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const distance = sweep ? normalize(angle - start) : normalize(start - angle);
      if (distance <= extent + 1e-10) points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
    }
    point = [x, y];
    points.push(point);
  }
  return {
    left: Math.min(...points.map(([x]) => x)) - strokeWidth / 2,
    top: Math.min(...points.map(([, y]) => y)) - strokeWidth / 2,
    right: Math.max(...points.map(([x]) => x)) + strokeWidth / 2,
    bottom: Math.max(...points.map(([, y]) => y)) + strokeWidth / 2,
  };
}

function alphaBounds(): Bounds {
  const bounds = { left: texture.width, top: texture.height, right: -1, bottom: -1 };
  for (let y = 0; y < texture.height; y += 1) {
    for (let x = 0; x < texture.width; x += 1) {
      if (texture.data[(y * texture.width + x) * 4 + 3] === 0) continue;
      bounds.left = Math.min(bounds.left, x);
      bounds.right = Math.max(bounds.right, x + 1);
      bounds.top = Math.min(bounds.top, y);
      bounds.bottom = Math.max(bounds.bottom, y + 1);
    }
  }
  return bounds;
}
const ink = alphaBounds();

// Read the actual GLSL mapping; tests must fail if shader sampling and asset padding diverge.
const shader = makeSceneFragment();
const mapping = shader.match(/uv \* vec2\(([\d.]+), ([\d.]+)\) \+ vec2\(([\d.]+)\)\) \/ vec2\(([\d.]+), ([\d.]+)\)/)!;
const [mapWidth, mapHeight, padding, paddedWidth, paddedHeight] = mapping.slice(1).map(Number) as [number, number, number, number, number];
const distort = Number(shader.match(/u_depth \* ([\d.]+) \* vec2/)![1]);
const spread = Number(shader.match(/float spread = u_depth \* ([\d.]+)/)![1]);
const scale = texture.width / paddedWidth;
const designInk = {
  left: ink.left / scale - padding, top: ink.top / scale - padding,
  right: ink.right / scale - padding, bottom: ink.bottom / scale - padding,
};

describe('approved brand geometry has no unintended clipping', () => {
  it('derives vector, texture and shared native emblem from one reviewed source', () => {
    const source = readFileSync(new URL('../assets/brand/official-mark.svg', import.meta.url));
    expect(createHash('sha256').update(source).digest('hex')).toBe(BRAND_SOURCE_SHA256);
    expect(execFileSync(process.execPath, ['scripts/generate-intro-brand.cjs', '--check'], { cwd: new URL('..', import.meta.url) }).toString()).toContain('integrity match');
  });

  it('retains the exact open-arc path and includes every rounded stroke inside both vector viewBoxes', () => {
    const component = readFileSync(new URL('../src/components/BrandMark.tsx', import.meta.url), 'utf8');
    expect(component).toContain('d={OFFICIAL_APP_MARK_PATH}');
    expect(BRAND_BODY).toContain(`d="${OFFICIAL_APP_MARK_PATH}"`);
    const nativeBox = numbers(component.match(/viewBox="([^"]+)"/)![1]!) as [number, number, number, number];
    const raw = strokeBounds(OFFICIAL_APP_MARK_PATH, 1.5);
    expect(raw.left).toBeGreaterThan(nativeBox[0]);
    expect(raw.top).toBeGreaterThan(nativeBox[1]);
    expect(raw.right).toBeLessThan(nativeBox[0] + nativeBox[2]);
    expect(raw.bottom).toBeLessThan(nativeBox[1] + nativeBox[3]);
    const transform = BRAND_BODY.match(/transform="translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)"/)!.slice(1).map(Number);
    const [x, y, zoom] = transform as [number, number, number];
    expect(x + raw.left * zoom).toBeGreaterThan(0);
    expect(y + raw.top * zoom).toBeGreaterThan(0);
    expect(x + raw.right * zoom).toBeLessThan(designWidth);
    expect(y + raw.bottom * zoom).toBeLessThan(designHeight);
    // Two open circular trajectories replace the detached, off-center upper fragment.
    expect(OFFICIAL_APP_MARK_PATH.match(/M/g)).toHaveLength(2);
    expect(OFFICIAL_APP_MARK_PATH.match(/A/g)).toHaveLength(2);
    expect(OFFICIAL_APP_MARK_PATH).not.toMatch(/[Zz]/);
    expect(OFFICIAL_APP_MARK_PATH).not.toContain('M34 32');
    expect(OFFICIAL_APP_MARK_PATH).toMatch(/^M22 40 A19 19 0 1 1 /);
    expect(OFFICIAL_APP_MARK_PATH).toContain('M34 37 A15 15 0 1 1 45 34');
    // Clearance follows the exact wordmark contours, never an empty horizontal band.
    expect(BRAND_BODY).not.toContain('clipPath');
    expect(BRAND_BODY).not.toContain('arc-cut');
    expect(BRAND_BODY).toContain('maskUnits="userSpaceOnUse"');
    expect(BRAND_BODY).toContain('<use href="#wordmark" fill="black" stroke="black"');
    // Definitions may precede rings, but the actual polished glyph use paints last.
    expect(BRAND_BODY.lastIndexOf('<use href="#wordmark"')).toBeGreaterThan(BRAND_BODY.lastIndexOf('<use href="#rings"'));
  });

  it('keeps a fully transparent rim wider than all distortion and filter samples on every edge', () => {
    expect([mapWidth, mapHeight]).toEqual([designWidth, designHeight]);
    expect(paddedWidth / designWidth).toBe(PADDED_LOGO_WIDTH_SCALE);
    expect(paddedHeight / designWidth).toBe(PADDED_LOGO_HEIGHT_SCALE);
    expect(texture.height / paddedHeight).toBe(scale);
    const filterReachX = (distort + spread) * designWidth * scale + 1;
    const filterReachY = (distort + spread) * designHeight * scale + 1;
    expect(ink.left).toBeGreaterThan(filterReachX);
    expect(texture.width - ink.right).toBeGreaterThan(filterReachX);
    expect(ink.top).toBeGreaterThan(filterReachY);
    expect(texture.height - ink.bottom).toBeGreaterThan(filterReachY);
    expect(padding).toBeGreaterThan((distort + spread) * Math.max(designWidth, designHeight));
  });

  it('fits the complete distorted mark throughout 0–9 seconds on compact, tall and wide phone screens', () => {
    const phones: Size[] = [
      { width: 320, height: 568 }, { width: 375, height: 667 }, { width: 393, height: 852 },
      { width: 430, height: 932 }, { width: 360, height: 640 }, { width: 360, height: 800 },
      { width: 412, height: 915 }, { width: 667, height: 375 }, { width: 932, height: 430 },
    ];
    let minimumMargin = Infinity;
    for (const view of phones) {
      for (const target of [
        { x: view.width / 2, y: view.height / 2, radius: Math.min(view.width * .38, view.height * .25, 180) },
        { x: view.width / 2, y: view.height * .32, radius: Math.min(view.width * .38, view.height * .25, 180) },
      ]) {
        for (let ms = 0; ms <= INTRO_MS; ms += 10) {
          const scene = sceneAt(ms, view, target);
          if (scene.logoOpacity <= 0) continue;
          const reach = scene.depth * (distort + spread);
          const originalWidth = Math.min(view.width * .76, 420);
          const actualWidth = Math.min(view.width * FIRST_FRAME_LOGO_WIDTH_FRACTION, FIRST_FRAME_LOGO_WIDTH_CAP) * scene.logoWidth / originalWidth;
          const progress = Math.max(0, Math.min(1, scene.camera / 3.55));
          const logoX = view.width * FIRST_FRAME_LOGO_CENTER_X + (scene.x - view.width * FIRST_FRAME_LOGO_CENTER_X) * progress;
          const logoY = view.height * FIRST_FRAME_LOGO_CENTER_Y + (scene.y - view.height * FIRST_FRAME_LOGO_CENTER_Y) * progress;
          const left = logoX + (designInk.left / designWidth - .5 - reach) * actualWidth;
          const right = logoX + (designInk.right / designWidth - .5 + reach) * actualWidth;
          const top = logoY + (designInk.top / designHeight - .5 - reach) * actualWidth * designHeight / designWidth;
          const bottom = logoY + (designInk.bottom / designHeight - .5 + reach) * actualWidth * designHeight / designWidth;
          minimumMargin = Math.min(minimumMargin, left, top, view.width - right, view.height - bottom);
        }
      }
    }
    // Includes one CSS pixel for framebuffer rounding/linear filtering at all DPRs.
    expect(minimumMargin).toBeGreaterThan(1);
  });
});
