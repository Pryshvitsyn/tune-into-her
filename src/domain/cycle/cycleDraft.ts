import { validateCycleSettings, type CycleSettings } from './cycleEngine';
import type { DateOnly } from './dateOnly';

export interface CycleDraft {
  lastKnownPeriodStart: DateOnly | null;
  typicalCycleLength: number;
  typicalPeriodLength: number;
}

/** A fresh draft has no confirmed start. Numeric estimates never create a record. */
export function cycleDraftFromSaved(saved: CycleSettings | null): CycleDraft {
  return saved ? { ...saved } : {
    lastKnownPeriodStart: null,
    typicalCycleLength: 28,
    typicalPeriodLength: 5,
  };
}

export function cycleSettingsFromDraft(draft: CycleDraft, today: DateOnly): CycleSettings {
  if (!draft.lastKnownPeriodStart) throw new Error('CYCLE_START_REQUIRED');
  const settings = { ...draft, lastKnownPeriodStart: draft.lastKnownPeriodStart };
  const errors = validateCycleSettings(settings, today);
  if (errors.length) throw new Error(`INVALID_CYCLE_INPUT:${errors.join(',')}`);
  return settings;
}
