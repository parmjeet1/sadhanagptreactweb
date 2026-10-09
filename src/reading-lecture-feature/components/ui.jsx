import React from 'react';
import { STATUS_LABEL } from '../data/mockData';

const STATUS_STYLE = {
  not_started: 'bg-gray-100 text-gray-500 border-gray-200',
  ongoing: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  skipped: 'bg-slate-100 text-slate-400 border-slate-200',
};

const STATUS_DOT = {
  not_started: 'bg-gray-300',
  ongoing: 'bg-amber-400',
  completed: 'bg-emerald-500',
  skipped: 'bg-slate-300',
};

/** Tap to move to the next status. */
export const StatusChip = ({ status, lang = 'en', onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold active:scale-95 transition-all ${STATUS_STYLE[status]}`}
  >
    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
    {STATUS_LABEL[status][lang]}
  </button>
);

export const NewBadge = () => (
  <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black tracking-wide">NEW</span>
);

/** Slide-up sheet used by the "add" forms. */
export const BottomSheet = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-[28px] p-6 pb-8 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-extrabold text-[#0f172a]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 font-black">×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Field = ({ label, children }) => (
  <label className="block mb-4">
    <span className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">{label}</span>
    {children}
  </label>
);

export const inputCls =
  'w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-[15px] font-semibold text-[#0f172a] outline-none focus:border-blue-400';

export const Toast = ({ toast, onUndo }) => {
  if (!toast) return null;
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[90] bg-[#1e293b] text-white text-[13px] font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-[90vw]">
      <span>{toast.message}</span>
      {toast.undo && (
        <button type="button" onClick={onUndo} className="text-amber-300 font-black">Undo</button>
      )}
    </div>
  );
};

/** Full-screen window (used for the counsellor's customise / status windows). */
export const FullWindow = ({ title, subtitle, onClose, right, children, footer }) => (
  <div className="fixed inset-0 z-[70] bg-[#f8fafc] flex flex-col">
    <div className="w-full max-w-md mx-auto flex flex-col h-full">
      <div className="px-5 pt-8 pb-3 flex items-center gap-3 border-b border-gray-100 bg-[#f8fafc]">
        <button type="button" onClick={onClose} aria-label="Back" className="w-10 h-10 shrink-0 rounded-full bg-white shadow-sm text-[#0f172a] font-black text-lg active:scale-90">←</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-extrabold text-[#0f172a] leading-tight truncate">{title}</h2>
          {subtitle && <p className="text-[12px] font-semibold text-gray-400 truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="px-5 py-4 border-t border-gray-100 bg-white">{footer}</div>}
    </div>
  </div>
);
