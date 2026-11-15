import type { SupportedLanguage } from '../config/constants';
import type { CyclePhase } from '../domain/cycle/cycleEngine';
import education from '../i18n/education.json';

export const EDUCATION_PHASES: readonly CyclePhase[] = ['menstrual', 'follicular', 'mid_cycle', 'luteal'];
/** General education only: never used by cycle calculations or eligibility decisions. */
export const EDUCATION_SOURCES = [
  { provider: 'NIH · NICHD', url: 'https://www.nichd.nih.gov/health/topics/menstruation/conditioninfo', checked: '2026-11-15' },
  { provider: 'NHS', url: 'https://www.nhs.uk/conditions/periods/', checked: '2026-11-15' },
  { provider: 'NHS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/', checked: '2026-11-15' },
] as const;

export function getCycleEducation(language: SupportedLanguage) { return education[language]; }
