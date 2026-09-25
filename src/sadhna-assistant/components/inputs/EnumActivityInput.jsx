import React from "react";
import { OptionChip, ChipRow } from "../ChatButton";

/**
 * Renders an enum-type activity (e.g. Mangal Aarti) purely from
 * activity.options — never hard-coded option lists.
 */
export function EnumActivityInput({ activity, onSubmit }) {
  const options = activity.options ?? [];
  return (
    <ChipRow>
      {options.map((opt) => (
        <OptionChip key={opt.value} onClick={() => onSubmit(opt.value)}>
          {opt.label}
        </OptionChip>
      ))}
    </ChipRow>
  );
}

export default EnumActivityInput;
