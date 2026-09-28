import React from "react";

/**
 * Vertical stack of full-width option buttons, used for the main menu,
 * fill-today submenu, and similar single-choice moments.
 */
export function MenuOptions({ options, onSelect, disabled = false }) {
  return (
    <div className="flex flex-col gap-2 mt-2 animate-sadhna-in">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt.value)}
          className="flex items-center gap-2.5 w-full text-left px-4 py-3 rounded-2xl bg-white border border-saffron-100
            hover:border-saffron-300 hover:bg-saffron-50 active:bg-saffron-100 transition-colors duration-150
            text-sm font-medium text-saffron-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

export default MenuOptions;
