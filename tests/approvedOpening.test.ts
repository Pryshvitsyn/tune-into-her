import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { approvedOpeningOpacity } from '../src/intro/introPresentation';
import { INTRO_MS, sceneAt } from '../src/intro/timeline';

const reference = readFileSync(new URL('../assets/brand/reference/founder-approved-premium-v5-20261114.png', import.meta.url));

describe('exact approved photographic opening', () => {
  it('uses the immutable original photograph in the shared RN opening', () => {
    expect(createHash('sha256').update(reference).digest('hex'))
      .toBe('dfce7d014d6107bdad02a54886dba3bbb8e5f216065774dc7b7c34e7e3da1c58');
    const component = readFileSync(new URL('../src/intro/ApprovedOpening.tsx', import.meta.url), 'utf8');
    expect(component).toContain("require('../../assets/brand/reference/founder-approved-premium-v5-20261114.png')");
    expect(component).toContain('resizeMode="cover"');
    expect(component).not.toContain('BRAND_TEXTURE_URI');
  });

  it('overrides static Image intrinsic point dimensions in the actual rendered component', () => {
    // RN Image.ios.js/Image.android.js prepend source.width/height before props.style.
    // Absolute edges alone therefore reproduce the observed oversized 851x1847pt crop.
    const source = readFileSync(new URL('../src/intro/ApprovedOpening.tsx', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    const require = createRequire(import.meta.url);
    const exports: Record<string, unknown> = {};
    const metadata = { width: reference.readUInt32BE(16), height: reference.readUInt32BE(20), scale: 1 };
    vm.runInNewContext(compiled, { exports, require(name: string) {
      if (name === 'react-native') return { Image: 'Image', View: 'View', StyleSheet: {
        absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
      } };
      if (name === './brandBackground.generated') return { INTRO_BACKGROUND_COLOR: '#7E8BA1' };
      if (name.endsWith('.png')) return metadata;
      if (name === 'react/jsx-runtime') return require(name);
      throw new Error('Unexpected opening dependency: ' + name);
    } });
    const render = exports.ApprovedOpening as (props: object) => { props: {
      children: { props: { source: typeof metadata; style: Record<string, unknown>[] } };
    } };
    const image = render({}).props.children.props;
    expect(image.source).toEqual(metadata);
    const nativeStyle = Object.assign({ width: metadata.width, height: metadata.height }, ...image.style);
    expect(nativeStyle.width).toBe('100%');
    expect(nativeStyle.height).toBe('100%');
  });

  it('preserves the central emblem under centered cover framing on supported portrait phones', () => {
    // Conservative bounds of the original central artwork, including polished endpoints.
    const emblem = { left: 74, top: 607, right: 788, bottom: 1090 };
    for (const [width, height] of [[320,568],[360,640],[360,800],[375,667],[375,812],[393,852],[412,915],[430,932]] as const) {
      const scale = Math.max(width / 851, height / 1847);
      const dx = (width - 851 * scale) / 2, dy = (height - 1847 * scale) / 2;
      expect(emblem.left * scale + dx).toBeGreaterThanOrEqual(0);
      expect(emblem.right * scale + dx).toBeLessThanOrEqual(width);
      expect(emblem.top * scale + dy).toBeGreaterThanOrEqual(0);
      expect(emblem.bottom * scale + dy).toBeLessThanOrEqual(height);
    }
  });

  it('yields within the existing camera-entry interval, with no new post-animation hold', () => {
    expect(approvedOpeningOpacity(0)).toBe(1);
    expect(approvedOpeningOpacity(650)).toBe(1);
    expect(approvedOpeningOpacity(1000)).toBe(.5);
    expect(approvedOpeningOpacity(1350)).toBe(0);
    expect(approvedOpeningOpacity(INTRO_MS)).toBe(0);
    let previous = 1;
    for (let ms = 0; ms <= INTRO_MS; ms += 10) {
      const opacity = approvedOpeningOpacity(ms);
      expect(opacity).toBeGreaterThanOrEqual(0);
      expect(opacity).toBeLessThanOrEqual(previous);
      previous = opacity;
    }
  });

  it('leaves a fully uncovered visible interval for every original depth ribbon', () => {
    const visible = new Set<number>();
    for (let ms = 1350; ms <= 4300; ms += 10) {
      const scene = sceneAt(ms, { width: 393, height: 852 }, { x: 196.5, y: 426, radius: 149 });
      if (scene.layers <= .1 || approvedOpeningOpacity(ms) !== 0) continue;
      for (let layer = 0; layer < 6; layer++) {
        const z = scene.camera + .62 - layer * .68;
        if (z > .4 && z < 1.35) visible.add(layer);
      }
    }
    expect([...visible].sort()).toEqual([0,1,2,3,4,5]);
  });
});
