import { describe, expect, it } from 'vitest';

import { guidanceDate } from '../src/domain/content/guidanceDate';
import { estimateCycle } from '../src/domain/cycle/cycleEngine';

describe('local 08:00 guidance rollover', () => {
  it('keeps the prior advice date through midnight and switches at 08:00', () => {
    for (const time of [new Date(2026, 10, 8, 0), new Date(2026, 10, 8, 7, 59, 59)]) {
      expect(guidanceDate(time)).toBe('2026-11-07');
    }
    expect(guidanceDate(new Date(2026, 10, 8, 8))).toBe('2026-11-08');
    expect(guidanceDate(new Date(2026, 10, 8, 23, 59))).toBe('2026-11-08');
  });

  it.each([
    [2027, 0, 1, '2026-12-31'],
    [2028, 2, 1, '2028-02-29'],
    [2026, 2, 30, '2026-03-29'],
    [2026, 9, 26, '2026-10-25'],
  ] as const)('uses calendar dates across boundaries: %i/%i/%i', (year, month, day, previous) => {
    expect(guidanceDate(new Date(year, month, day, 7, 59))).toBe(previous);
  });

  it('accepts a period newly recorded before 08:00 without a future-date error', () => {
    const settings = { lastKnownPeriodStart: '2026-11-08' as const, typicalCycleLength: 28, typicalPeriodLength: 5 };
    const currentLocalDate = guidanceDate(new Date(2026, 10, 8, 6), settings.lastKnownPeriodStart);
    expect(estimateCycle({ ...settings, currentLocalDate }).estimatedCycleDay).toBe(1);
  });

  it('retains the previous guidance for an ongoing cycle before 08:00', () => {
    expect(guidanceDate(new Date(2026, 10, 8, 7), '2026-11-03')).toBe('2026-11-07');
  });
});
