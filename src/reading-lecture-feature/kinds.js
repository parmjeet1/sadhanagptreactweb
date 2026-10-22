// The three kinds of speaker for lectures: Srila Prabhupada, Guru Maharaj, Others.
// The speaker is picked from a drop-down; the backend works out the kind from the same text
// (see speakerKind in the backend readingRules.js), so the two always agree.
// Tailwind class names are written out in full so they are not removed from the build.

export const KINDS = {
  prabhupada: { label: 'Srila Prabhupada', hex: '#14b8a6', dot: 'bg-teal-500', bar: 'bg-teal-500', chip: 'bg-teal-50 text-teal-700 border-teal-100', soft: 'bg-teal-50' },
  guru: { label: 'Guru Maharaj', hex: '#f59e0b', dot: 'bg-amber-500', bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-100', soft: 'bg-amber-50' },
  others: { label: 'Others', hex: '#8b5cf6', dot: 'bg-violet-500', bar: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 border-violet-100', soft: 'bg-violet-50' },
};

export const KIND_ORDER = ['prabhupada', 'guru', 'others'];

/** The choices of the "Speaker" drop-down */
export const SPEAKER_OPTIONS = ['Srila Prabhupada', 'Guru Maharaj', 'Others'];

export const speakerKind = (speaker) => {
  const s = String(speaker ?? '').toLowerCase();
  if (/prabhup/.test(s)) return 'prabhupada';
  if (/\bguru\s*maharaj/.test(s)) return 'guru';
  return 'others';
};

/** What to send as `speaker`: the chosen option, or (for Others) the typed name if there is one. */
export const speakerFromChoice = (option, otherName = '') => (option === 'Others' ? (otherName.trim() || 'Others') : option);

/** Counts by kind of a list of { kind } */
export const countKinds = (rows) => {
  const out = { prabhupada: 0, guru: 0, others: 0 };
  rows.forEach((r) => { out[r.kind || 'others'] += 1; });
  return out;
};
