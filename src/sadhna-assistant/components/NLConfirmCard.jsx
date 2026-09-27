import React from "react";
import { PrimaryButton, SecondaryButton } from "./ChatButton";
import { formatValueForEcho } from "../utils/activityHelpers";

const CATEGORY_ICON = {
  chanting: "📿",
  chanting_completion_time: "📿",
  wakeup: "🌅",
  hearing: "🎧",
  reading: "📖",
  mangal_aarti: "🪔",
  day_rest: "😴",
  sleep: "🌙",
};

/**
 * Shown after adapter.interpretNaturalLanguage() returns an
 * "update_activities" intent. Nothing is saved yet — the user must
 * explicitly confirm before updateActivity()/updateActivityForDate() is
 * called for each update.
 *
 * `dateLabel` (optional) shows which day this will be saved to when it
 * isn't today — e.g. "Yesterday (23/09/26)" — so a local guess that got the
 * DAY right but a VALUE wrong is still obvious before saving.
 * `onAskAI` (optional) re-runs the interpretation forcing the GPT-5 nano
 * path (skipping the fast local parser that produced this guess) when the
 * user isn't confident it's right, rather than just discarding it.
 */
export function NLConfirmCard({ updates, activitiesById, dateLabel, onConfirm, onCorrect, onAskAI }) {
  return (
    <div className="bg-white border border-saffron-100 rounded-2xl p-4 animate-sadhna-in">
      <p className="text-sm font-medium text-saffron-900 mb-2">🙏 I understood:</p>
      {dateLabel && (
        <p className="text-[11px] font-semibold text-saffron-500 mb-2">📅 Saving for {dateLabel}</p>
      )}
      <ul className="flex flex-col gap-1.5 mb-3">
        {updates.map((u) => {
          const activity = activitiesById[u.activity_id];
          if (!activity) return null;
          return (
            <li key={u.activity_id} className="flex items-center gap-2 text-sm text-saffron-800">
              <span>{CATEGORY_ICON[activity.category] || "✨"}</span>
              <span className="font-medium">{activity.name}</span>
              <span className="text-saffron-500">—</span>
              <span>{formatValueForEcho(activity, u.value)}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={onConfirm}>✓ Confirm &amp; Save</PrimaryButton>
        <SecondaryButton onClick={onCorrect}>✏️ Not this</SecondaryButton>
        {onAskAI && <SecondaryButton onClick={onAskAI}>🤖 Ask AI to re-check</SecondaryButton>}
      </div>
    </div>
  );
}

export default NLConfirmCard;
