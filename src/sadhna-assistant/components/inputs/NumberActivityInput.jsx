import React, { useState } from "react";
import { OptionChip, ChipRow, PrimaryButton, SecondaryButton } from "../ChatButton";

/**
 * Renders a number-type activity (e.g. Chanting rounds) as quick-pick chips
 * derived from activity.quickOptions, plus a "{max}+" chip, a "Not yet"
 * chip, and a manual-entry fallback. Nothing here is specific to any single
 * activity_id — it is entirely driven by the activity definition.
 */
export function NumberActivityInput({ activity, onSubmit }) {
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const quickOptions = activity.quickOptions ?? [];
  const maxQuick = quickOptions.length ? Math.max(...quickOptions) : undefined;

  const unitLabel = (n) => (activity.unit ? `${n} ${activity.unit}` : `${n}`);

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
          placeholder={activity.unit ? `Enter ${activity.unit}` : "Enter value"}
          className="w-28 px-3 py-2 rounded-xl border border-saffron-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
        />
        <PrimaryButton
          disabled={manualValue === ""}
          onClick={() => onSubmit(Number(manualValue))}
        >
          Save
        </PrimaryButton>
        <SecondaryButton onClick={() => setManualMode(false)}>Cancel</SecondaryButton>
      </div>
    );
  }

  return (
    <ChipRow>
      {quickOptions.map((opt) => (
        <OptionChip key={opt} onClick={() => onSubmit(opt)}>
          {unitLabel(opt)}
        </OptionChip>
      ))}
      {maxQuick !== undefined && (
        <OptionChip onClick={() => setManualMode(true)}>{unitLabel(maxQuick)}+</OptionChip>
      )}
      <OptionChip onClick={() => onSubmit(0)}>Not yet</OptionChip>
      <OptionChip onClick={() => setManualMode(true)}>Enter manually</OptionChip>
    </ChipRow>
  );
}

export default NumberActivityInput;
