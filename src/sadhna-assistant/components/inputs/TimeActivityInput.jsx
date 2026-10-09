import React, { useState } from "react";
import { OptionChip, ChipRow, PrimaryButton, SecondaryButton } from "../ChatButton";
import { TIME_CATEGORY_PRESETS } from "../../data/activityPresets";

/**
 * Renders a time-type activity. When the activity's `category` has exact
 * time quick-picks configured (e.g. "wakeup" -> 3:30 / 4:00 / 4:30 / 5:00 /
 * 5:30 AM), those are offered as one-tap chips — tapping one submits that
 * exact value immediately, no extra confirmation step. "Enter Exact Time"
 * is always available alongside them (and is the only option for
 * categories without configured presets, e.g. Sleep Time).
 */
export function TimeActivityInput({ activity, onSubmit }) {
  const presets = TIME_CATEGORY_PRESETS[activity.category];
  const [exactMode, setExactMode] = useState(!presets);
  const [timeValue, setTimeValue] = useState("");

  if (exactMode) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <input
          type="time"
          autoFocus
          value={timeValue}
          onChange={(e) => setTimeValue(e.target.value)}
          className="px-3 py-2 rounded-xl border border-saffron-200 dark:border-[#304766] bg-white dark:bg-[#0B1220] text-gray-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300 dark:[color-scheme:dark]"
        />
        <PrimaryButton disabled={!timeValue} onClick={() => onSubmit(timeValue)}>
          Save
        </PrimaryButton>
        {presets && <SecondaryButton onClick={() => setExactMode(false)}>Cancel</SecondaryButton>}
      </div>
    );
  }

  return (
    <ChipRow>
      {presets.map((p) => (
        <OptionChip key={p.value} onClick={() => onSubmit(p.value)}>
          {p.label}
        </OptionChip>
      ))}
      <OptionChip onClick={() => setExactMode(true)}>🕐 Enter Exact Time</OptionChip>
    </ChipRow>
  );
}

export default TimeActivityInput;
