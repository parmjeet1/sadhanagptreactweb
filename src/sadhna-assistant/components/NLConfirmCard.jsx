import React, { useState } from "react";
import { PrimaryButton, SecondaryButton, OptionChip } from "./ChatButton";
import { formatValueForEcho } from "../utils/activityHelpers";
import {
  validateEditedValue,
  coerceEditedValue,
  valueFitsActivity,
  blankValueFor,
  duplicateIds,
} from "../utils/nlEdit";

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

/** The little value editor for one row, chosen by the activity's type. */
function ValueEditor({ activity, value, onChange }) {
  if (activity.type === "time") {
    return (
      <input
        type="time"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-saffron-200 bg-white px-2 py-1 text-sm text-saffron-900"
      />
    );
  }
  if (activity.type === "boolean") {
    return (
      <div className="flex gap-2">
        <OptionChip selected={value === true} onClick={() => onChange(true)}>Yes</OptionChip>
        <OptionChip selected={value === false} onClick={() => onChange(false)}>Not Today</OptionChip>
      </div>
    );
  }
  if (activity.type === "enum") {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-saffron-200 bg-white px-2 py-1 text-sm text-saffron-900"
      >
        {(activity.options || []).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  if (activity.type === "number" || activity.type === "duration") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 rounded-lg border border-saffron-200 bg-white px-2 py-1 text-sm text-saffron-900"
        />
        {activity.unit && <span className="text-xs text-saffron-500">{activity.unit}</span>}
      </span>
    );
  }
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-saffron-200 bg-white px-2 py-1 text-sm text-saffron-900"
    />
  );
}

/**
 * Shown after adapter.interpretNaturalLanguage() returns an
 * "update_activities" intent. Nothing is saved yet — the user must
 * explicitly confirm before updateActivity()/updateActivityForDate() is
 * called for each update.
 *
 * Every line can be:
 *   - unticked (the guess was wrong, leave it out),
 *   - edited: tap the pencil to switch it to another of the student's own
 *     activities and/or change the value.
 * "Confirm & Save" then saves only the ticked, valid lines (onConfirm gets them).
 *
 * `dateLabel` (optional) shows which day this will be saved to when it
 * isn't today — e.g. "Yesterday (23/09/26)" — so a local guess that got the
 * DAY right but a VALUE wrong is still obvious before saving.
 * `missing` (optional) lists activities the student mentioned but does not have.
 * `onAskAI` (optional) re-runs the interpretation forcing the GPT-5 nano
 * path (skipping the fast local parser that produced this guess) when the
 * user isn't confident it's right, rather than just discarding it.
 */
export function NLConfirmCard({ updates, activitiesById, dateLabel, missing, onConfirm, onCorrect, onAskAI }) {
  const [rows, setRows] = useState(() =>
    updates
      .filter((u) => activitiesById[u.activity_id])
      .map((u, i) => ({ key: i, activity_id: u.activity_id, value: u.value, on: true, editing: false }))
  );
  const allActivities = Object.values(activitiesById);

  const patchRow = (key, patch) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const switchActivity = (row, newId) => {
    const from = activitiesById[row.activity_id];
    const to = activitiesById[newId];
    patchRow(row.key, {
      activity_id: newId,
      value: valueFitsActivity(from, to) ? row.value : blankValueFor(to),
    });
  };

  const dups = duplicateIds(rows);
  const problems = rows.map((r) => {
    if (!r.on) return "";
    if (dups.has(r.activity_id)) return "Same activity is ticked twice";
    return validateEditedValue(activitiesById[r.activity_id], r.value);
  });
  const ticked = rows.filter((r) => r.on);
  const hasProblem = rows.some((r, i) => r.on && problems[i]);
  const canConfirm = ticked.length > 0 && !hasProblem;

  const confirm = () => {
    if (!canConfirm) return;
    onConfirm(
      ticked.map((r) => ({
        activity_id: r.activity_id,
        value: coerceEditedValue(activitiesById[r.activity_id], r.value),
      }))
    );
  };

  return (
    <div className="bg-white border border-saffron-100 rounded-2xl p-4 animate-sadhna-in">
      <p className="text-sm font-medium text-saffron-900 mb-1">🙏 I understood:</p>
      <p className="text-[11px] text-saffron-500 mb-2">Untick a line that's wrong, or tap ✏️ to change it.</p>
      {dateLabel && (
        <p className="text-[11px] font-semibold text-saffron-500 mb-2">📅 Saving for {dateLabel}</p>
      )}
      <ul className="flex flex-col gap-2 mb-3">
        {rows.map((r, i) => {
          const activity = activitiesById[r.activity_id];
          if (!activity) return null;
          return (
            <li key={r.key} className={`rounded-xl border px-2.5 py-2 ${r.on ? "border-saffron-200 bg-white" : "border-saffron-100 bg-saffron-50/50"}`}>
              <div className="flex items-center gap-2 text-sm text-saffron-800">
                <input
                  type="checkbox"
                  checked={r.on}
                  onChange={(e) => patchRow(r.key, { on: e.target.checked })}
                  aria-label={`Include ${activity.name}`}
                  className="h-5 w-5 shrink-0 accent-saffron-500"
                />
                <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-x-2 ${r.on ? "" : "opacity-50 line-through"}`}>
                  <span>{CATEGORY_ICON[activity.category] || "✨"}</span>
                  <span className="font-medium">{activity.name}</span>
                  <span className="text-saffron-500">—</span>
                  <span>{validateEditedValue(activity, r.value) ? "?" : formatValueForEcho(activity, coerceEditedValue(activity, r.value))}</span>
                </div>
                <button
                  type="button"
                  onClick={() => patchRow(r.key, { editing: !r.editing })}
                  aria-label={`Edit ${activity.name}`}
                  className="shrink-0 rounded-lg px-2 py-1 text-base hover:bg-saffron-100"
                >
                  {r.editing ? "✔️" : "✏️"}
                </button>
              </div>
              {r.editing && (
                <div className="mt-2 flex flex-col gap-2 pl-7">
                  <select
                    value={r.activity_id}
                    onChange={(e) => switchActivity(r, e.target.value)}
                    className="rounded-lg border border-saffron-200 bg-white px-2 py-1 text-sm text-saffron-900"
                  >
                    {allActivities.map((a) => (
                      <option key={a.activity_id} value={a.activity_id}>{a.name}</option>
                    ))}
                  </select>
                  <ValueEditor activity={activity} value={r.value} onChange={(v) => patchRow(r.key, { value: v })} />
                </div>
              )}
              {r.on && problems[i] && <p className="mt-1 pl-7 text-[11px] font-medium text-red-600">⚠️ {problems[i]}</p>}
            </li>
          );
        })}
      </ul>
      {Array.isArray(missing) && missing.length > 0 && (
        <p className="text-[11px] text-saffron-700 bg-saffron-100 rounded-lg px-2 py-1 mb-3">
          ⚠️ Not in your list, so not saved: {missing.join(", ")}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={confirm} disabled={!canConfirm}>
          ✓ Confirm &amp; Save{ticked.length > 0 && ticked.length !== rows.length ? ` (${ticked.length})` : ""}
        </PrimaryButton>
        <SecondaryButton onClick={onCorrect}>✏️ Not this</SecondaryButton>
        {onAskAI && <SecondaryButton onClick={onAskAI}>🤖 Ask AI to re-check</SecondaryButton>}
      </div>
    </div>
  );
}

export default NLConfirmCard;
