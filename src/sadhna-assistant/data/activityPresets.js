/**
 * activityPresets.js
 * ----------------------------------------------------------------------------
 * Optional preset configuration, keyed by `category` (NOT activity_id), for
 * activity types that benefit from richer quick-options than a bare
 * `quickOptions` numeric array can express.
 *
 * Time categories (wakeup, chanting_completion_time) offer EXACT time
 * quick-picks (e.g. "4:30 AM", "9:00 AM") rather than broad ranges —
 * tapping one submits that exact "HH:MM" value immediately, with no extra
 * confirmation step. "Enter Exact Time" is always offered alongside them
 * for anything not covered by the quick-picks.
 *
 * This keeps the special-cased UX from the spec (sections I, J, K) driven
 * by *configuration* rather than by hard-coding specific activity_ids
 * anywhere in the flow/rendering code. If a category isn't present here,
 * the input components fall back to fully generic behavior derived only
 * from the activity definition (type/unit/goal/quickOptions/options).
 */

export const TIME_CATEGORY_PRESETS = {
  wakeup: [
    { label: "3:30 AM", value: "03:30" },
    { label: "4:00 AM", value: "04:00" },
    { label: "4:30 AM", value: "04:30" },
    { label: "5:00 AM", value: "05:00" },
    { label: "5:30 AM", value: "05:30" },
  ],
  chanting_completion_time: [
    { label: "6:30 AM", value: "06:30" },
    { label: "7:00 AM", value: "07:00" },
    { label: "8:00 AM", value: "08:00" },
    { label: "9:00 AM", value: "09:00" },
    { label: "10:00 AM", value: "10:00" },
  ],
  sleep: [
    { label: "9:00 PM", value: "21:00" },
    { label: "9:30 PM", value: "21:30" },
    { label: "10:00 PM", value: "22:00" },
    { label: "10:30 PM", value: "22:30" },
    { label: "11:00 PM", value: "23:00" },
  ],
};

export const DURATION_CATEGORY_PRESETS = {
  day_rest: [
    { label: "No Day Rest", value: 0 },
    { label: "Less than 30 min", value: 15 },
    { label: "30–60 min", value: 45 },
    { label: "More than 60 min", value: 75 },
  ],
};
