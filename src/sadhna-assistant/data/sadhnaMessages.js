/**
 * ============================================================================
 * sadhnaMessages.js — curated message library for SadhnaAssistant
 * ============================================================================
 *
 * Tone: ISKCON-friendly, warm, respectful, encouraging, peaceful, brief,
 * non-judgmental, devotional. Never shames, never claims to speak for
 * Krishna or Srila Prabhupada's personal approval, never treats low marks
 * as spiritual failure.
 *
 * Organized by context so callers can pick a relevant bucket and select a
 * message at random from it, rather than drawing from one giant undivided
 * list. Roughly 100-150 messages total across all buckets.
 *
 * Each entry is a plain string. Visual/animation pairing is handled by
 * getMessage() below, which returns { message, visual, animation }.
 */

export const SADHNA_MESSAGES = {
  genericSuccess: [
    "🌼 Recorded successfully.",
    "✨ Noted — thank you.",
    "Wonderful, that's been saved.",
    "🌼 Got it, recorded for today.",
    "Thank you — that's now part of today's Sadhna.",
    "✓ Saved. Every entry matters.",
  ],

  chanting: {
    goalComplete: [
      "Haribol! 📿 Your Japa goal is complete today. Keep taking shelter of Sri Harinama.",
      "Hari Haribol! Chanting completed. May the Holy Name remain at the centre of the day.",
      "Wonderful! Your chanting goal has been recorded. Keep this steady determination.",
      "Haribol! All your rounds are complete. Sri Harinama is most merciful.",
      "🌼 Japa goal reached! A beautiful offering of the day's first hours.",
    ],
    partial: [
      "8 rounds recorded. Keep going steadily. You can update the remaining rounds whenever you complete them.",
      "🌱 Rounds recorded so far. Continue at your own steady pace — there's no rush.",
      "Noted — some rounds chanted today. You can add more anytime before the day ends.",
      "Rounds recorded. Every round of the Holy Name is valuable, complete or not.",
      "🌱 Thank you for chanting today. Come back and update when you complete more.",
    ],
    notYet: [
      "🌱 No rounds recorded yet today. Whenever you're ready, the Holy Name is waiting.",
      "That's alright — you can chant and update this anytime today.",
      "🌱 Not yet recorded. Another quiet moment for Japa may come later today.",
    ],
    earlyCompletion: [
      "Haribol! Rounds completed early — a wonderful start to the day's Sadhna. 🌅",
      "🌅 Beautiful! Completing Japa early leaves the rest of the day free for other seva.",
      "Wonderful discipline — your chanting was finished early today. 📿🌅",
    ],
    normalCompletion: [
      "Haribol! Chanting completed for today. 📿",
      "🌼 Chanting recorded — thank you for this steady practice.",
      "Rounds complete. Keep taking shelter of the Holy Name.",
    ],
  },

  chantingCompletionTime: {
    recorded: [
      "🕐 Chanting completion time recorded. Thank you.",
      "Noted — thank you for sharing when your Japa was completed.",
      "🌼 Completion time recorded alongside your rounds.",
    ],
  },

  wakeup: {
    before4: [
      "Wonderful early start! 🌅 The morning hours offer a valuable opportunity for Japa and Sadhna.",
      "🌄 A beautiful, early rising. The stillness of Brahma-muhurta is a rare gift.",
      "Haribol! Rising before dawn sets a peaceful tone for the whole day.",
    ],
    fourToFive: [
      "🌼 Wake-up recorded. A beautiful time to begin the morning Sadhna.",
      "Noted — a good, steady time to rise and begin the day's practice.",
      "🌅 Wake-up time recorded. The morning is still fresh and quiet.",
    ],
    afterFive: [
      "🌱 Recorded. Every sunrise brings another fresh opportunity. Keep going steadily.",
      "Noted, thank you. Tomorrow is always another chance for an early start, if you'd like one.",
      "🌱 Wake-up time recorded — no need to worry, just keep the practice steady.",
    ],
  },

  hearing: {
    complete: [
      "🌼 Wonderful. 30 minutes of hearing recorded.",
      "Haribol! Hearing time recorded — nourishing for the mind and heart.",
      "🎧 Hearing recorded. Thank you for making time for this today.",
      "Beautiful — your hearing goal has been reached for today.",
    ],
    partial: [
      "🎧 Some hearing recorded today. You're welcome to add more whenever you like.",
      "Noted — hearing time recorded so far. Every bit adds up.",
      "🌱 Hearing recorded. You can continue later if you have time.",
    ],
    notToday: [
      "🌱 No hearing recorded yet today. There may still be time later.",
      "That's alright — hearing can be added anytime before the day ends.",
    ],
  },

  reading: {
    complete: [
      "📖 Wonderful. Today's reading has been recorded.",
      "Haribol! Reading time recorded — the scriptures nourish steady understanding.",
      "🌼 Reading recorded. Thank you for spending this time with the books.",
    ],
    partial: [
      "📖 Some reading recorded today. You can add more whenever convenient.",
      "Noted — reading time recorded so far.",
    ],
    notToday: [
      "🌱 No reading recorded yet today. There's still time if you'd like.",
      "That's alright — you can record reading anytime today.",
    ],
  },

  mangalAarti: {
    attended: [
      "Haribol! 🌼 Mangala-arati recorded. A beautiful beginning to the day's Sadhna.",
      "🪔 Wonderful — attending Mangala-arati sets a lovely tone for the day.",
      "Recorded, thank you. The morning arati is a special part of the day.",
    ],
    onlineHome: [
      "🏠 Mangala-arati (online/home) recorded. Thank you for joining in whatever way you could.",
      "Noted — attending from home still connects you to the morning offering. 🌼",
    ],
    notToday: [
      "🌱 Not recorded today. Every morning brings another opportunity. Rest well and make a fresh attempt tomorrow.",
      "That's alright — tomorrow's Mangala-arati is another chance. 🌱",
    ],
  },

  dayRest: {
    none: [
      "😴 No day rest recorded. Noted, thank you.",
      "Recorded — no rest taken today.",
    ],
    short: [
      "😴 A short rest recorded. Thank you for sharing.",
      "Noted — a brief rest today.",
    ],
    moderate: [
      "😴 Day rest recorded. Thank you.",
      "Noted, thank you — rest recorded for today.",
    ],
    long: [
      "😴 Day rest recorded. Thank you for sharing.",
      "Noted — a longer rest today. Every body has its own needs.",
    ],
  },

  sleep: {
    recorded: [
      "🌙 Sleep time recorded. Rest well.",
      "Noted — sleep time recorded for today.",
      "🌙 Thank you, that's been recorded.",
    ],
  },

  customActivity: {
    completed: [
      "🌼 {activity} recorded successfully.",
      "Wonderful! Your {activity} entry has been added.",
      "✨ {activity} is now recorded for today.",
      "Noted, thank you — {activity} has been saved.",
      "🌼 {activity} recorded. Thank you for sharing.",
    ],
    pending: [
      "{activity} hasn't been recorded yet. You can add it whenever you're ready.",
      "🌱 {activity} is still pending — no rush, add it anytime today.",
      "Still waiting on {activity}. It can be added later.",
    ],
  },

  progress: {
    thresholdReached: [
      "🌼 Here's how today looks so far.",
      "✨ Wonderful progress — here's where today's Sadhna stands.",
      "🌼 A snapshot of today's Sadhna so far.",
    ],
    improving: [
      "📈 A gentle rise from yesterday — steady progress.",
      "Today looks a little stronger than yesterday. Keep this rhythm going.",
      "🌼 Marks are trending upward. Wonderful consistency.",
    ],
    steady: [
      "Marks are steady with yesterday — a settled, consistent practice.",
      "About the same as yesterday. Steady practice is itself a quiet achievement.",
    ],
    lowerThanYesterday: [
      "A little lower than yesterday — that's alright, every day is its own offering.",
      "Today's marks are a bit less than yesterday. No concern — tomorrow is fresh.",
      "🌱 Slightly lower today. Sadhna naturally has its ebb and flow; keep going steadily.",
    ],
  },

  completion: {
    allComplete: [
      "Hari Haribol! Wonderful effort in your seva to Sri Guru and Gauranga today. Consistency in Sadhna is a beautiful practice. Keep this steady determination!",
      "Hare Krishna! Another day of Sadhna completed. May you continue steadily taking shelter of Sri Guru and Gauranga.",
      "Haribol! All of today's activities are recorded. Keep going steadily, one day of sincere Sadhna at a time.",
      "Wonderful! Today's Sadhna is fully updated. Keep taking shelter of the Holy Name and Srila Prabhupada's teachings.",
      "Hari Hari! Another complete Sadhna day has been recorded. Continue with enthusiasm, patience and steadiness.",
      "Hare Krishna! Today's devotional activities are all recorded. Keep your Sadhna steady and joyful.",
      "Beautiful! Your Sadhna record for today is complete. May this regularity help you protect your daily spiritual practices.",
      "Haribol! Hearing, chanting and the rest of today's Sadhna are recorded. Keep nourishing these devotional habits.",
      "Haribol! Another day of Sadhna recorded. Tomorrow brings another fresh opportunity for hearing and chanting.",
      "Wonderful! All your activities for today are recorded. Keep moving forward with patience and determination.",
      "🌸 Hari Haribol! Today's Sadhna is complete. A wonderful day of steady seva.",
      "Haribol! Every activity for today has found its place. Thank you for this sincere effort.",
      "Hare Krishna! Today's practice is complete — may tomorrow bring the same steadiness.",
      "🌸 All of today's Sadhna is recorded. This kind of daily regularity is itself a quiet victory.",
      "Wonderful! Today's devotional activities are complete. Keep this steady rhythm going, day by day.",
      "Haribol! A full day of Sadhna recorded. Srila Prabhupada emphasized exactly this kind of daily regularity.",
      "Hari Haribol! Everything is recorded for today. Rest well, knowing today's seva is offered.",
      "🌸 Today's Sadhna is complete — hearing, chanting and the rest of the day's practice all in place.",
    ],
    strongMorning: [
      "🌅 A strong morning today — early rising, Mangala-arati and Japa all in place. Beautiful start.",
      "Wonderful morning Sadhna today! These early hours set the tone for everything that follows.",
    ],
    chantingGoal: [
      "📿 Japa goal complete, and the rest of the day's Sadhna following steadily. Haribol!",
      "Wonderful — rounds complete and recorded well within the day. 📿",
    ],
    consistent: [
      "This kind of steady, day-after-day practice is exactly what nourishes Sadhna over time.",
      "Consistency like this, more than any single day, is what steadies devotional life.",
    ],
  },

  returning: [
    "Hare Krishna! Welcome back. 🙏",
    "Haribol! Good to see you again.",
    "🙏 Hare Krishna, how would you like to continue today?",
    "Welcome back — let's pick up where you left off.",
  ],

  pending: [
    "📋 A few activities are still waiting whenever you're ready.",
    "Some entries for today are still open — no rush at all.",
    "🌱 A couple of activities are pending. They'll be here whenever you have a moment.",
  ],

  milestones: {
    sevenDays: [
      "🌼 Seven days of Sadhna recorded in a row — a wonderful, steady rhythm.",
      "A full week of daily Sadhna tracked. This kind of consistency is precious.",
    ],
    thirtyDays: [
      "🌸 Thirty days of steady Sadhna — a beautiful milestone of regularity.",
      "A full month of daily practice recorded. Wonderful determination.",
    ],
    consistentReading: [
      "📖 Reading has been steady for several days now — a lovely habit forming.",
      "Consistent reading over recent days — the scriptures are becoming a daily companion.",
    ],
    earlyMorning: [
      "🌅 Several early mornings in a row — the Brahma-muhurta hours are becoming a habit.",
      "Consistent early rising this week — a wonderful foundation for the rest of Sadhna.",
    ],
  },

  thresholdBelow: [
    "🌱 Good beginning! {completed} of {total} activities are recorded.\n\nComplete one more activity to see today's Sadhna marks.",
    "🌱 A steady start — {completed} of {total} recorded so far.\n\nA little more and today's marks will be ready to show.",
  ],

  clarification: {
    generic: [
      "🙏 I want to make sure I record this correctly — could you clarify a little?",
      "Could you say that slightly differently so I record it accurately?",
    ],
  },
};

const PLACEHOLDER_RE = /\{(\w+)\}/g;

function fillTemplate(template, vars = {}) {
  if (!vars || Object.keys(vars).length === 0) return template;
  return template.replace(PLACEHOLDER_RE, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  );
}

function pickRandom(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function resolveBucket(context, subcontext) {
  const node = context ? SADHNA_MESSAGES[context] : undefined;
  if (!node) return null;
  if (Array.isArray(node)) return node;
  if (subcontext && node[subcontext]) return node[subcontext];
  return null;
}

/**
 * VISUAL_MAP — maps a (context, subcontext) pair to a sticker key and an
 * animation hint. The UI layer (visuals system) resolves the sticker key to
 * an actual illustration component. Unknown pairs fall back to a neutral
 * positive visual so custom/dynamic activities always render something
 * sensible without needing a new illustration per activity.
 */
const VISUAL_MAP = {
  "chanting.goalComplete": { visual: "japa_complete", animation: "gentle_sparkle" },
  "chanting.partial": { visual: "japa_beads", animation: "none" },
  "chanting.notYet": { visual: "sprout", animation: "none" },
  "chanting.earlyCompletion": { visual: "japa_sunrise", animation: "gentle_glow" },
  "chanting.normalCompletion": { visual: "japa_beads", animation: "soft_pop" },
  "chantingCompletionTime.recorded": { visual: "japa_beads", animation: "soft_pop" },

  "wakeup.before4": { visual: "sunrise", animation: "gentle_glow" },
  "wakeup.fourToFive": { visual: "sunrise", animation: "soft_pop" },
  "wakeup.afterFive": { visual: "sprout", animation: "none" },

  "hearing.complete": { visual: "headphones", animation: "soft_pop" },
  "hearing.partial": { visual: "headphones", animation: "none" },
  "hearing.notToday": { visual: "sprout", animation: "none" },

  "reading.complete": { visual: "book", animation: "soft_pop" },
  "reading.partial": { visual: "book", animation: "none" },
  "reading.notToday": { visual: "sprout", animation: "none" },

  "mangalAarti.attended": { visual: "diya", animation: "soft_pop" },
  "mangalAarti.onlineHome": { visual: "diya", animation: "none" },
  "mangalAarti.notToday": { visual: "sprout", animation: "none" },

  "dayRest.none": { visual: "moon", animation: "none" },
  "dayRest.short": { visual: "moon", animation: "none" },
  "dayRest.moderate": { visual: "moon", animation: "none" },
  "dayRest.long": { visual: "moon", animation: "none" },

  "sleep.recorded": { visual: "moon", animation: "none" },

  "customActivity.completed": { visual: "flower_check", animation: "soft_pop" },
  "customActivity.pending": { visual: "sprout", animation: "none" },

  "progress.thresholdReached": { visual: "marks_glow", animation: "gentle_glow" },
  "progress.improving": { visual: "growth", animation: "none" },
  "progress.steady": { visual: "growth", animation: "none" },
  "progress.lowerThanYesterday": { visual: "sprout", animation: "none" },

  "completion.allComplete": { visual: "lotus_sparkles", animation: "gentle_sparkle" },
  "completion.strongMorning": { visual: "japa_sunrise", animation: "gentle_glow" },
  "completion.chantingGoal": { visual: "japa_complete", animation: "gentle_sparkle" },
  "completion.consistent": { visual: "lotus_sparkles", animation: "none" },

  "returning.": { visual: "welcome", animation: "none" },
  "pending.": { visual: "sprout", animation: "none" },

  "milestones.sevenDays": { visual: "lotus_sparkles", animation: "gentle_sparkle" },
  "milestones.thirtyDays": { visual: "lotus_sparkles", animation: "gentle_sparkle" },
  "milestones.consistentReading": { visual: "book", animation: "none" },
  "milestones.earlyMorning": { visual: "sunrise", animation: "none" },

  "thresholdBelow.": { visual: "sprout", animation: "none" },

  "clarification.generic": { visual: "welcome", animation: "none" },
};

const FALLBACK_VISUAL = { visual: "flower_check", animation: "none" };

/**
 * getMessage(context, subcontext, vars?)
 *
 * Returns { message, visual, animation } — a message string picked from the
 * appropriate curated bucket (with {placeholders} filled in from `vars`),
 * plus a visual key and animation hint the UI can use independently of the
 * message text.
 *
 * For dynamically-added / unknown activities, callers should pass
 * context="customActivity", subcontext="completed"|"pending" and a
 * vars.activity name — this always resolves to a neutral positive visual
 * without requiring a bespoke illustration per activity.
 */
export function getMessage(context, subcontext, vars = {}) {
  const bucket = resolveBucket(context, subcontext);
  const template = pickRandom(bucket);
  const message = template
    ? fillTemplate(template, vars)
    : "🌼 Recorded, thank you.";

  const key = subcontext ? `${context}.${subcontext}` : `${context}.`;
  const visualInfo = VISUAL_MAP[key] || FALLBACK_VISUAL;

  return {
    message,
    visual: visualInfo.visual,
    animation: visualInfo.animation,
  };
}

export default SADHNA_MESSAGES;
