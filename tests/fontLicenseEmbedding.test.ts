import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import bundledNotice from '../assets/fonts/license.generated.json';

describe('viewable bundled font license', () => {
  it('transports both canonical notices verbatim into the reachable Terms appendix', () => {
    expect(bundledNotice.ofl).toBe(readFileSync(new URL('../assets/fonts/OFL.txt', import.meta.url), 'utf8'));
    expect(bundledNotice.originalDistributionNotice).toBe(readFileSync(new URL('../assets/fonts/LICENCE.txt', import.meta.url), 'utf8'));
    const terms = readFileSync(new URL('../app/terms.tsx', import.meta.url), 'utf8');
    expect(terms).toContain('import fontLicense from "../assets/fonts/license.generated.json"');
    for (const notice of ['ofl', 'originalDistributionNotice']) {
      const paragraph = terms.match(new RegExp(`<Text([^>]+)>\\{fontLicense\\.${notice}\\}</Text>`));
      expect(paragraph, `Reachable verbatim ${notice} paragraph`).not.toBeNull();
      expect(paragraph![1]).toContain('selectable');
      expect(paragraph![1]).toContain('language="en"');
      expect(paragraph![1]).toContain('accessibilityLanguage="en"');
      expect(paragraph![1]).toContain('style={styles.licenseText}');
    }
    expect(terms).toContain("t('legal.fontsTitle')");
    expect(terms).toContain("t('legal.originalEnglish')");
  });
});
