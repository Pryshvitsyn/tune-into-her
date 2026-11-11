import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function sha256(path: URL) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('approved Sphere V4 integration', () => {
  const renderer = new URL('../TuneIntoHerSphereV4.tsx', import.meta.url);
  const cleanTexture = new URL('../assets/tune_into_her_sphere_source_clean.png', import.meta.url);
  const phaseZeroPoster = new URL('../assets/tune_into_her_sphere_phase0_poster.png', import.meta.url);

  it('preserves the approved renderer and source assets byte-for-byte', () => {
    expect(sha256(renderer)).toBe('7c46b5ab8fbd587fb70b1e557365f6d505dc2a1a82f8ed5a536220a2dea6ef39');
    expect(sha256(cleanTexture)).toBe('50e988dde8cdd04b945883a1404fd95881b55ad86087274a5a5b594063f0509c');
    expect(sha256(phaseZeroPoster)).toBe('70fc3712d6d1048f46833d038c96f8c3502632b81e523b98bcc8ff94b9dccb87');
  });

  it('is imported directly by Today and onboarding, without the retired alternate renderer', () => {
    const today = readFileSync(new URL('../app/today.tsx', import.meta.url), 'utf8');
    const onboarding = readFileSync(new URL('../app/onboarding.tsx', import.meta.url), 'utf8');
    expect(today).toContain('import { TuneIntoHerSphereV4 } from "../TuneIntoHerSphereV4"');
    expect(today).toContain('sphere={<TuneIntoHerSphereV4 size={sphereSize} />}');
    expect(onboarding).toContain('import { TuneIntoHerSphereV4 } from "../TuneIntoHerSphereV4"');
    expect(onboarding).toContain('<TuneIntoHerSphereV4 size={132} />');
    expect(existsSync(new URL('../src/components/PhaseSphere.tsx', import.meta.url))).toBe(false);
  });
});
