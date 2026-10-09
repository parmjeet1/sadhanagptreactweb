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
          className="flex items-center gap-2.5 w-full text-left px-4 py-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-saffron-100 dark:border-slate-700
            hover:border-saffron-300 dark:hover:border-slate-500 hover:bg-saffron-50 dark:hover:bg-slate-800 active:bg-saffron-100 dark:active:bg-slate-700 transition-colors duration-150
            text-sm font-medium text-saffron-900 dark:text-[#F8FAFC] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

export default MenuOptions;
