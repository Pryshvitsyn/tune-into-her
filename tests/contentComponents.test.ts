import { describe, expect, it } from 'vitest';

import reviewStatus from '../release/content-review.json';
import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import { getCatalog, getLocalizedCue } from '../src/domain/content/contentRepository';
import { selectDailyCue } from '../src/domain/content/dailyCueService';
import { dailyReminders } from '../src/domain/content/dailyGuidance';
import type { DailySelection, SelectionStore } from '../src/domain/content/types';
import type { CyclePhase, CycleSettings } from '../src/domain/cycle/cycleEngine';
import { addCalendarDays, type DateOnly } from '../src/domain/cycle/dateOnly';

import legacy from './fixtures/content-v3-digests.json';

class MemoryStore implements SelectionStore {
  values: DailySelection[] = [];
  async readAll() { return this.values; }
  async writeAll(values: DailySelection[]) { this.values = values; }
}
const phases: CyclePhase[] = ['menstrual', 'follicular', 'mid_cycle', 'luteal'];
const fields = ['cue', 'support', 'context'] as const;
const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');
const defaults: CycleSettings = { lastKnownPeriodStart: '2026-01-01', typicalCycleLength: 28, typicalPeriodLength: 5 };
async function simulate(settings: CycleSettings, start: DateOnly, heldPhase?: CyclePhase) {
  const store = new MemoryStore();
  const ids: string[] = [];
  for (let day = 0; day < 90; day++) {
    const date = addCalendarDays(start, day);
    const phase = heldPhase ?? phases[day % phases.length]!;
    ids.push(await selectDailyCue({ date, phase, settings, store }));
  }
  return ids;
}
function assertFreshComponents(ids: string[], scenario: string) {
  for (const language of SUPPORTED_LANGUAGES) {
    for (const field of fields) {
      const texts = ids.map(id => normalize(getLocalizedCue(language, id)[field]));
      expect(new Set(texts).size, `${scenario}:${language}:${field}`).toBe(90);
    }
  }
  const metadata = new Map(getCatalog().map(item => [item.id, item]));
  for (const field of ['actionId', 'supportId', 'contextId'] as const) {
    expect(new Set(ids.map(id => metadata.get(id)![field])).size, `${scenario}:${field}`).toBe(90);
  }
}

describe('individual blocks in the ninety-day reserve', () => {
  it('has ninety distinct eligible texts per block in every locale and phase', () => {
    for (const phase of phases) {
      const reserve = getCatalog().filter(item => item.phases.includes(phase) && item.tags.includes('reserve-v4'));
      expect(reserve).toHaveLength(90);
      for (const language of SUPPORTED_LANGUAGES) for (const field of fields) {
        expect(new Set(reserve.map(item => normalize(getLocalizedCue(language, item.id)[field]))).size,
          `${phase}:${language}:${field}`).toBe(90);
      }
    }
  });

  it('never repeats any block over all 180 onboarding and six edge cycle configurations', async () => {
    const configurations: [number, number][] = [];
    for (let cycle = 21; cycle <= 40; cycle++) for (let period = 2; period <= 10; period++) configurations.push([cycle, period]);
    configurations.push([15, 1], [15, 14], [21, 20], [60, 20], [90, 1], [90, 20]);
    for (const [typicalCycleLength, typicalPeriodLength] of configurations) {
      const ids = await simulate({ ...defaults, typicalCycleLength, typicalPeriodLength }, '2026-02-13');
      assertFreshComponents(ids, `${typicalCycleLength}/${typicalPeriodLength}`);
    }
  }, 60000);

  it('covers different starting phases, leap day and local-date DST boundaries', async () => {
    for (const start of ['2026-01-01', '2026-01-10', '2026-01-15', '2026-10-03', '2028-02-20'] as const) {
      assertFreshComponents(await simulate(defaults, start), start);
    }
  });

  it('does not repeat any block even when each phase is held for ninety days', async () => {
    for (const phase of phases) assertFreshComponents(await simulate(defaults, '2026-02-13', phase), phase);
  });

  it('survives daily phase changes while keeping exactly one recurring gratitude reminder', async () => {
    const store = new MemoryStore();
    const ids = [];
    for (let day = 0; day < 90; day++) {
      const date = addCalendarDays('2026-02-13', day);
      const phase = phases[day % phases.length]!;
      const id = await selectDailyCue({ date, phase, settings: defaults, store });
      ids.push(id);
      // Same-day settings/phase changes must not swap the persisted advice.
      expect(await selectDailyCue({ date, phase: phases[(day + 1) % phases.length]!, settings: defaults, store })).toBe(id);
      for (const language of SUPPORTED_LANGUAGES) {
        expect(dailyReminders(date, language).filter(line => line.id === 'gratitude')).toHaveLength(1);
      }
    }
    // Only the three authored blocks are checked for uniqueness: the separate
    // gratitude habit is intentionally repeated, never blanket-exempted text.
    assertFreshComponents(ids, 'daily-phase-changes');
  });

  it('keeps all 484 v3 entries and translations byte-equivalent in value and preserves saved selections', async () => {
    const old = getCatalog().filter(item => !item.tags.includes('reserve-v4'));
    expect(old).toHaveLength(484);
    const digest = async (value: unknown) => {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
      return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
    };
    expect(await digest(old)).toBe(legacy.catalog);
    for (const language of SUPPORTED_LANGUAGES) {
      expect(await digest(Object.fromEntries(old.map(item => [item.id, getLocalizedCue(language, item.id)])))).toBe(legacy.locales[language]);
    }
    const store = new MemoryStore();
    store.values = [{ date: '2026-02-13', cueId: 'menstrual_001', cycleFingerprint: 'old', contentVersion: 3 }];
    expect(await selectDailyCue({ date: '2026-02-13', phase: 'luteal', settings: defaults, store })).toBe('menstrual_001');
    const next = await selectDailyCue({ date: '2026-02-14', phase: 'luteal', settings: defaults, store });
    expect(next.startsWith('reserve_')).toBe(true);
    const a = getLocalizedCue('en', 'menstrual_001'), b = getLocalizedCue('en', next);
    for (const field of fields) expect(b[field]).not.toBe(a[field]);
    expect(store.values[0]!.contentVersion).toBe(3);
    expect(store.values[1]!.contentVersion).toBe(4);
  });

  it('keeps all eleven language reviews explicitly pending', () => {
    expect(Object.keys(reviewStatus.locales).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
    for (const locale of Object.values(reviewStatus.locales)) expect(locale.status).toBe('needs-native-review');
    expect(reviewStatus.locales.mbf.communityReview).toBe('pending');
  });
});
