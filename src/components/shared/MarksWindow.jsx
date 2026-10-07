import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  fetchMarksBreakdown,
  fetchDefaultRules,
  fetchMyScheme,
  switchMyScheme,
  saveMyScheme,
  deleteMyRule,
} from '../../api/myScheme';
import { groupRules, withoutIds, findProblem, toSavePayload, colorForPercent } from '../../utils/schemeRules';
import { SchemeRulesView, SchemeRulesEditor } from './SchemeRulesView';

/**
 * The window that opens when the Marks circle is tapped.
 *
 *  1st screen ("score"): Today's Sadhana Score. A small arrow beside the title opens the marks of each
 *     activity. Tapping the circle in the window goes to the second screen.
 *  2nd screen ("schemes"): "Default Scheme" | "Make Custom Scheme". Each shows its rules with an
 *     "All Activities" drop-down; the custom one can be created, edited and switched on or off.
 *
 * On a phone it is a sheet that rises from the bottom (thumb friendly, scrolls inside, never wider than
 * the screen); on a larger screen it is a centred card.
 */

const todayString = () => new Date().toLocaleDateString('en-CA');

const prettyDate = (yyyyMmDd) => {
  const d = new Date(`${yyyyMmDd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? yyyyMmDd : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const Chevron = ({ up }) => (
  <svg className={`w-4 h-4 transition-transform ${up ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
  </svg>
);

const ScoreRing = ({ percentage, onClick }) => {
  const { text, bar } = colorForPercent(percentage);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open the marking scheme"
      className="relative w-32 h-32 rounded-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] shadow-lg flex items-center justify-center active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-teal-500"
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" className="stroke-gray-100 dark:stroke-[#334155]" strokeWidth="7" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={bar} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className="relative flex flex-col items-center leading-none">
        <span className={`text-3xl font-black ${text}`}>{percentage}<span className="text-base">%</span></span>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Marks</span>
      </span>
    </button>
  );
};

const Notice = ({ notice }) =>
  notice ? (
    <p
      role="status"
      className={`text-xs font-semibold rounded-xl px-3 py-2 ${notice.type === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}
    >
      {notice.text}
    </p>
  ) : null;

const bigButton =
  'w-full py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition disabled:opacity-60';

const MarksWindow = ({ scoreData, activityDate, onClose, onChanged }) => {
  const date = activityDate || todayString();
  const percentage = scoreData?.percentage || 0;
  const earned = scoreData?.earnedMarks || 0;
  const max = scoreData?.maxMarks || 0;

  const [view, setView] = useState('score'); // 'score' | 'schemes'
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState('default'); // 'counsellor' | 'default' | 'custom'
  const [breakdown, setBreakdown] = useState({ status: 'idle', data: null });
  const [mine, setMine] = useState({ status: 'idle', data: null });
  const [defaults, setDefaults] = useState({ status: 'idle', groups: [] });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  // Esc closes. (The page is not locked with overflow:hidden: that removes the scrollbar, which makes the fixed
  // floating circles jump sideways.)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const loadBreakdown = useCallback(() => {
    setBreakdown((b) => ({ status: 'loading', data: b.data }));
    fetchMarksBreakdown(date).then((r) => setBreakdown(r.ok ? { status: 'ok', data: r.data } : { status: 'error', data: null }));
  }, [date]);

  const loadMine = useCallback(() => {
    setMine((m) => ({ status: 'loading', data: m.data }));
    return fetchMyScheme().then((r) => {
      setMine(r.ok ? { status: 'ok', data: r.data } : { status: 'error', data: null });
      return r;
    });
  }, []);

  const loadDefaults = useCallback(() => {
    setDefaults((d) => ({ status: 'loading', groups: d.groups }));
    fetchDefaultRules().then((r) =>
      setDefaults(r.ok ? { status: 'ok', groups: groupRules(r.data) } : { status: 'error', groups: [] })
    );
  }, []);

  // The activity-by-activity marks are asked for only when the arrow is opened (and again if it failed).
  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && (breakdown.status === 'idle' || breakdown.status === 'error')) loadBreakdown();
  };

  // The scheme screen needs my scheme and the default rules.
  const openSchemes = () => {
    setView('schemes');
    setNotice(null);
    if (mine.status === 'idle') {
      loadMine().then((r) => { if (r.ok && r.data?.counsellor_scheme) setTab('counsellor'); });
    }
    if (defaults.status === 'idle') loadDefaults();
  };

  const my = mine.data;
  const hasOwn = !!my?.scheme;
  const usingOwn = !!my?.using_own;
  const source = my?.applied_source || 'default';
  const counsellorScheme = source === 'group' || source === 'subgroup';
  const cs = my?.counsellor_scheme || null;
  const csGroups = useMemo(() => groupRules(cs?.rules || []), [cs]);
  const threeTabs = !!cs;
  const ownGroups = useMemo(() => groupRules(my?.rules || []), [my]);
  const addable = useMemo(
    () => defaults.groups.filter((g) => !draft.some((d) => d.key === g.key)),
    [defaults.groups, draft]
  );

  const afterChange = () => {
    if (onChanged) onChanged();
  };

  const switchTo = async (useOwn) => {
    setBusy(true);
    setNotice(null);
    const r = await switchMyScheme(useOwn);
    setBusy(false);
    if (!r.ok) { setNotice({ type: 'error', text: r.message }); return; }
    setNotice({ type: 'ok', text: r.message || (useOwn ? 'Your own marking scheme is now in use.' : 'You are using the default marking scheme.') });
    await loadMine();
    afterChange();
  };

  const startEditing = () => {
    setNotice(null);
    setDraft(hasOwn ? ownGroups.map((g) => ({ ...g, rows: g.rows.map((r) => ({ ...r })) })) : withoutIds(defaults.groups));
    setEditing(true);
  };

  const save = async () => {
    const problem = findProblem(draft);
    if (problem) { setNotice({ type: 'error', text: problem }); return; }
    if (draft.every((g) => g.rows.length === 0)) { setNotice({ type: 'error', text: 'Add at least one rule before saving.' }); return; }
    setBusy(true);
    setNotice(null);
    // Rules taken out of the draft are removed first, then everything else is saved.
    const keptIds = new Set(draft.flatMap((g) => g.rows.map((r) => r.ruleId).filter(Boolean)));
    const removed = ownGroups.flatMap((g) => g.rows.map((r) => r.ruleId).filter((id) => id && !keptIds.has(id)));
    for (const id of removed) {
      const del = await deleteMyRule(id);
      if (!del.ok) { setBusy(false); setNotice({ type: 'error', text: del.message }); return; }
    }
    const firstTime = !hasOwn;
    const r = await saveMyScheme(toSavePayload(draft), firstTime);
    setBusy(false);
    if (!r.ok) { setNotice({ type: 'error', text: r.message }); return; }
    setEditing(false);
    setNotice({ type: 'ok', text: firstTime ? 'Your custom scheme is saved and now in use.' : 'Your custom scheme is saved.' });
    await loadMine();
    afterChange();
  };

  const statusLine = counsellorScheme
    ? "Your counsellor's scheme is in use for you."
    : usingOwn
      ? 'You are using your own custom scheme.'
      : 'You are using the Default Scheme.';

  const isToday = date === todayString();
  const title = isToday ? "Today's Sadhana Score" : `Sadhana Score · ${prettyDate(date)}`;
  const customLabel = hasOwn ? 'My Custom Scheme' : 'Make Custom Scheme';

  const tabButton = (id, label) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => { setTab(id); setNotice(null); }}
      className={`flex-1 min-w-0 py-2.5 px-2 rounded-xl text-sm font-bold transition ${tab === id ? 'bg-teal-600 text-white shadow' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'}`}
    >
      {label}
    </button>
  );

  const body = (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={view === 'score' ? title : 'Marking scheme'}
        className="w-full sm:max-w-md bg-white dark:bg-[#0f172a] text-[#0F172A] dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700/80 flex flex-col max-h-[90vh] overflow-hidden"
        style={{ maxHeight: '90dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/10">
          {view === 'schemes' && (
            <button
              type="button"
              aria-label="Back to the score"
              onClick={() => { setView('score'); setEditing(false); setNotice(null); }}
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <h2 className="flex-1 min-w-0 font-bold text-base truncate">
            {view === 'score' ? title : 'Marking Scheme'}
          </h2>
          {view === 'score' && (
            <button
              type="button"
              aria-label="Show the marks of each activity"
              aria-expanded={expanded}
              onClick={toggleExpanded}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-white/10 active:scale-95"
            >
              <Chevron up={expanded} />
            </button>
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
          {view === 'score' && (
            <>
              <div className="flex flex-col items-center gap-2">
                <ScoreRing percentage={percentage} onClick={openSchemes} />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <span className="font-black text-lg text-[#0F172A] dark:text-white">{earned}</span> of {max} marks
                </p>
                <button
                  type="button"
                  onClick={openSchemes}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 px-3 py-1.5 rounded-full bg-teal-500/10"
                >
                  Tap the circle for the marking scheme ›
                </button>
              </div>

              {expanded && (
                <section aria-label="Marks of each activity" className="space-y-2">
                  {(breakdown.status === 'loading' || breakdown.status === 'idle') && !breakdown.data && (
                    <p className="text-sm text-center text-slate-500 py-3">Loading…</p>
                  )}
                  {breakdown.status === 'error' && (
                    <div className="text-center py-2">
                      <p className="text-sm text-red-500 mb-2">Could not load the activity marks.</p>
                      <button type="button" onClick={loadBreakdown} className="text-xs font-bold text-teal-600 dark:text-teal-400">Try again</button>
                    </div>
                  )}
                  {breakdown.data && breakdown.data.activities.length === 0 && (
                    <p className="text-sm text-center text-slate-500 py-3">No activities carry marks yet.</p>
                  )}
                  {breakdown.data && breakdown.data.activities.map((a) => {
                    const pct = a.max > 0 ? Math.max(0, Math.min(100, Math.round((a.earned / a.max) * 100))) : 0;
                    return (
                      <div key={a.activity_id} className="rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold min-w-0 truncate">{a.name}</span>
                          <span className="shrink-0 font-bold tabular-nums">{a.earned} <span className="text-slate-400 font-medium">/ {a.max}</span></span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden" aria-hidden="true">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colorForPercent(pct).bar }} />
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}
            </>
          )}

          {view === 'schemes' && (
            <>
              <div role="tablist" aria-label="Marking scheme" className="flex gap-2">
                {threeTabs && tabButton('counsellor', "Counsellor's")}
                {tabButton('default', threeTabs ? 'Default' : 'Default Scheme')}
                {tabButton('custom', threeTabs ? (hasOwn ? 'My Custom' : 'Custom') : customLabel)}
              </div>

              {mine.status === 'ok' && (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{statusLine}</p>
              )}
              {mine.status === 'error' && (
                <div className="text-center py-1">
                  <p className="text-sm text-red-500 mb-1">Could not load your scheme.</p>
                  <button type="button" onClick={loadMine} className="text-xs font-bold text-teal-600 dark:text-teal-400">Try again</button>
                </div>
              )}
              <Notice notice={notice} />

              {tab === 'counsellor' && cs && (
                <>
                  <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-3 text-sm text-[#0F172A] dark:text-white" data-testid="counsellor-note">
                    <p className="font-bold">Set by your counsellor{cs.counsellor?.name ? `: ${cs.counsellor.name}` : ''}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      This scheme can't be changed here. To change it, please contact your counsellor
                      {cs.counsellor?.email ? (
                        <>
                          {' '}at{' '}
                          <a href={`mailto:${cs.counsellor.email}`} className="font-bold text-teal-600 dark:text-teal-400 break-all underline">{cs.counsellor.email}</a>
                        </>
                      ) : null}.
                    </p>
                  </div>
                  <SchemeRulesView groups={csGroups} emptyText="Your counsellor's scheme has no rules yet." />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Activities not listed here use the Default Scheme.</p>
                </>
              )}

              {tab === 'default' && (
                <>
                  {defaults.status === 'loading' && !defaults.groups.length && <p className="text-sm text-center text-slate-500 py-3">Loading…</p>}
                  {defaults.status === 'error' && (
                    <div className="text-center py-2">
                      <p className="text-sm text-red-500 mb-2">Could not load the default scheme.</p>
                      <button type="button" onClick={loadDefaults} className="text-xs font-bold text-teal-600 dark:text-teal-400">Try again</button>
                    </div>
                  )}
                  {defaults.status === 'ok' && (
                    <SchemeRulesView groups={defaults.groups} emptyText="The default scheme has no rules yet." />
                  )}
                </>
              )}

              {tab === 'custom' && (
                <>
                  {!editing && !hasOwn && mine.status === 'ok' && (
                    <div className="text-center space-y-3 py-2">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Make your own marks for your activities. You start from the Default Scheme and change what you like; activities you leave out keep the default rules.
                      </p>
                      <button
                        type="button"
                        disabled={defaults.status !== 'ok' || busy}
                        onClick={startEditing}
                        className={`${bigButton} bg-gradient-to-r from-teal-500 to-emerald-600 text-white`}
                      >
                        Make Custom Scheme
                      </button>
                    </div>
                  )}

                  {!editing && hasOwn && (
                    <SchemeRulesView groups={ownGroups} emptyText="Your custom scheme has no rules yet." />
                  )}

                  {editing && (
                    <>
                      <SchemeRulesEditor groups={draft} onChange={setDraft} addable={addable} />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Activities you leave out use the Default Scheme.</p>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer actions (scheme screen only) */}
        {view === 'schemes' && mine.status === 'ok' && (
          <div className="px-4 pt-3 pb-4 border-t border-gray-100 dark:border-white/10 space-y-2">
            {tab === 'counsellor' && (
              <p className="text-sm text-center font-bold text-emerald-600 dark:text-emerald-400">✓ This scheme is in use for you</p>
            )}

            {tab === 'default' && (
              counsellorScheme ? (
                <p className="text-xs text-center text-slate-500">Your counsellor's scheme takes priority over this one.</p>
              ) : usingOwn ? (
                <button type="button" disabled={busy} onClick={() => switchTo(false)} className={`${bigButton} bg-teal-600 text-white`}>
                  {busy ? 'Please wait…' : 'Use Default Scheme'}
                </button>
              ) : (
                <p className="text-sm text-center font-bold text-emerald-600 dark:text-emerald-400">✓ Default Scheme is in use</p>
              )
            )}

            {tab === 'custom' && editing && (
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => { setEditing(false); setNotice(null); }} className={`${bigButton} bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200`}>
                  Cancel
                </button>
                <button type="button" disabled={busy} onClick={save} className={`${bigButton} bg-teal-600 text-white`}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}

            {tab === 'custom' && !editing && hasOwn && (
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={startEditing} className={`${bigButton} bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200`}>
                  Edit
                </button>
                {usingOwn ? (
                  <button type="button" disabled={busy} onClick={() => switchTo(false)} className={`${bigButton} bg-teal-600 text-white`}>
                    {busy ? 'Please wait…' : 'Use Default Instead'}
                  </button>
                ) : (
                  <button type="button" disabled={busy} onClick={() => switchTo(true)} className={`${bigButton} bg-teal-600 text-white`}>
                    {busy ? 'Please wait…' : 'Use My Scheme'}
                  </button>
                )}
              </div>
            )}
            {tab === 'custom' && !editing && hasOwn && counsellorScheme && (
              <p className="text-xs text-center text-slate-500">Your counsellor's scheme takes priority; yours applies again if it is removed.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(body, document.body);
};

export default MarksWindow;
