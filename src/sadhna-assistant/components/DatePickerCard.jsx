import React, { useState } from "react";
import { PrimaryButton } from "./ChatButton";
import { todayISO } from "../utils/dateHelpers";

/**
 * Single-date picker card, used by "Fill Sadhna on a Particular Date" ->
 * "Select a Date". Future dates are blocked (you can't log Sadhna that
 * hasn't happened yet) via the native input's `max` attribute.
 */
export function DatePickerCard({ onConfirm }) {
  const [date, setDate] = useState("");
  const max = todayISO();

  return (
    <div className="bg-white dark:bg-[#1e293b] border border-saffron-100 dark:border-slate-700 rounded-2xl p-3.5 animate-sadhna-in">
      <p className="text-sm font-medium text-saffron-900 dark:text-white mb-2">Pick a date</p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          autoFocus
          value={date}
          max={max}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-saffron-200 dark:border-slate-700 bg-white dark:bg-[#0b1628] text-gray-900 dark:text-white text-sm dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-saffron-300"
        />
        <PrimaryButton disabled={!date} onClick={() => onConfirm(date)}>
          Confirm
        </PrimaryButton>
      </div>
      <p className="text-[11px] text-saffron-400 dark:text-slate-500 mt-1.5">Future dates aren't available.</p>
    </div>
  );
}

export default DatePickerCard;
