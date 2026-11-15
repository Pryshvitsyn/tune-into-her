import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import { EDUCATION_PHASES, EDUCATION_SOURCES, getCycleEducation } from '../src/education/cycleEducation';
import education from '../src/i18n/education.json';

describe('cycle education without a diagnostic or cycle-engine role', () => {
  it('covers exactly the supported locales, with no inherited English fallback', () => {
    expect(Object.keys(education).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
  });
  it.each(SUPPORTED_LANGUAGES)('%s supplies every phase, practical section, caveat and source label', language => {
    const copy = getCycleEducation(language);
    expect(Object.keys(copy.phases)).toEqual(EDUCATION_PHASES);
    for (const phase of EDUCATION_PHASES) {
      expect(Object.keys(copy.phases[phase])).toEqual(['title', 'timing', 'physical', 'energy', 'support']);
      for (const value of Object.values(copy.phases[phase])) {
        expect(value.trim().length).toBeGreaterThan(0);
        expect(value).not.toMatch(/\{\{|TODO|lorem ipsum|learn\./i);
      }
    }
    for (const key of ['title', 'timing', 'physical', 'energy', 'support', 'variation', 'sources', 'sourceLanguage', 'sourceError', 'intro', 'variationBody'] as const) {
      expect(copy[key].trim()).not.toBe('');
    }
    expect(copy.sourceNames).toHaveLength(EDUCATION_SOURCES.length);
    if (language !== 'en') {
      expect(copy.intro).not.toBe(education.en.intro);
      expect(copy.variationBody).not.toBe(education.en.variationBody);
      for (const phase of EDUCATION_PHASES) for (const section of ['timing', 'physical', 'energy', 'support'] as const) {
        expect(copy.phases[phase][section]).not.toBe(education.en.phases[phase][section]);
      }
    }
  });
  it('links only reviewed HTTPS institutional pages, not third-party tracking or generated references', () => {
    expect(EDUCATION_SOURCES.map(source => source.url)).toEqual([
      'https://www.nichd.nih.gov/health/topics/menstruation/conditioninfo',
      'https://www.nhs.uk/conditions/periods/',
      'https://www.nhs.uk/conditions/pre-menstrual-syndrome/',
    ]);
    for (const source of EDUCATION_SOURCES) {
      expect(new URL(source.url).protocol).toBe('https:');
      expect(new URL(source.url).search).toBe('');
      expect(source.checked).toBe('2026-11-15');
    }
  });
});
