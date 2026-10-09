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
        className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-saffron-200 dark:border-[#304766] bg-white dark:bg-[#0B1220] text-gray-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300 dark:[color-scheme:dark]"
      />
      <PrimaryButton disabled={!value.trim()} onClick={() => onSubmit(value.trim())}>
        Save
      </PrimaryButton>
    </div>
  );
}

export default TextActivityInput;
