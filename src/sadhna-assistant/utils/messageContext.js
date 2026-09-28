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
