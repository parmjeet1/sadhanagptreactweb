import React, { useState } from "react";
import { OptionChip, ChipRow, PrimaryButton, SecondaryButton } from "../ChatButton";
import { DURATION_CATEGORY_PRESETS } from "../../data/activityPresets";

/**
 * Renders a duration-type activity (e.g. Hearing, Reading, Day Rest) as
 * quick-pick chips. If activity.quickOptions is present, chips are derived
 * from it (e.g. 15/30/45/60 min). Otherwise, if a category-level preset
 * exists (see activityPresets.js) — used for buckets like "30–60 min" that
 * a flat numeric list can't express — those are used instead. Falls back to
 * manual entry only.
 */
export function DurationActivityInput({ activity, onSubmit }) {
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const unit = activity.unit || "min";
  const quickOptions = activity.quickOptions ?? [];
  const categoryPresets = DURATION_CATEGORY_PRESETS[activity.category];

  if (manualMode) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min="0"
          autoFocus
          inputMode="numeric"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder={`Enter ${unit}`}
          className="w-28 px-3 py-2 rounded-xl border border-saffron-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
        />
        <PrimaryButton disabled={manualValue === ""} onClick={() => onSubmit(Number(manualValue))}>
          Save
        </PrimaryButton>
        <SecondaryButton onClick={() => setManualMode(false)}>Cancel</SecondaryButton>
      </div>
    );
  }

  if (quickOptions.length > 0) {
    return (
      <ChipRow>
        {quickOptions.map((opt) => (
          <OptionChip key={opt} onClick={() => onSubmit(opt)}>
            {opt} {unit}
          </OptionChip>
        ))}
        <OptionChip onClick={() => onSubmit(0)}>Not Today</OptionChip>
        <OptionChip onClick={() => setManualMode(true)}>Custom</OptionChip>
      </ChipRow>
    );
  }

  if (categoryPresets) {
    return (
      <ChipRow>
        {categoryPresets.map((p) => (
          <OptionChip key={p.label} onClick={() => onSubmit(p.value)}>
            {p.label}
          </OptionChip>
        ))}
        <OptionChip onClick={() => setManualMode(true)}>Exact Duration</OptionChip>
      </ChipRow>
    );
  }

  return (
    <ChipRow>
      <OptionChip onClick={() => onSubmit(0)}>None</OptionChip>
      <OptionChip onClick={() => setManualMode(true)}>Enter Duration</OptionChip>
    </ChipRow>
  );
}

export default DurationActivityInput;
