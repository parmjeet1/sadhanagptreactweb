import React from "react";

/**
 * Shared button styles used throughout the chat — quick-option chips and
 * primary/secondary action buttons. Kept in one place for visual
 * consistency across all activity input renderers.
 */

export function OptionChip({ children, onClick, selected = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors duration-150 whitespace-nowrap
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          selected
            ? "bg-saffron-500 border-saffron-500 text-white shadow-sm"
            : "bg-white border-saffron-200 text-saffron-800 hover:bg-saffron-50 active:bg-saffron-100"
        }`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-sm font-semibold bg-saffron-500 text-white shadow-sm
        hover:bg-saffron-600 active:bg-saffron-700 transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-sm font-medium bg-cream-200 text-saffron-800 border border-saffron-100
        hover:bg-saffron-50 active:bg-saffron-100 transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function ChipRow({ children }) {
  return <div className="flex flex-wrap gap-2 mt-2">{children}</div>;
}
