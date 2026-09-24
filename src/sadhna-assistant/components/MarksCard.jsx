import React from "react";
import Sticker from "./visuals/Sticker";
import SparkleBurst from "./visuals/SparkleBurst";

/**
 * Displays marks exactly as returned by adapter.getTodayMarks(). Never
 * invents or computes a score itself. `celebrate` triggers the brief
 * sparkle burst used for the all-complete state.
 */
export function MarksCard({ marksResponse, celebrate = false, onSparkleDone, title }) {
  const { marks, maxMarks, yesterdayMarks, completedCount, totalActiveCount } = marksResponse;
  const diff =
    typeof yesterdayMarks === "number" ? Math.round((marks - yesterdayMarks) * 10) / 10 : null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-cream-100 to-saffron-50 border border-saffron-200 rounded-2xl p-4 animate-sadhna-pop">
      <SparkleBurst active={celebrate} onDone={onSparkleDone} />
      <div className="flex items-center gap-3">
        <Sticker name={celebrate ? "lotus_sparkles" : "marks_glow"} size={44} animation={celebrate ? "gentle_sparkle" : "gentle_glow"} />
        <div>
          <p className="text-xs uppercase tracking-wide text-saffron-600 font-semibold">
            {title || "Today's Sadhna"}
          </p>
          <p className="text-2xl font-bold text-saffron-900 leading-tight">
            {marks}
            {maxMarks ? <span className="text-base font-medium text-saffron-500"> / {maxMarks}</span> : null}
            <span className="text-sm font-medium text-saffron-500"> Marks</span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-saffron-700">
        <span>
          {completedCount} of {totalActiveCount} activities recorded
        </span>
        {diff !== null && (
          <span className={diff >= 0 ? "text-leaf-500 font-medium" : "text-saffron-600 font-medium"}>
            Yesterday: {yesterdayMarks} · Today: {marks} {diff >= 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}
          </span>
        )}
      </div>
    </div>
  );
}

export default MarksCard;
