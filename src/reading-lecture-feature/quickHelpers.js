// Small pure helpers for the quick cards on the main sadhana screen.

/** 'reading' | 'hearing' | null, from the activity name */
export const quickKindOf = (activity) => {
  const name = String(activity?.name || '').toLowerCase();
  if (name.includes('reading')) return 'reading';
  if (name.includes('lecture') || name.includes('hearing')) return 'hearing';
  return null;
};

/** Has the person filled this activity for the day? (minutes above 0, or a yes) */
export const isFilled = (activity) => {
  if (!activity) return false;
  if (activity.type === 'TIME') return false;
  if (activity.type === 'YES/NO' || activity.type === 'boolean') return activity.status === 'Completed';
  const n = parseFloat(String(activity.progress ?? '').split('/')[0]);
  return Number.isFinite(n) && n > 0;
};
