import React, { useState } from "react";
import { PrimaryButton } from "../ChatButton";

export function TextActivityInput({ activity, onSubmit }) {
  const [value, setValue] = useState("");
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your answer..."
        className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-saffron-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
      />
      <PrimaryButton disabled={!value.trim()} onClick={() => onSubmit(value.trim())}>
        Save
      </PrimaryButton>
    </div>
  );
}

export default TextActivityInput;
