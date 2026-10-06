import React, { useMemo, useState } from 'react';
import { OPERATORS, describeCondition, maxOfGroup } from '../../utils/schemeRules';

/**
 * Shows the rules of a marking scheme: a drop-down ("All Activities" or one activity) and one card per
 * activity. Used read-only (default scheme, my own scheme, a counsellor looking at a student) and,
 * with `editable`, as the editor for my own scheme. Made to fit a phone: cards stack, inputs are 16px
 * so the phone does not zoom in, and nothing is wider than the screen.
 */

const selectClass =
  'w-full rounded-xl border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#0b1220] text-[#0F172A] dark:text-white text-base sm:text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500';
const inputClass =
  'w-full min-w-0 rounded-lg border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#0b1220] text-[#0F172A] dark:text-white text-base sm:text-sm px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500';

const fieldLabel = 'block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 truncate';

export const ActivityFilter = ({ groups, value, onChange }) => (
  <label className="block">
    <span className="sr-only">Show activity</span>
    <select
      aria-label="Show activity"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={selectClass}
    >
      <option value="all">All Activities</option>
      {groups.map((g) => (
        <option key={g.key} value={g.key}>
          {g.name}{g.frequency !== 'daily' ? ` (${g.frequency})` : ''}
        </option>
      ))}
    </select>
  </label>
);

const GroupHeader = ({ group }) => (
  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100 dark:border-white/10">
    <div className="flex items-center gap-2 min-w-0">
      <span className="w-8 h-8 shrink-0 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-base">{group.icon}</span>
      <div className="min-w-0">
        <p className="font-bold text-sm text-[#0F172A] dark:text-white truncate">{group.name}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{group.frequency}</p>
      </div>
    </div>
    <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
      Max {maxOfGroup(group)} pts
    </span>
  </div>
);

export const SchemeRulesView = ({ groups, emptyText = 'No rules to show.' }) => {
  const [filter, setFilter] = useState('all');
  // The filter may point at an activity that is no longer in the list (e.g. after switching scheme).
  const effectiveFilter = filter === 'all' || groups.some((g) => g.key === filter) ? filter : 'all';
  const shown = useMemo(
    () => (effectiveFilter === 'all' ? groups : groups.filter((g) => g.key === effectiveFilter)),
    [groups, effectiveFilter]
  );

  if (!groups.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">{emptyText}</p>;
  }
  return (
    <div className="space-y-3">
      <ActivityFilter groups={groups} value={effectiveFilter} onChange={setFilter} />
      {shown.map((g) => (
        <section key={g.key} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#132B5A]/60 p-3">
          <GroupHeader group={g} />
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {g.rows.map((r, i) => (
              <li key={`${r.ruleId ?? 'n'}_${i}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-[#334155] dark:text-gray-200 min-w-0 break-words">{describeCondition(r, g)}</span>
                <span className={`shrink-0 font-bold ${r.marks > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {r.marks} {r.marks === 1 ? 'pt' : 'pts'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

/**
 * Editor for my own scheme. `groups` is the working copy, `onChange` gets the new copy,
 * `addable` are the activities of the default scheme that my scheme does not have yet.
 */
export const SchemeRulesEditor = ({ groups, onChange, addable = [] }) => {
  const [filter, setFilter] = useState('all');
  const effectiveFilter = filter === 'all' || groups.some((g) => g.key === filter) ? filter : 'all';
  const shown = effectiveFilter === 'all' ? groups : groups.filter((g) => g.key === effectiveFilter);

  const updateGroup = (key, fn) => onChange(groups.map((g) => (g.key === key ? fn(g) : g)));
  const updateRow = (key, index, patch) =>
    updateGroup(key, (g) => ({ ...g, rows: g.rows.map((r, i) => (i === index ? { ...r, ...patch } : r)) }));
  const addRow = (key) =>
    updateGroup(key, (g) => ({ ...g, rows: [...g.rows, { ruleId: null, operator: '>=', value: '', marks: 0 }] }));
  const removeRow = (key, index) =>
    updateGroup(key, (g) => ({ ...g, rows: g.rows.filter((_, i) => i !== index) }));
  const addActivity = (key) => {
    const found = addable.find((g) => g.key === key);
    if (!found) return;
    onChange([...groups, { ...found, rows: found.rows.map((r) => ({ ...r, ruleId: null })) }]);
    setFilter(key);
  };

  return (
    <div className="space-y-3">
      <ActivityFilter groups={groups} value={effectiveFilter} onChange={setFilter} />

      {shown.map((g) => (
        <section key={g.key} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#132B5A]/60 p-3">
          <GroupHeader group={g} />
          <div className="space-y-2">
            {g.rows.map((r, i) => {
              const unit = String(g.unit || '').trim();
              const valueLabel = unit && !['time', 'count', 'boolean', 'yes/no', 'numb'].includes(unit.toLowerCase()) ? `Value (${unit})` : 'Value';
              return (
                <div key={`${r.ruleId ?? 'n'}_${i}`} className="rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Condition {i + 1}</span>
                    <button
                      type="button"
                      aria-label="Remove this condition"
                      onClick={() => removeRow(g.key, i)}
                      className="-mr-1 w-8 h-8 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 min-[380px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
                    <label className="min-w-0 col-span-2 min-[380px]:col-span-1">
                      <span className={fieldLabel}>When</span>
                      <select
                        aria-label="Condition"
                        value={r.operator}
                        onChange={(e) => updateRow(g.key, i, { operator: e.target.value })}
                        className={inputClass}
                      >
                        {OPERATORS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                      </select>
                    </label>
                    <label className="min-w-0">
                      <span className={fieldLabel}>{valueLabel}</span>
                      <input
                        aria-label="Value"
                        value={r.value}
                        onChange={(e) => updateRow(g.key, i, { value: e.target.value })}
                        placeholder={String(g.type).toLowerCase() === 'time' ? 'HH:MM' : 'Value'}
                        inputMode={String(g.type).toLowerCase() === 'time' ? 'text' : 'decimal'}
                        className={inputClass}
                      />
                    </label>
                    <label className="min-w-0">
                      <span className={`${fieldLabel} !text-emerald-600 dark:!text-emerald-400`}>Marks</span>
                      <input
                        aria-label="Marks"
                        value={r.marks}
                        onChange={(e) => updateRow(g.key, i, { marks: e.target.value.replace(/[^0-9]/g, '') })}
                        inputMode="numeric"
                        className={`${inputClass} text-center font-bold border-emerald-500/50`}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => addRow(g.key)}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 px-1 py-1"
            >
              + Add condition
            </button>
          </div>
        </section>
      ))}

      {addable.length > 0 && (
        <label className="block">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Add rules for another activity</span>
          <select
            aria-label="Add an activity"
            value=""
            onChange={(e) => addActivity(e.target.value)}
            className={`${selectClass} mt-1`}
          >
            <option value="">Choose an activity…</option>
            {addable.map((g) => (<option key={g.key} value={g.key}>{g.name}{g.frequency !== 'daily' ? ` (${g.frequency})` : ''}</option>))}
          </select>
        </label>
      )}
    </div>
  );
};
