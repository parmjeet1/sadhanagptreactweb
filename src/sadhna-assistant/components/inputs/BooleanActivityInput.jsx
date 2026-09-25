import React from "react";
import { OptionChip, ChipRow } from "../ChatButton";

export function BooleanActivityInput({ activity, onSubmit }) {
  return (
    <ChipRow>
      <OptionChip onClick={() => onSubmit(true)}>Yes</OptionChip>
      <OptionChip onClick={() => onSubmit(false)}>Not Today</OptionChip>
    </ChipRow>
  );
}

export default BooleanActivityInput;
