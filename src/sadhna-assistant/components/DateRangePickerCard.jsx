import React, { useState } from "react";
import { PrimaryButton } from "./ChatButton";
import { todayISO, dateRangeLength, MAX_DATE_RANGE_DAYS } from "../utils/dateHelpers";

/**
 * Start/end date picker card for "Fill Same Sadhna for Certain Days". The
 * same values the user enters once (in the fill flow that follows) get
 * written to every date in this range. Future dates are blocked, and the
 * range is capped at MAX_DATE_RANGE_DAYS to avoid an accidental huge bulk
 * write (e.g. picking the wrong year for the end date).
 */
export function DateRangePickerCard({ onConfirm }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const max = todayISO();

  const handleConfirm = () => {
    if (!start || !end) return;
    if (start > end) {
      setError("The start date must be on or before the end date.");
      return;
    }
    const days = dateRangeLength(start, end);
    if (days > MAX_DATE_RANGE_DAYS) {
      setError(`Please pick ${MAX_DATE_RANGE_DAYS} days or fewer at a time (you picked ${days}).`);
      return;
    }
    setError("");
    onConfirm(start, end);
  };

  return (
    <div className="bg-white border border-saffron-100 rounded-2xl p-3.5 animate-sadhna-in">
      <p className="text-sm font-medium text-saffron-900 mb-2">Pick a date range</p>
      <div className="flex items-end gap-2 flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-saffron-500">From</span>
          <input
            type="date"
            value={start}
            max={max}
            onChange={(e) => setStart(e.target.value)}
            className="px-3 py-2 rounded-xl border border-saffron-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-saffron-500">To</span>
          <input
            type="date"
            value={end}
            max={max}
            onChange={(e) => setEnd(e.target.value)}
            className="px-3 py-2 rounded-xl border border-saffron-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-saffron-300"
          />
        </label>
        <PrimaryButton disabled={!start || !end} onClick={handleConfirm}>
          Confirm
        </PrimaryButton>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
      <p className="text-[11px] text-saffron-400 mt-1.5">
        Future dates aren't available, and a range can be at most {MAX_DATE_RANGE_DAYS} days.
      </p>
    </div>
  );
}

export default DateRangePickerCard;
