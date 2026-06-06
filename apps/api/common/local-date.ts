/** Calendar date key YYYY-MM-DD using UTC date parts. */
export function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** UTC instant at noon for a calendar date (avoids DST boundary issues). */
export function utcDateFromParts(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

/** Parse Strava start_date_local using the local calendar date in the string. */
export function parseStravaStartDateLocal(iso: string): Date {
  const datePart = iso.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) {
    return new Date(iso);
  }
  return utcDateFromParts(year, month, day);
}

/** Normalize a stored Date to its UTC calendar day at noon. */
export function normalizeToUtcDateOnly(date: Date): Date {
  return utcDateFromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Monday-start week containing the given UTC calendar date. */
export function getWeekStartUtc(date: Date): Date {
  const normalized = normalizeToUtcDateOnly(date);
  const day = normalized.getUTCDay();
  const diff = normalized.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(
    Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth(), diff, 12, 0, 0, 0),
  );
}

/** Monday=0 … Sunday=6 from UTC calendar date. */
export function getDaySortOrderUtc(date: Date): number {
  const day = normalizeToUtcDateOnly(date).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function addUtcDays(date: Date, days: number): Date {
  const normalized = normalizeToUtcDateOnly(date);
  return new Date(
    Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth(), normalized.getUTCDate() + days, 12, 0, 0, 0),
  );
}
