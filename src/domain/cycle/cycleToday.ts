import { guidanceDate } from '../content/guidanceDate';

import { estimateCycle, type CycleSettings } from './cycleEngine';
import { toDateOnly } from './dateOnly';

/** Cycle timing follows the local calendar; authored guidance changes at 08:00. */
export function cycleToday(settings: CycleSettings | null, now: Date) {
  const localDate = toDateOnly(now);
  const adviceDate = guidanceDate(now, settings?.lastKnownPeriodStart);
  if (!settings) return { localDate, adviceDate, estimate: null, guidanceEstimate: null };
  return {
    localDate,
    adviceDate,
    estimate: estimateCycle({ ...settings, currentLocalDate: localDate }),
    guidanceEstimate: estimateCycle({ ...settings, currentLocalDate: adviceDate }),
  };
}
