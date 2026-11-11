import { calendarDayDifference, dateOnlyToLocalDate, toDateOnly } from './dateOnly';

export function cycleUpdateDateRange(today = new Date()): { minimumDate: Date; maximumDate: Date } {
  const current = toDateOnly(today);
  return {
    minimumDate: new Date(today.getFullYear(), 0, 1, 12),
    maximumDate: dateOnlyToLocalDate(current),
  };
}

export function isValidCycleUpdateDate(value: Date, today = new Date()): boolean {
  const selected = toDateOnly(value);
  const current = toDateOnly(today);
  return selected.slice(0, 4) === current.slice(0, 4) && calendarDayDifference(selected, current) >= 0;
}
