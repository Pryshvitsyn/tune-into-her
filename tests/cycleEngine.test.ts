import { describe, expect, it } from 'vitest';

import { estimateCycle } from '../src/domain/cycle/cycleEngine';
import { calendarDayDifference, toDateOnly } from '../src/domain/cycle/dateOnly';

describe('cycle engine', () => {
  it.each([
    ['2026-01-01', '2026-01-01', 28, 1],
    ['2026-01-01', '2026-01-14', 28, 14],
    ['2026-01-01', '2026-01-28', 28, 28],
    ['2026-01-01', '2026-01-29', 28, 1],
    ['2026-01-01', '2026-01-22', 21, 1],
    ['2026-01-01', '2026-02-10', 40, 1],
  ] as const)('maps %s to %s for a %i-day cycle', (start, current, length, day) => {
    expect(estimateCycle({ lastKnownPeriodStart: start, currentLocalDate: current, typicalCycleLength: length, typicalPeriodLength: 5 }).estimatedCycleDay).toBe(day);
  });

  it('recalculates phase from the confirmed cycle date at phase boundaries', () => {
    const base = { typicalCycleLength: 28, typicalPeriodLength: 5, currentLocalDate: '2026-01-15' as const };
    expect(estimateCycle({ ...base, lastKnownPeriodStart: '2026-01-11' }).estimatedPhase).toBe('menstrual');
    expect(estimateCycle({ ...base, lastKnownPeriodStart: '2026-01-10' }).estimatedPhase).toBe('follicular');
    expect(estimateCycle({ ...base, lastKnownPeriodStart: '2026-01-03' }).estimatedPhase).toBe('mid_cycle');
  });

  it('marks a projected new-cycle boundary', () => {
    expect(estimateCycle({ lastKnownPeriodStart: '2026-01-01', currentLocalDate: '2026-01-29', typicalCycleLength: 28, typicalPeriodLength: 5 }).isProjectedNewCycleBoundary).toBe(true);
  });

  it('rejects a future known date', () => {
    expect(() => estimateCycle({ lastKnownPeriodStart: '2026-03-02', currentLocalDate: '2026-03-01', typicalCycleLength: 28, typicalPeriodLength: 5 })).toThrow('futureDate');
  });

  it('counts across the US spring DST boundary by calendar date', () => {
    expect(calendarDayDifference('2026-03-07', '2026-03-09')).toBe(2);
    expect(estimateCycle({ lastKnownPeriodStart: '2026-03-07', currentLocalDate: '2026-03-09', typicalCycleLength: 28, typicalPeriodLength: 5 }).estimatedCycleDay).toBe(3);
  });

  it('counts leap day correctly', () => {
    expect(calendarDayDifference('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('stores local calendar dates without UTC conversion', () => {
    expect(toDateOnly(new Date(2026, 6, 4, 23, 30))).toBe('2026-07-04');
  });

  it('softens confidence when regularity is unknown or variable', () => {
    const base = { lastKnownPeriodStart: '2026-01-01' as const, currentLocalDate: '2026-01-10' as const, typicalCycleLength: 28, typicalPeriodLength: 5 };
    expect(estimateCycle({ ...base, regularity: 'regular' }).confidence).toBe('higher');
    expect(estimateCycle({ ...base, regularity: 'varies' }).confidence).toBe('lower');
    expect(estimateCycle({ ...base, regularity: 'unknown' }).confidence).toBe('limited');
  });
});
