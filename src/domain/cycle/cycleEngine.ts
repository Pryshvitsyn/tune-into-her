import { addCalendarDays, calendarDayDifference, type DateOnly } from './dateOnly';

export type CyclePhase = 'menstrual' | 'follicular' | 'mid_cycle' | 'luteal';

export interface CycleInput {
  lastKnownPeriodStart: DateOnly;
  typicalCycleLength: number;
  typicalPeriodLength: number;
  currentLocalDate: DateOnly;
}

export interface CycleEstimate {
  estimatedCycleDay: number;
  estimatedPhase: CyclePhase;
  estimatedCycleStart: DateOnly;
  daysFromKnownStart: number;
  isEstimated: true;
  isProjectedNewCycleBoundary: boolean;
}

export interface CycleSettings {
  lastKnownPeriodStart: DateOnly;
  typicalCycleLength: number;
  typicalPeriodLength: number;
}

export function validateCycleSettings(settings: CycleSettings, today: DateOnly): string[] {
  const errors: string[] = [];
  if (calendarDayDifference(settings.lastKnownPeriodStart, today) < 0) errors.push('futureDate');
  if (!Number.isInteger(settings.typicalCycleLength) || settings.typicalCycleLength < 15 || settings.typicalCycleLength > 90) errors.push('cycleLength');
  if (!Number.isInteger(settings.typicalPeriodLength) || settings.typicalPeriodLength < 1 || settings.typicalPeriodLength > 20) errors.push('periodLength');
  if (settings.typicalPeriodLength >= settings.typicalCycleLength) errors.push('periodVsCycle');
  return errors;
}

export function estimateCycle(input: CycleInput): CycleEstimate {
  const errors = validateCycleSettings(input, input.currentLocalDate);
  if (errors.length) throw new Error(`INVALID_CYCLE_INPUT:${errors.join(',')}`);

  const daysFromKnownStart = calendarDayDifference(input.lastKnownPeriodStart, input.currentLocalDate);
  const cycleOffset = daysFromKnownStart % input.typicalCycleLength;
  const estimatedCycleDay = cycleOffset + 1;
  const estimatedCycleStart = addCalendarDays(input.currentLocalDate, -cycleOffset);
  const ovulationEstimate = Math.max(input.typicalPeriodLength + 2, input.typicalCycleLength - 14);
  const midStart = Math.max(input.typicalPeriodLength + 1, ovulationEstimate - 1);
  const midEnd = Math.min(input.typicalCycleLength, ovulationEstimate + 1);

  let estimatedPhase: CyclePhase;
  if (estimatedCycleDay <= input.typicalPeriodLength) estimatedPhase = 'menstrual';
  else if (estimatedCycleDay < midStart) estimatedPhase = 'follicular';
  else if (estimatedCycleDay <= midEnd) estimatedPhase = 'mid_cycle';
  else estimatedPhase = 'luteal';

  return {
    estimatedCycleDay,
    estimatedPhase,
    estimatedCycleStart,
    daysFromKnownStart,
    isEstimated: true,
    isProjectedNewCycleBoundary: daysFromKnownStart > 0 && estimatedCycleDay === 1,
  };
}
