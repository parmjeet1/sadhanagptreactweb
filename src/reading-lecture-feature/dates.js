// Small date helpers (dates are plain YYYY-MM-DD text, as the backend sends them).

const pad = (n) => String(n).padStart(2, '0');

/** Today on the person's own device clock, as YYYY-MM-DD */
export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** The date n days before a YYYY-MM-DD date */
export const daysBefore = (date, n) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today", "Yesterday" or "9 Oct 2026" */
export const dayLabel = (date, today = localToday()) => {
  if (!date) return '';
  if (date === today) return 'Today';
  if (date === daysBefore(today, 1)) return 'Yesterday';
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/** "9 Oct" (no year) */
export const shortDate = (date) => {
  if (!date) return '';
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

/** Newest first rows [{ heardOn }] -> [{ date, label, rows }] (one entry per day) */
export const groupByDate = (rows, key = 'heardOn') => {
  const today = localToday();
  const out = [];
  rows.forEach((r) => {
    const last = out[out.length - 1];
    if (last && last.date === r[key]) last.rows.push(r);
    else out.push({ date: r[key], label: dayLabel(r[key], today), rows: [r] });
  });
  return out;
};
