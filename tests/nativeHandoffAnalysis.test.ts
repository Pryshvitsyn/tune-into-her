import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

const analyzer = createRequire(import.meta.url)('./native-launch/analyze-handoff.cjs') as {
  buildModel(staticRGB: Buffer, backgroundRGB: Buffer): unknown;
  measureForeground(model: unknown, candidateRGB: Buffer): { presenceRatio: number; backgroundMAE: number; backgroundOnlyGap: boolean; haloDiagnostic: { signatureDetected: boolean; diagnosticOnly: boolean } };
  validateWindow(start: number, end: number): void;
  parseOptions(args: string[]): unknown;
};
const fixture = JSON.parse(readFileSync(new URL('./native-launch/fixtures/physical-handoff-2c77ba0.json', import.meta.url), 'utf8')) as {
  independentBackgroundRGBBase64: string;
  candidates: { frame: number; rgbBase64: string }[];
};
const background = Buffer.from(fixture.independentBackgroundRGBBase64, 'base64');
const samples = fixture.candidates.map(frame => Buffer.from(frame.rgbBase64, 'base64'));
const model = analyzer.buildModel(samples[0]!, background);

describe('actual physical handoff foreground continuity', () => {
  it('retains the correct static logo and detects the actual single background-only frame337', () => {
    expect(analyzer.measureForeground(model, samples[0]!).backgroundOnlyGap).toBe(false);
    const gap = analyzer.measureForeground(model, samples[1]!);
    expect(fixture.candidates[1]!.frame).toBe(337);
    expect(gap.backgroundOnlyGap).toBe(true);
    expect(gap.presenceRatio).toBeLessThan(0.06);
    expect(gap.backgroundMAE).toBeLessThan(1);
  });

  it('recognizes a legitimate nonflat steel background, rather than using a black-frame heuristic', () => {
    expect(Math.max(...background) - Math.min(...background)).toBeGreaterThan(30);
    expect(samples[1]!.reduce((sum, value) => sum + value, 0) / samples[1]!.length).toBeGreaterThan(100);
    expect(analyzer.measureForeground(model, background).backgroundOnlyGap).toBe(true);
    // An unrelated all-black frame is not mislabeled as this calibrated background-only gap.
    expect(analyzer.measureForeground(model, Buffer.alloc(32 * 32 * 3)).backgroundOnlyGap).toBe(false);
  });

  it('keeps halo diagnostic separate from missing foreground, using the actual GPU frame338', () => {
    const staticFrame = analyzer.measureForeground(model, samples[0]!);
    const gap = analyzer.measureForeground(model, samples[1]!);
    const gpu = analyzer.measureForeground(model, samples[2]!);
    expect(gpu.backgroundOnlyGap).toBe(false);
    expect(gpu.haloDiagnostic.signatureDetected).toBe(true);
    expect(gpu.haloDiagnostic.diagnosticOnly).toBe(true);
    expect(staticFrame.haloDiagnostic.signatureDetected).toBe(false);
    expect(gap.haloDiagnostic.signatureDetected).toBe(false);
  });

  it('requires matching foreground/background references and an explicit short manual window', () => {
    expect(() => analyzer.buildModel(background, background)).toThrow('foreground contrast');
    expect(() => analyzer.validateWindow(0, 24)).toThrow('manual window');
    expect(() => analyzer.validateWindow(Number.NaN, 1)).toThrow('manual window');
    expect(() => analyzer.parseOptions(['--video', '/tmp/private.mov'])).toThrow('explicit start/end');
    expect(() => analyzer.validateWindow(6.2, 6.34)).not.toThrow();
  });
});
