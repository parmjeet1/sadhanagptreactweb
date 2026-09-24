import React, { useState } from "react";
import { Check } from "lucide-react";
import ActivityQuestion from "./inputs/ActivityQuestion";
import { PrimaryButton } from "./ChatButton";
import { formatValueForEcho, isFilled } from "../utils/activityHelpers";

/**
 * "Quick Fill All" — a single compact card listing every eligible active
 * activity with its own inline input. Answering one marks it done in place
 * (no separate chat bubble per activity, matching the spec's "compact
 * conversational form"). A Continue button lets the user move on once
 * they've filled as much as they want to right now.
 *
 * If the last remaining activity is filled in right here, the card
 * auto-advances (calling `onAllDone`) instead of waiting for a Continue
 * click — the marks + congratulations that follow (handled by the parent)
 * are the only thing the user needs to see at that point.
 */
export function QuickFillAllCard({ activities, todayMap, onActivitySubmit, onContinue, onAllDone }) {
  const [localDone, setLocalDone] = useState({}); // activity_id -> value, optimistic local echo

  const isDone = (activity, doneMap) =>
    isFilled(doneMap[activity.activity_id]) || isFilled(todayMap.get(activity.activity_id));

  const handleSubmit = async (activity, value) => {
    const newLocalDone = { ...localDone, [activity.activity_id]: value };
    setLocalDone(newLocalDone);
    await onActivitySubmit(activity, value, { silent: true });
    if (activities.every((a) => isDone(a, newLocalDone))) {
      onAllDone?.();
    }
  };

  const allFilled = activities.every((a) => isDone(a, localDone));

  return (
    <div className="bg-white border border-saffron-100 rounded-2xl p-3 animate-sadhna-in">
      <div className="flex flex-col divide-y divide-saffron-50">
        {activities.map((activity) => {
          const existingValue = todayMap.get(activity.activity_id);
          const done = isFilled(localDone[activity.activity_id]) || isFilled(existingValue);
          const displayValue = isFilled(localDone[activity.activity_id])
            ? localDone[activity.activity_id]
            : existingValue;

          return (
            <div key={activity.activity_id} className="py-3 first:pt-1 last:pb-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-saffron-900">{activity.name}</p>
                {done && (
                  <span className="flex items-center gap-1 text-leaf-500 text-xs font-medium">
                    <Check size={14} />
                    {formatValueForEcho(activity, displayValue)}
                  </span>
                )}
              </div>
              {!done && <ActivityQuestion activity={activity} onSubmit={(v) => handleSubmit(activity, v)} />}
            </div>
          );
        })}
      </div>
      {!allFilled && (
        <PrimaryButton className="w-full mt-3" onClick={onContinue}>
          Continue
        </PrimaryButton>
      )}
    </div>
  );
}

export default QuickFillAllCard;
