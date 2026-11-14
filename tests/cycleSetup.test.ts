import { afterEach, describe, expect, it } from 'vitest';

import { isEstimatedPeriodDate } from '../src/domain/cycle/calendarPeriodEstimate';
import { cycleDraftFromSaved, cycleSettingsFromDraft } from '../src/domain/cycle/cycleDraft';
import type { CycleSettings } from '../src/domain/cycle/cycleEngine';
import { cycleToday } from '../src/domain/cycle/cycleToday';

const confirmed: CycleSettings = {
  lastKnownPeriodStart: '2026-11-03', typicalCycleLength: 28, typicalPeriodLength: 5,
};
const originalTimezone = process.env.TZ;
afterEach(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

describe('explicit cycle setup', () => {
  it('does not create a date, day, phase or savable record for a fresh user', () => {
    const draft = cycleDraftFromSaved(null);
    expect(draft.lastKnownPeriodStart).toBeNull();
    expect(() => cycleSettingsFromDraft(draft, '2026-11-14')).toThrow('CYCLE_START_REQUIRED');
    expect(cycleToday(null, new Date(2026, 10, 14, 12))).toMatchObject({
      localDate: '2026-11-14', estimate: null, guidanceEstimate: null,
    });
    expect(isEstimatedPeriodDate(null, '2026-11-14')).toBe(false);
  });

  it('prefills only the complete saved record without replacing dates or lengths', () => {
    const saved: CycleSettings = { ...confirmed, typicalCycleLength: 35, typicalPeriodLength: 7 };
    const draft = cycleDraftFromSaved(saved);
    expect(cycleSettingsFromDraft(draft, '2026-11-14')).toEqual(saved);
    draft.lastKnownPeriodStart = '2026-11-10';
    draft.typicalCycleLength = 30;
    expect(saved).toEqual({ ...confirmed, typicalCycleLength: 35, typicalPeriodLength: 7 });
    expect(cycleDraftFromSaved(saved)).toEqual(saved);
  });

  it('requires an explicit date and rejects future dates before saving', () => {
    const draft = cycleDraftFromSaved(null);
    draft.lastKnownPeriodStart = '2026-11-14';
    expect(cycleSettingsFromDraft(draft, '2026-11-14')).toEqual({ ...confirmed, lastKnownPeriodStart: '2026-11-14' });
    draft.lastKnownPeriodStart = '2026-11-15';
    expect(() => cycleSettingsFromDraft(draft, '2026-11-14')).toThrow('futureDate');
  });
});

describe('confirmed November 3 local-calendar scenario', () => {
  it.each([
    [3, 1], [9, 7], [16, 14], [23, 21], [30, 28],
  ])('shows November %i as cycle day %i', (date, day) => {
    expect(cycleToday(confirmed, new Date(2026, 10, date, 12)).estimate?.estimatedCycleDay).toBe(day);
  });

  it.each(['America/Los_Angeles', 'Europe/Rome', 'Asia/Tokyo', 'Pacific/Kiritimati'])(
    'uses the local date in %s without a UTC or midnight off-by-one', timezone => {
      process.env.TZ = timezone;
      const before = cycleToday(confirmed, new Date(2026, 10, 13, 23, 59));
      const after = cycleToday(confirmed, new Date(2026, 10, 14, 0, 1));
      expect(before.estimate?.estimatedCycleDay).toBe(11);
      expect(after.estimate?.estimatedCycleDay).toBe(12);
      expect(after.localDate).toBe('2026-11-14');
      expect(after.adviceDate).toBe('2026-11-13');
    },
  );

  it('updates the cycle day at midnight while guidance rolls over only at 08:00', () => {
    const before = cycleToday(confirmed, new Date(2026, 10, 8, 7, 59));
    const after = cycleToday(confirmed, new Date(2026, 10, 8, 8));
    expect(before.estimate?.estimatedCycleDay).toBe(6);
    expect(after.estimate?.estimatedCycleDay).toBe(6);
    expect(before.guidanceEstimate?.estimatedCycleDay).toBe(5);
    expect(after.guidanceEstimate?.estimatedCycleDay).toBe(6);
    expect(before.adviceDate).toBe('2026-11-07');
    expect(after.adviceDate).toBe('2026-11-08');
  });

  it('can confirm today before 08:00 without manufacturing a preceding cycle', () => {
    const state = cycleToday(confirmed, new Date(2026, 10, 3, 6));
    expect(state.estimate?.estimatedCycleDay).toBe(1);
    expect(state.guidanceEstimate?.estimatedCycleDay).toBe(1);
    expect(state.adviceDate).toBe('2026-11-03');
  });

  it('does not move a November 3 start to November 2 and labels later highlights as estimates', () => {
    expect(isEstimatedPeriodDate(confirmed, '2026-11-02')).toBe(false);
    for (const date of ['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-12-01', '2026-12-05'] as const) {
      expect(isEstimatedPeriodDate(confirmed, date)).toBe(true);
    }
    expect(isEstimatedPeriodDate(confirmed, '2026-11-08')).toBe(false);
    expect(isEstimatedPeriodDate(confirmed, '2026-12-06')).toBe(false);
    expect(isEstimatedPeriodDate(confirmed, '2026-12-13')).toBe(false);
    expect(confirmed.lastKnownPeriodStart).toBe('2026-11-03');
  });
});
