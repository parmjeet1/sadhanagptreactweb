/**
 * Small date helpers for the "Fill Sadhna on a Particular Date" and "Fill
 * Same Sadhna for Certain Days" flows. Dates are always plain ISO strings
 * ("YYYY-MM-DD") in the LOCAL timezone (never UTC-shifted), matching what a
 * native <input type="date"> gives/takes.
 */

/** Formats a Date object as a local "YYYY-MM-DD" string (no UTC shift). */
export function toLocalISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Today's date as "YYYY-MM-DD", local time. */
export function todayISO() {
  return toLocalISODate(new Date());
}

/** N days before today, as "YYYY-MM-DD", local time. isoDaysAgo(1) = yesterday. */
export function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalISODate(d);
}

/** Friendly label for an ISO date, as "dd/mm/yy" (e.g. "16/09/26"). Falls back to the raw string if unparseable. */
export function formatDateLabel(iso) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return String(iso);
  const [yyyy, mm, dd] = iso.split("-");
  const yy = yyyy.slice(2);
  return `${dd}/${mm}/${yy}`;
}

/** Every ISO date from startISO to endISO, inclusive. Assumes startISO <= endISO. */
export function enumerateDates(startISO, endISO) {
  const out = [];
  const cur = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  while (cur <= end) {
    out.push(toLocalISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Inclusive day-count between two ISO dates (startISO <= endISO assumed). */
export function dateRangeLength(startISO, endISO) {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  return Math.round((end - start) / 86400000) + 1;
}

/** Guardrail: the most days "Fill Same Sadhna for Certain Days" will write in one go. */
export const MAX_DATE_RANGE_DAYS = 31;
