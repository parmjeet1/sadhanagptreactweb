// A date from the server may arrive as "2014-06-15T00:00:00.000Z" (a database DATE turned into text).
// The birthday box and the server want the plain "YYYY-MM-DD". Same rules as the backend's utils/dateOnly.js:
// a timestamp at midnight UTC keeps its date; any other timestamp is read as an India date.
// Returns '' for empty or unreadable input.

const pad = (n) => String(n).padStart(2, '0');
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const toDateOnly = (value) => {
  const s = String(value ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const midnight = s.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.0+)?Z$/);
  if (midnight) return midnight[1];
  const t = new Date(s);
  if (Number.isNaN(t.getTime())) return '';
  const ist = new Date(t.getTime() + IST_OFFSET_MS);
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`;
};
