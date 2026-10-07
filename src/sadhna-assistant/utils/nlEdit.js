// Small pure helpers for editing the chatbot's guess on the "I understood" card
// before saving. No React here so they are easy to test.

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Largest number accepted for an activity (a typo guard, not a sadhana rule). */
export function maxFor(activity) {
  if (activity?.category === "chanting") return 64; // rounds in a day
  if (activity?.type === "duration") return 720; // 12 hours, in minutes
  return 100000;
}

/** "" when the value is fine for this activity, otherwise a short reason. */
export function validateEditedValue(activity, value) {
  if (!activity) return "Pick an activity";
  switch (activity.type) {
    case "time":
      return typeof value === "string" && TIME_RE.test(value) ? "" : "Enter a time";
    case "boolean":
      return typeof value === "boolean" ? "" : "Choose Yes or No";
    case "enum":
      return Array.isArray(activity.options) && activity.options.some((o) => o.value === value) ? "" : "Choose an option";
    case "number":
    case "duration": {
      if (value === "" || value === null || value === undefined) return "Enter a number";
      const n = Number(value);
      if (!Number.isFinite(n)) return "Enter a number";
      if (n < 0) return "Can't be negative";
      if (n > maxFor(activity)) return `Too large (max ${maxFor(activity)})`;
      return "";
    }
    default:
      return String(value ?? "").trim() ? "" : "Enter a value";
  }
}

/** The value in the form the save call expects (numbers as numbers). */
export function coerceEditedValue(activity, value) {
  if (activity && (activity.type === "number" || activity.type === "duration")) return Number(value);
  return value;
}

/** True when a value typed for activity A can be kept if the row is switched to activity B. */
export function valueFitsActivity(from, to) {
  if (!from || !to) return false;
  if (from.type !== to.type) return false;
  if (from.type === "enum") {
    const a = (from.options || []).map((o) => o.value).sort().join("|");
    const b = (to.options || []).map((o) => o.value).sort().join("|");
    return a === b;
  }
  return true;
}

/** A starting value after switching to an activity whose old value does not fit. */
export function blankValueFor(activity) {
  if (!activity) return "";
  if (activity.type === "boolean") return true;
  if (activity.type === "enum") return activity.options?.[0]?.value ?? "";
  return "";
}

/** Ids picked on more than one ticked row. */
export function duplicateIds(rows) {
  const seen = new Set();
  const dup = new Set();
  for (const r of rows) {
    if (!r.on) continue;
    if (seen.has(r.activity_id)) dup.add(r.activity_id);
    seen.add(r.activity_id);
  }
  return dup;
}
