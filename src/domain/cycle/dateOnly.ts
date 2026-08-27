export type DateOnly = `${number}-${number}-${number}`;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(value: string): { year: number; month: number; day: number } {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) throw new Error('INVALID_DATE_ONLY');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    throw new Error('INVALID_DATE_ONLY');
  }
  return { year, month, day };
}

export function toDateOnly(date: Date): DateOnly {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as DateOnly;
}

export function dateOnlyToLocalDate(value: DateOnly, hour = 12): Date {
  const { year, month, day } = parseDateOnly(value);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

export function epochDay(value: DateOnly): number {
  const { year, month, day } = parseDateOnly(value);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function calendarDayDifference(from: DateOnly, to: DateOnly): number {
  return epochDay(to) - epochDay(from);
}

export function addCalendarDays(value: DateOnly, amount: number): DateOnly {
  const { year, month, day } = parseDateOnly(value);
  const result = new Date(Date.UTC(year, month - 1, day + amount));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}` as DateOnly;
}

export function isDateOnly(value: string): value is DateOnly {
  try {
    parseDateOnly(value);
    return true;
  } catch {
    return false;
  }
}
