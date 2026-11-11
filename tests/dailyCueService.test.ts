import { describe, expect, it } from 'vitest';

import { getCatalog } from '../src/domain/content/contentRepository';
import { invalidateFutureSelections, selectDailyCue } from '../src/domain/content/dailyCueService';
import type { DailySelection, SelectionStore } from '../src/domain/content/types';

class MemoryStore implements SelectionStore {
  values: DailySelection[] = [];
  async readAll() { return this.values; }
  async writeAll(values: DailySelection[]) { this.values = values; }
}
const settings = { lastKnownPeriodStart: '2026-01-01' as const, typicalCycleLength: 28, typicalPeriodLength: 5 };

describe('daily cue state', () => {
  it('returns the same persisted cue on repeated same-day reads', async () => {
    const store = new MemoryStore();
    const first = await selectDailyCue({ date: '2026-01-05', phase: 'menstrual', settings, store });
    const second = await selectDailyCue({ date: '2026-01-05', phase: 'luteal', settings, store });
    expect(second).toBe(first);
  });

  it('selects a new ID on the next day', async () => {
    const store = new MemoryStore();
    const first = await selectDailyCue({ date: '2026-01-05', phase: 'menstrual', settings, store });
    const second = await selectDailyCue({ date: '2026-01-06', phase: 'menstrual', settings, store });
    expect(second).not.toBe(first);
  });

  it('uses only all-phase guidance when a cycle start needs confirmation', async () => {
    const store = new MemoryStore();
    const id = await selectDailyCue({ date: '2026-02-10', phase: 'unconfirmed', settings, store });
    const cue = getCatalog().find((item) => item.id === id);
    expect(cue?.phases).toHaveLength(4);
  });

  it('keeps history through today and invalidates only future choices', async () => {
    const store = new MemoryStore();
    for (const date of ['2026-01-04', '2026-01-05', '2026-01-06'] as const) await selectDailyCue({ date, phase: 'menstrual', settings, store });
    await invalidateFutureSelections(store, '2026-01-05');
    expect(store.values.map((item) => item.date)).toEqual(['2026-01-04', '2026-01-05']);
  });
});
