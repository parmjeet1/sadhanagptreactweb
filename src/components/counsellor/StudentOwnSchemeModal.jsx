import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchStudentOwnScheme } from '../../api/myScheme';
import { groupRules } from '../../utils/schemeRules';
import { SchemeRulesView } from '../shared/SchemeRulesView';

/**
 * Read-only window for a counsellor: the custom ("My Marking Scheme") rules of one student, opened from the
 * "Own scheme" tag on the rankings screen. Nothing can be changed here. On a phone it is a bottom sheet.
 */
const StudentOwnSchemeModal = ({ studentId, studentName, onClose }) => {
  const [state, setState] = useState({ status: 'loading', data: null, message: '' });

  useEffect(() => {
    let cancelled = false;
    fetchStudentOwnScheme(studentId).then((r) => {
      if (!cancelled) setState(r.ok ? { status: 'ok', data: r.data, message: '' } : { status: 'error', data: null, message: r.message });
    });
    return () => { cancelled = true; };
  }, [studentId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [onClose]);

  const groups = useMemo(() => groupRules(state.data?.rules || []), [state.data]);
  const overridden = !!state.data?.overridden;
  const using = !!state.data?.using_own;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${studentName || 'Student'}'s own marking scheme`}
        className="w-full sm:max-w-md bg-white dark:bg-[#0f172a] text-[#0F172A] dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700/80 flex flex-col max-h-[90vh] overflow-hidden"
        style={{ maxHeight: '90dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/10">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base truncate">{studentName || 'Student'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Own marking scheme (view only)</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
          {state.status === 'loading' && <p className="text-sm text-center text-slate-500 py-4">Loading…</p>}
          {state.status === 'error' && <p className="text-sm text-center text-red-500 py-4">{state.message}</p>}
          {state.status === 'ok' && (
            <>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {overridden
                  ? "A counsellor's group scheme is in use for this student; the own scheme applies again if it is removed."
                  : using
                    ? 'This student is scored with their own scheme.'
                    : 'This student is using the Default Scheme.'}
              </p>
              <SchemeRulesView groups={groups} emptyText="This student has not made a custom scheme." />
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StudentOwnSchemeModal;
