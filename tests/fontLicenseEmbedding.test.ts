import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import bundledNotice from '../assets/fonts/license.generated.json';

describe('viewable bundled font license', () => {
  it('transports both canonical notices verbatim into the reachable Terms appendix', () => {
    expect(bundledNotice.ofl).toBe(readFileSync(new URL('../assets/fonts/OFL.txt', import.meta.url), 'utf8'));
    expect(bundledNotice.originalDistributionNotice).toBe(readFileSync(new URL('../assets/fonts/LICENCE.txt', import.meta.url), 'utf8'));
    const terms = readFileSync(new URL('../app/terms.tsx', import.meta.url), 'utf8');
    expect(terms).toContain('import fontLicense from "../assets/fonts/license.generated.json"');
    expect(terms).toContain('<Text selectable style={styles.licenseText}>{fontLicense.ofl}</Text>');
    expect(terms).toContain('<Text selectable style={styles.licenseText}>{fontLicense.originalDistributionNotice}</Text>');
  });
});
