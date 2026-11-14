import { estimateCycle, type CycleSettings } from './cycleEngine';
import type { DateOnly } from './dateOnly';

/** Highlights describe estimates only, never additional confirmed bleeding events. */
export function isEstimatedPeriodDate(settings: CycleSettings | null, date: DateOnly): boolean {
  if (!settings || date < settings.lastKnownPeriodStart) return false;
  const estimate = estimateCycle({ ...settings, currentLocalDate: date });
  return !estimate.requiresPeriodConfirmation && estimate.estimatedPhase === 'menstrual';
}
