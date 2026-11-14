import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import languages from '../src/config/languages.json';
import { resources } from '../src/i18n/resources';
import { fontFamilyForLanguage, LIBERTINE_FAMILY } from '../src/theme/typography';

const bytes = readFileSync(new URL('../assets/fonts/LinuxLibertineO-Regular.otf', import.meta.url));
const u16 = (offset: number) => bytes.readUInt16BE(offset);
const i16 = (offset: number) => bytes.readInt16BE(offset);
const u32 = (offset: number) => bytes.readUInt32BE(offset);
const tables = new Map<string, number>();
for (let i = 0; i < u16(4); i += 1) {
  const record = 12 + i * 16;
  tables.set(bytes.toString('ascii', record, record + 4), u32(record + 8));
}
function table(tag: string): number {
  const offset = tables.get(tag);
  if (offset === undefined) throw new Error(`Missing font table ${tag}`);
  return offset;
}
const cmap = table('cmap');
const unicodeTables: number[] = [];
for (let i = 0; i < u16(cmap + 2); i += 1) {
  const record = cmap + 4 + i * 8;
  if (u16(record) === 0 || (u16(record) === 3 && [1, 10].includes(u16(record + 2)))) unicodeTables.push(cmap + u32(record + 4));
}
unicodeTables.sort((a, b) => u16(b) - u16(a));

/** Read actual OpenType Unicode cmap format4/12; zero is the missing-glyph index. */
function glyphIndex(codepoint: number): number {
  for (const offset of unicodeTables) {
    const format = u16(offset);
    if (format === 12) {
      for (let i = 0; i < u32(offset + 12); i += 1) {
        const group = offset + 16 + i * 12;
        const start = u32(group), end = u32(group + 4);
        if (start <= codepoint && codepoint <= end) return u32(group + 8) + codepoint - start;
      }
    } else if (format === 4 && codepoint <= 0xFFFF) {
      const count = u16(offset + 6) / 2;
      const ends = offset + 14, starts = ends + count * 2 + 2;
      const deltas = starts + count * 2, ranges = deltas + count * 2;
      for (let i = 0; i < count; i += 1) {
        const start = u16(starts + i * 2), end = u16(ends + i * 2);
        if (codepoint < start || codepoint > end) continue;
        const delta = i16(deltas + i * 2), range = u16(ranges + i * 2);
        if (!range) return (codepoint + delta) & 0xFFFF;
        const glyph = u16(ranges + i * 2 + range + (codepoint - start) * 2);
        if (glyph) return (glyph + delta) & 0xFFFF;
      }
    }
  }
  return 0;
}
function advanceAt(text: string, points: number): number {
  const unitsPerEm = u16(table('head') + 18);
  const metrics = u16(table('hhea') + 34);
  const hmtx = table('hmtx');
  return [...text].reduce((sum, character) => {
    const glyph = glyphIndex(character.codePointAt(0)!);
    if (!glyph) throw new Error('Cannot measure missing glyph');
    return sum + u16(hmtx + Math.min(glyph, metrics - 1) * 4);
  }, 0) / unitsPerEm * points;
}
function textValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.entries(value)
    // Foreign names in the selector deliberately use each OPTION's font/script policy.
    .filter(([key]) => key !== 'language').flatMap(([, child]) => textValues(child));
  return [];
}

describe('bundled original Linux Libertine O', () => {
  it('is the actual unmodified original OTF with its license files, not a renamed fallback', () => {
    expect(bytes.toString('ascii', 0, 4)).toBe('OTTO');
    expect(createHash('sha256').update(bytes).digest('hex')).toBe('6332761e4fc08e30bce6f47e4a08e7d5332abe000ab6ca06c8e86bd88f456114');
    expect(existsSync(new URL('../assets/fonts/LICENCE.txt', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../assets/fonts/OFL.txt', import.meta.url))).toBe(true);
    expect(unicodeTables.length).toBeGreaterThan(0);
  });
  it.each(SUPPORTED_LANGUAGES)('covers UI text or has explicit script fallback for %s', language => {
    if (language === 'hi' || language === 'zh-Hans') {
      expect(fontFamilyForLanguage(language)).toBeUndefined();
      expect([...languages.labels[language]].some(character => !glyphIndex(character.codePointAt(0)!))).toBe(true);
      return;
    }
    expect(fontFamilyForLanguage(language)).toBe(LIBERTINE_FAMILY);
    const characters = new Set(textValues(resources[language].translation).join(''));
    const missing = [...characters].filter(character => !/\s/u.test(character) && !glyphIndex(character.codePointAt(0)!));
    expect(missing, `${language}: missing actual font glyphs`).toEqual([]);
    expect([...languages.labels[language]].every(character => /\s/u.test(character) || glyphIndex(character.codePointAt(0)!))).toBe(true);
  });
  it('fits the complete English second line at32pt on a standard375pt phone with24pt margins', () => {
    const width = advanceAt('never a prediction', 32);
    expect(width).toBeGreaterThan(200);
    expect(width).toBeLessThanOrEqual(375 - 24 * 2);
    expect(Math.round(width * 100) / 100).toBe(238.02);
  });
});
