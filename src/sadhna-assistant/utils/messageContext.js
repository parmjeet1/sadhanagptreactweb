import {
  wakeupSubcontext,
  isEarlyChantingCompletion,
  dayRestSubcontext,
} from "./activityHelpers";

const MANGAL_AARTI_SUBCONTEXT = {
  attended: "attended",
  online_or_home: "onlineHome",
  not_today: "notToday",
};

const KNOWN_CATEGORIES = new Set([
  "chanting",
  "chanting_completion_time",
  "wakeup",
  "hearing",
  "reading",
  "mangal_aarti",
  "day_rest",
  "sleep",
]);

/**
 * Resolves which (context, subcontext, vars) the message engine should use
 * for a just-submitted activity value. Known categories get their tailored
 * curated buckets; anything else (dynamically added / custom activities)
 * always resolves to the generic customActivity bucket, so new activities
 * never need a code change to get a sensible response.
 */
export function resolveMessageContext(activity, value) {
  const category = KNOWN_CATEGORIES.has(activity.category) ? activity.category : null;

  switch (category) {
    case "chanting": {
      const goal = activity.goal ?? Infinity;
      const num = Number(value);
      if (num >= goal) return { context: "chanting", subcontext: "goalComplete" };
      if (num > 0) return { context: "chanting", subcontext: "partial" };
      return { context: "chanting", subcontext: "notYet" };
    }
    case "chanting_completion_time": {
      return isEarlyChantingCompletion(value)
        ? { context: "chanting", subcontext: "earlyCompletion" }
        : { context: "chantingCompletionTime", subcontext: "recorded" };
    }
    case "wakeup":
      return { context: "wakeup", subcontext: wakeupSubcontext(value) };
    case "hearing": {
      const goal = activity.goal ?? Infinity;
      const num = Number(value);
      if (num <= 0) return { context: "hearing", subcontext: "notToday" };
      if (num >= goal) return { context: "hearing", subcontext: "complete" };
      return { context: "hearing", subcontext: "partial" };
    }
    case "reading": {
      const goal = activity.goal ?? Infinity;
      const num = Number(value);
      if (num <= 0) return { context: "reading", subcontext: "notToday" };
      if (num >= goal) return { context: "reading", subcontext: "complete" };
      return { context: "reading", subcontext: "partial" };
    }
    case "mangal_aarti":
      return {
        context: "mangalAarti",
        subcontext: MANGAL_AARTI_SUBCONTEXT[value] || "notToday",
      };
    case "day_rest":
      return { context: "dayRest", subcontext: dayRestSubcontext(value) };
    case "sleep":
      return { context: "sleep", subcontext: "recorded" };
    default:
      return {
        context: "customActivity",
        subcontext: "completed",
        vars: { activity: activity.name },
      };
  }
}

const STRONG_SUBCONTEXTS = new Set(["goalComplete", "complete", "earlyCompletion", "attended", "onlineHome"]);
const WEAK_SUBCONTEXTS = new Set(["partial", "notYet", "notToday"]);

/**
 * When several activities are saved from ONE chat message, we want a single
 * encouraging message, not one per activity. Picks the best-fitting
 * (context, subcontext, vars): a goal reached wins, then any ordinary
 * recorded entry, then a partial/zero one.
 */
export function pickCombinedContext(updates, activitiesById) {
  const resolved = [];
  for (const u of updates) {
    const activity = activitiesById[u.activity_id];
    if (activity) resolved.push(resolveMessageContext(activity, u.value));
  }
  if (resolved.length === 0) return { context: "genericSuccess" };
  if (resolved.length > 1 && resolved.every((r) => !STRONG_SUBCONTEXTS.has(r.subcontext) && !WEAK_SUBCONTEXTS.has(r.subcontext))) {
    return { context: "progress", subcontext: "thresholdReached" };
  }
  return (
    resolved.find((r) => STRONG_SUBCONTEXTS.has(r.subcontext)) ||
    resolved.find((r) => !WEAK_SUBCONTEXTS.has(r.subcontext)) ||
    resolved[0]
  );
}
