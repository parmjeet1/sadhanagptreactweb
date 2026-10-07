// Pure helpers for showing and editing marking-scheme rules (no network, no React), so they can be tested alone.

export const OPERATORS = [
  { value: '>=', label: 'At least' },
  { value: '<=', label: 'Up to' },
  { value: '>', label: 'More than' },
  { value: '<', label: 'Less than' },
  { value: '=', label: 'Exactly' },
];

export const iconFor = (name = '') => {
  const n = String(name).toLowerCase();
  if (n.includes('chant')) return '📿';
  if (n.includes('read')) return '📖';
  if (n.includes('hear')) return '👂';
  if (n.includes('service') || n.includes('clean')) return '🧹';
  if (n.includes('shloka') || n.includes('memorise')) return '📜';
  if (n.includes('sleep')) return '😴';
  if (n.includes('wake')) return '🌅';
  if (n.includes('mangal') || n.includes('aarti')) return '🙏';
  return '🎯';
};

/** Turns the rule rows the server sends into one group per activity (and frequency), best marks first. */
export const groupRules = (rules) => {
  const map = new Map();
  (rules || []).forEach((r) => {
    const frequency = String(r.frequency || 'daily').toLowerCase();
    const masterId = Number(r.master_activity_id);
    const key = `${masterId}_${frequency}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        masterId,
        name: r.activity_name || 'Activity',
        unit: r.activity_unit || '',
        type: r.activity_type || '',
        frequency,
        icon: iconFor(r.activity_name),
        rows: [],
      });
    }
    map.get(key).rows.push({
      ruleId: r.rule_id ?? r.id ?? null,
      operator: r.condition_operator || '=',
      value: String(r.condition_value ?? ''),
      marks: Number(r.marks) || 0,
    });
  });
  const list = [...map.values()];
  list.forEach((g) => {
    g.rows.sort((a, b) => b.marks - a.marks);
    g.max = g.rows.reduce((m, r) => Math.max(m, r.marks), 0);
  });
  return list.sort((a, b) => a.masterId - b.masterId || a.frequency.localeCompare(b.frequency));
};

export const maxOfGroup = (group) => (group.rows || []).reduce((m, r) => Math.max(m, Number(r.marks) || 0), 0);

const NO_UNIT = ['', 'time', 'count', 'boolean', 'yes/no', 'numb'];

/** "At least 16 rounds", "Up to 07:15", "Yes" ... */
export const describeCondition = (row, group = {}) => {
  const value = String(row.value ?? '').trim();
  if (/^(yes|no|true|false)$/i.test(value)) return /^(yes|true)$/i.test(value) ? 'Yes' : 'No';
  const isTime = String(group.type).toLowerCase() === 'time' || value.includes(':');
  const words = isTime
    ? { '<=': 'By', '<': 'Before', '>': 'After', '>=': 'From', '=': 'At' }
    : { '>=': 'At least', '<=': 'Up to', '>': 'More than', '<': 'Less than', '=': 'Exactly' };
  const unit = String(group.unit || '').trim();
  const showUnit = !isTime && !NO_UNIT.includes(unit.toLowerCase());
  return `${words[row.operator] || row.operator} ${value}${showUnit ? ` ${unit}` : ''}`.trim();
};

/** A copy of the groups without server ids (used when my own scheme starts from the default scheme). */
export const withoutIds = (groups) =>
  (groups || []).map((g) => ({ ...g, rows: g.rows.map((r) => ({ ...r, ruleId: null })) }));

/** Checks every row before saving. Returns a plain message, or null when all is fine. */
export const findProblem = (groups) => {
  for (const g of groups || []) {
    for (const r of g.rows) {
      const value = String(r.value ?? '').trim();
      if (!value) return `Please enter a value for "${g.name}".`;
      if (!/^[A-Za-z0-9:. ]+$/.test(value)) return `"${value}" in "${g.name}" can only use letters, numbers, ":" and ".".`;
      const marks = Number(r.marks);
      if (r.marks === '' || !Number.isFinite(marks) || marks < 0) return `Please enter marks (0 or more) for "${g.name}".`;
    }
  }
  return null;
};

/** The body for /my-save-scheme. Groups without rows are left out. */
export const toSavePayload = (groups) =>
  (groups || [])
    .filter((g) => g.rows.length > 0)
    .map((g) => ({
      id: g.masterId,
      badge: g.frequency,
      rows: g.rows.map((r) => ({
        ...(r.ruleId ? { id: r.ruleId } : {}),
        operator: r.operator,
        value: String(r.value).trim(),
        marks: Number(r.marks),
      })),
    }));

/** Percentage colour used by the Marks circle (kept in one place for the activity bars). */
export const colorForPercent = (pct) => {
  if (pct >= 90) return { text: 'text-green-500', bar: '#22c55e' };
  if (pct >= 70) return { text: 'text-teal-500', bar: '#14b8a6' };
  if (pct >= 50) return { text: 'text-orange-500', bar: '#f97316' };
  return { text: 'text-red-500', bar: '#ef4444' };
};
