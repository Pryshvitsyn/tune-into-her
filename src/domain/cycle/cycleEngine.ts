import { addCalendarDays, calendarDayDifference, type DateOnly } from './dateOnly';

export type CyclePhase = 'menstrual' | 'follicular' | 'mid_cycle' | 'luteal';
export type PhysiologicalCyclePhase = Exclude<CyclePhase, 'menstrual'>;

// A calendar estimate must not silently turn into a new confirmed period. Once
// this window has elapsed, the caller can still offer non-cycle-specific
// guidance, but needs a new user-confirmed start date before presenting a
// renewed cycle or phase.
export const MAX_UNCONFIRMED_CYCLE_DAYS = 40;

export interface CycleInput {
  lastKnownPeriodStart: DateOnly;
  typicalCycleLength: number;
  typicalPeriodLength: number;
  currentLocalDate: DateOnly;
}

export interface CycleEstimate {
  estimatedCycleDay: number;
  estimatedPhase: CyclePhase;
  /** Menstruation is a presentation sub-stage of the follicular phase. */
  estimatedPhysiologicalPhase: PhysiologicalCyclePhase;
  estimatedCycleStart: DateOnly;
  daysFromKnownStart: number;
  isEstimated: true;
  isProjectedNewCycleBoundary: boolean;
  requiresPeriodConfirmation: boolean;
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
  const requiresPeriodConfirmation = daysFromKnownStart >= MAX_UNCONFIRMED_CYCLE_DAYS;
  const cycleOffset = daysFromKnownStart % input.typicalCycleLength;
  // Once confirmation is overdue, retain the elapsed day rather than wrap it
  // into a fabricated day 1. The UI deliberately does not present this as a
  // phase-specific estimate.
  const estimatedCycleDay = requiresPeriodConfirmation ? daysFromKnownStart + 1 : cycleOffset + 1;
  const estimatedCycleStart = requiresPeriodConfirmation
    ? input.lastKnownPeriodStart
    : addCalendarDays(input.currentLocalDate, -cycleOffset);
  const ovulationEstimate = Math.max(input.typicalPeriodLength + 2, input.typicalCycleLength - 14);
  const midStart = Math.max(input.typicalPeriodLength + 1, ovulationEstimate - 1);
  const midEnd = Math.min(input.typicalCycleLength, ovulationEstimate + 1);

  let estimatedPhase: CyclePhase = 'luteal';
  if (!requiresPeriodConfirmation) {
    if (estimatedCycleDay <= input.typicalPeriodLength) estimatedPhase = 'menstrual';
    else if (estimatedCycleDay < midStart) estimatedPhase = 'follicular';
    else if (estimatedCycleDay <= midEnd) estimatedPhase = 'mid_cycle';
  }

  return {
    estimatedCycleDay,
    estimatedPhase,
    estimatedPhysiologicalPhase: estimatedPhase === 'menstrual' ? 'follicular' : estimatedPhase,
    estimatedCycleStart,
    daysFromKnownStart,
    isEstimated: true,
    isProjectedNewCycleBoundary: !requiresPeriodConfirmation && daysFromKnownStart > 0 && estimatedCycleDay === 1,
    requiresPeriodConfirmation,
  };
}
