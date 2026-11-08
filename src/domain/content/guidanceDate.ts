import { addCalendarDays, toDateOnly, type DateOnly } from '../cycle/dateOnly';

export const GUIDANCE_REFRESH_HOUR = 8;

/** Keep the previous guidance until 08:00 in the device's local timezone. */
export function guidanceDate(now: Date, lastKnownPeriodStart?: DateOnly): DateOnly {
  const today = toDateOnly(now);
  const date = now.getHours() < GUIDANCE_REFRESH_HOUR ? addCalendarDays(today, -1) : today;
  // A newly recorded period starting today has no valid preceding cycle date.
  // Show day one immediately instead of passing a future start to the engine.
  return lastKnownPeriodStart && lastKnownPeriodStart > date && lastKnownPeriodStart <= today
    ? lastKnownPeriodStart
    : date;
}
