/**
 * Convert a Date to "YYYY-MM-DD" string in LOCAL timezone.
 *
 * Unlike `toISOString().split('T')[0]` which converts to UTC first
 * (shifting dates back in UTC+ timezones like Greece/UTC+3),
 * this uses local date parts so "April 10" stays "2026-04-10".
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
