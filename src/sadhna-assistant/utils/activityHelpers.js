/** True if a recorded value counts as "filled" (not null/undefined/empty string). */
export function isFilled(value) {
  return value !== undefined && value !== null && value !== "";
}

/**
 * Whether a dependent activity (one with `dependsOn`) is currently eligible
 * to be asked about. Derived purely from configuration:
 *  - if the activity it depends on has a `goal`, the dependency must have
 *    reached that goal today
 *  - otherwise, the dependency just needs to be filled
 * Activities without `dependsOn` are always eligible.
 */
export function isEligible(activity, todayMap, activitiesById) {
  if (!activity.dependsOn) return true;
  const dep = activitiesById[activity.dependsOn];
  const depValue = todayMap.get(activity.dependsOn);
  if (!dep || !isFilled(depValue)) return false;
  if (dep.goal !== undefined && dep.goal !== null) {
    return Number(depValue) >= Number(dep.goal);
  }
  return true;
}

/** Builds a lookup map activity_id -> ActivityDefinition. */
export function indexById(activities) {
  const map = {};
  for (const a of activities) map[a.activity_id] = a;
  return map;
}

/**
 * Orders activities so that any activity with `dependsOn` is placed
 * immediately after the activity it depends on. Keeps everything else in
 * its original order.
 */
export function orderWithDependents(activities) {
  const byId = indexById(activities);
  const placed = new Set();
  const result = [];

  function place(activity) {
    if (placed.has(activity.activity_id)) return;
    placed.add(activity.activity_id);
    result.push(activity);
    const dependents = activities.filter((a) => a.dependsOn === activity.activity_id);
    for (const dep of dependents) place(dep);
  }

  for (const a of activities) {
    if (a.dependsOn && byId[a.dependsOn]) continue; // will be placed via its parent
    place(a);
  }
  // safety net for any orphaned dependents (dependsOn points to inactive/missing activity)
  for (const a of activities) place(a);

  return result;
}

/** Active activities the user still has not filled in today. */
export function getPendingActivities(activities, todayMap) {
  return activities.filter((a) => !isFilled(todayMap.get(a.activity_id)));
}

/** Active activities the user has already filled in today. */
export function getCompletedActivities(activities, todayMap) {
  return activities.filter((a) => isFilled(todayMap.get(a.activity_id)));
}

/**
 * completionRatio = completed active activities / total active activities.
 * Marks become visible once this crosses 50% (Math.ceil-based threshold),
 * matching the spec exactly (never hard-coded to "4 of 7").
 */
export function getCompletionStatus(activities, todayMap) {
  const total = activities.length;
  const completed = getCompletedActivities(activities, todayMap).length;
  const threshold = Math.ceil(total * 0.5);
  return {
    total,
    completed,
    threshold,
    marksVisible: completed >= threshold,
    allComplete: total > 0 && completed === total,
  };
}

function minutesFromTimeString(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Formats a 24-hour "HH:MM" string as a friendly 12-hour time, e.g. "4:30 AM". */
export function formatTime12h(hhmm) {
  if (typeof hhmm !== "string" || !/^\d{2}:\d{2}$/.test(hhmm)) return String(hhmm);
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Formats a value for a short "echo" bubble showing what the user picked. */
export function formatValueForEcho(activity, value) {
  if (activity.type === "enum") {
    const opt = activity.options?.find((o) => o.value === value);
    return opt ? opt.label : String(value);
  }
  if (activity.type === "time") {
    return formatTime12h(value);
  }
  if (activity.type === "boolean") return value ? "Yes" : "Not Today";
  if (activity.type === "number" || activity.type === "duration") {
    if (Number(value) === 0) return "Not Today";
    return activity.unit ? `${value} ${activity.unit}` : String(value);
  }
  return String(value);
}

/** Resolves a wakeup "HH:MM" value to a message-engine subcontext. */
export function wakeupSubcontext(value) {
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) {
    const mins = minutesFromTimeString(value);
    if (mins < 240) return "before4";
    if (mins < 300) return "fourToFive";
    return "afterFive";
  }
  return "afterFive";
}

/** Resolves a chanting-completion-time "HH:MM" value to "early" vs "normal" (before 8 AM = early). */
export function isEarlyChantingCompletion(value) {
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) {
    return minutesFromTimeString(value) < 480;
  }
  return false;
}

/** Resolves a day_rest numeric minute value into none/short/moderate/long. */
export function dayRestSubcontext(minutes) {
  const n = Number(minutes);
  if (!n || n <= 0) return "none";
  if (n < 30) return "short";
  if (n <= 60) return "moderate";
  return "long";
}
