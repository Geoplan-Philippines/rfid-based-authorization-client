/** Local calendar-date helpers for gate-local YYYY-MM-DD query params.
 *  Always derive from getFullYear/getMonth/getDate — never toISOString,
 *  which shifts to UTC and can land on the wrong gate-local day. */

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function toQueryDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` string into a local Date; `null` if absent/malformed. */
export function parseQueryDate(value: string | null | undefined): Date | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}
