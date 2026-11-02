import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGES } from '../src/config/constants';
import { getCatalog, getLocalizedCue } from '../src/domain/content/contentRepository';
import { selectDailyCue } from '../src/domain/content/dailyCueService';
import type { DailySelection, SelectionStore } from '../src/domain/content/types';
import { estimateCycle, type CyclePhase, type CycleSettings } from '../src/domain/cycle/cycleEngine';
import { addCalendarDays } from '../src/domain/cycle/dateOnly';

class MemoryStore implements SelectionStore {
  values: DailySelection[] = [];
  async readAll() { return this.values; }
  async writeAll(values: DailySelection[]) { this.values = values; }
}
const phases: CyclePhase[] = ['menstrual', 'follicular', 'mid_cycle', 'luteal'];
const signature = (language: typeof SUPPORTED_LANGUAGES[number], id: string) => {
  const entry = getLocalizedCue(language, id);
  return JSON.stringify([entry.cue, entry.support, entry.context]);
};

describe('three-month visible content reserve', () => {
  it('has at least 90 eligible, visibly distinct three-part bundles in every phase and locale', () => {
    const catalog = getCatalog();
    for (const language of SUPPORTED_LANGUAGES) {
      // Uniqueness across phases too: changing phase cannot disguise a duplicate day.
      expect(new Set(catalog.map(item => signature(language, item.id))).size).toBe(catalog.length);
      for (const phase of phases) {
        const eligible = catalog.filter(item => item.phases.includes(phase));
        expect(eligible.length).toBeGreaterThanOrEqual(90);
        for (const item of eligible) {
          const entry = getLocalizedCue(language, item.id);
          expect([entry.cue, entry.support, entry.context].every(text => text.trim().length > 0)).toBe(true);
        }
      }
    }
  });

  it('does not repeat a full visible day over 90 days even when a phase stays unchanged', async () => {
    const settings: CycleSettings = { lastKnownPeriodStart: '2026-01-01', typicalCycleLength: 28, typicalPeriodLength: 5 };
    for (const phase of phases) {
      const store = new MemoryStore();
      const selected: string[] = [];
      for (let day = 0; day < 90; day++) {
        const date = addCalendarDays('2026-01-01', day);
        const id = await selectDailyCue({ date, phase, settings, store });
        if (selected.length) {
          const previous = getLocalizedCue('en', selected[selected.length - 1]!);
          const current = getLocalizedCue('en', id);
          for (const key of ['cue', 'support', 'context'] as const) expect(current[key]).not.toBe(previous[key]);
        }
        selected.push(id);
        expect(await selectDailyCue({ date, phase, settings, store })).toBe(id);
      }
      for (const language of SUPPORTED_LANGUAGES) {
        expect(new Set(selected.map(id => signature(language, id))).size).toBe(90);
      }
    }
  });

  it('covers all onboarding cycle/period combinations and representative wider accepted settings', async () => {
    const configurations: [number, number][] = [];
    for (let cycle = 21; cycle <= 40; cycle++)
      for (let period = 2; period <= 10; period++) configurations.push([cycle, period]);
    configurations.push([15, 1], [15, 14], [21, 20], [60, 20], [90, 1], [90, 20]);
    const catalog = new Map(getCatalog().map(item => [item.id, item]));
    for (const [typicalCycleLength, typicalPeriodLength] of configurations) {
      const settings: CycleSettings = { lastKnownPeriodStart: '2026-01-01', typicalCycleLength, typicalPeriodLength };
      const store = new MemoryStore();
      const seen = new Set<string>();
      for (let day = 0; day < 90; day++) {
        const date = addCalendarDays('2026-02-13', day); // Begin partway through a cycle, cross month boundaries.
        const phase = estimateCycle({ ...settings, currentLocalDate: date }).estimatedPhase;
        const id = await selectDailyCue({ date, phase, settings, store });
        expect(catalog.get(id)!.phases).toContain(phase);
        seen.add(signature('en', id));
      }
      expect(seen.size, `${typicalCycleLength}/${typicalPeriodLength}`).toBe(90);
    }
  }, 60000);

  it('avoids yesterday\'s constituent text, preserves old IDs, and handles unknown historical IDs', async () => {
    const settings: CycleSettings = { lastKnownPeriodStart: '2026-01-01', typicalCycleLength: 28, typicalPeriodLength: 5 };
    const store = new MemoryStore();
    store.values.push({ date: '2025-12-31', cueId: 'retired_cue', cycleFingerprint: 'old', contentVersion: 1 });
    let previous: ReturnType<typeof getLocalizedCue> | undefined;
    for (let day = 0; day < 90; day++) {
      const date = addCalendarDays('2026-01-01', day);
      const phase = estimateCycle({ ...settings, currentLocalDate: date }).estimatedPhase;
      const id = await selectDailyCue({ date, phase, settings, store });
      const entry = getLocalizedCue('en', id);
      if (previous) for (const key of ['cue', 'support', 'context'] as const) expect(entry[key]).not.toBe(previous[key]);
      previous = entry;
    }
    for (const [phase, count] of [['menstrual', 72], ['follicular', 104], ['mid_cycle', 44], ['luteal', 180]] as const)
      for (let index = 1; index <= count; index++) expect(getLocalizedCue('en', `${phase}_${String(index).padStart(3, '0')}`).support).toBeTruthy();
  });
});
