// src/pages/counsellor/marking-scheme/AddRulesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getActivities, getSchemes, getSchemeActivities, saveScheme } from '../../../api/markingSchemes';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, className = 'w-5 h-5' }) => {
  const icons = {
    back:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />,
    plus:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}   d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    save:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}   d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />,
    spark: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}   d="M13 10V3L4 14h7v7l9-11h-7z" />,
    eye:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}   d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    info:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}   d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}   d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  );
};

// ─── DB-aligned operator options ──────────────────────────────────────────────
// Maps to marking_rules.condition_operator enum
const OPERATORS = [
  { value: '>=', label: 'At Least (≥)',    needsValue: true,  placeholder: 'e.g. 16' },
  { value: '<=', label: 'Up To (≤)',       needsValue: true,  placeholder: 'e.g. 30' },
  { value: '>',  label: 'More Than (>)',   needsValue: true,  placeholder: 'e.g. 10' },
  { value: '<',  label: 'Less Than (<)',   needsValue: true,  placeholder: 'e.g. 5'  },
  { value: '=',  label: 'Exactly (=)',     needsValue: true,  placeholder: 'e.g. 16' },
  { value: '',   label: 'Completed / Yes', needsValue: false, placeholder: ''         },
];

// ─── Unit meta — maps activities.unit to input behaviour ─────────────────────
// unit enum: 'min','rounds','page','time','boolean','hours'
const UNIT_META = {
  min:     { inputType: 'number', placeholder: 'e.g. 30',    label: 'min',    hideOperator: false },
  rounds:  { inputType: 'number', placeholder: 'e.g. 16',    label: 'rounds', hideOperator: false },
  page:    { inputType: 'number', placeholder: 'e.g. 5',     label: 'pages',  hideOperator: false },
  hours:   { inputType: 'number', placeholder: 'e.g. 2',     label: 'hrs',    hideOperator: false },
  time:    { inputType: 'time',   placeholder: 'HH:MM',      label: 'time',   hideOperator: false },
  boolean: { inputType: 'bool',   placeholder: '',            label: '',       hideOperator: true  },
};
const getUnitMeta = (unit) => UNIT_META[unit] || { inputType: 'text', placeholder: 'value', label: unit || '', hideOperator: false };

// Maps to marking_rules.frequency enum
const FREQUENCIES = [
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
];

const FREQ_COLOR = {
  daily:   'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  weekly:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  monthly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

// ─── Empty condition row factory ──────────────────────────────────────────────
const emptyRow = () => ({ operator: '>=', condValue: '', marks: 25, frequency: 'daily' });

// ─── Badge ───────────────────────────────────────────────────────────────────
const Badge = ({ label, color = 'teal' }) => {
  const colors = {
    teal:   'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[color] || colors.teal}`}>
      {label}
    </span>
  );
};

// ─── Select component (shared style) ─────────────────────────────────────────
const Sel = ({ value, onChange, children, className = '' }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className={`w-full appearance-none bg-white dark:bg-[#112240] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-[13px] font-semibold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500 pr-8 ${className}`}
    >
      {children}
    </select>
    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const AddRulesPage = () => {
  const { schemeId } = useParams();
  const navigate = useNavigate();

  const [schemeName, setSchemeName]       = useState('');
  const [allActivities, setAllActivities] = useState([]);
  const [existingRules, setExistingRules] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [isSaving, setIsSaving]           = useState(false);
  const [toast, setToast]                 = useState(null);

  // Draft rules list (built up before saving)
  const [draftRules, setDraftRules] = useState([]);
  // {id, activityId, activityName, activityIcon, operator, condValue, marks, frequency}

  // Active form state
  const [formActivity, setFormActivity] = useState('');
  const [condRows, setCondRows] = useState([emptyRow()]);
  const [selectedUnit, setSelectedUnit] = useState(''); // unit of the selected activity

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const resSchemes = await getSchemes(true);
        const scheme = resSchemes?.schemes?.find(s => String(s.id) === String(schemeId));
        setSchemeName(scheme?.name || `Scheme #${schemeId}`);

        const resAct = await getActivities(schemeId);
        setAllActivities(resAct?.activities || []);

        const resRules = await getSchemeActivities(schemeId);
        setExistingRules(resRules?.activities || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [schemeId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Condition row helpers ─────────────────────────────────────────────────
  const addCondRow    = ()               => setCondRows(p => [...p, emptyRow()]);
  const removeCondRow = (i)              => setCondRows(p => p.filter((_, idx) => idx !== i));
  const updateCondRow = (i, field, val)  => setCondRows(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  // When activity changes, reset condRows with proper defaults for that unit
  const handleActivityChange = (actId) => {
    setFormActivity(actId);
    const act = allActivities.find(a => String(a.id) === String(actId));
    const unit = act?.unit || '';
    setSelectedUnit(unit);
    const meta = getUnitMeta(unit);
    // For boolean unit, operator is irrelevant — default to empty; default condValue to 'true'
    setCondRows([{
      operator:  meta.hideOperator ? '' : '>=',
      condValue: meta.inputType === 'bool' ? 'true' : '',
      marks:     25,
      frequency: 'daily',
    }]);
  };

  // ── Add to draft list ─────────────────────────────────────────────────────
  const handleAddToDraft = () => {
    if (!formActivity) {
      showToast('Please select an activity.', 'error');
      return;
    }
    const actInfo = allActivities.find(a => String(a.id) === String(formActivity));
    if (!actInfo) return;

    for (const row of condRows) {
      const op = OPERATORS.find(o => o.value === row.operator);
      if (op?.needsValue && !String(row.condValue).trim()) {
        showToast('Please fill in all condition values.', 'error');
        return;
      }
      if (!row.marks && row.marks !== 0) {
        showToast('Please enter marks for each condition row.', 'error');
        return;
      }
    }

    const newRules = condRows.map(row => ({
      id: Date.now() + Math.random(),
      activityId:   actInfo.id,
      activityName: actInfo.name || actInfo.title,
      activityIcon: actInfo.icon || '🎯',
      operator:    row.operator,
      condValue:   String(row.condValue).trim(),
      marks:       Number(row.marks),
      frequency:   row.frequency,
    }));

    setDraftRules(p => [...p, ...newRules]);
    setCondRows([emptyRow()]);
    showToast(`${newRules.length} rule${newRules.length !== 1 ? 's' : ''} added for ${actInfo.name || actInfo.title}!`);
  };

  const removeDraftRule = (id) => setDraftRules(p => p.filter(r => r.id !== id));

  // ── Save all drafts ───────────────────────────────────────────────────────
  const handleSaveAll = async () => {
    if (!draftRules.length) { showToast('No rules to save.', 'error'); return; }
    setIsSaving(true);
    try {
      // Group by activity into the format saveScheme expects
      const grouped = {};
      for (const rule of draftRules) {
        const key = String(rule.activityId);
        if (!grouped[key]) {
          grouped[key] = {
            id: rule.activityId,
            title: rule.activityName,
            icon: rule.activityIcon,
            maxMarks: 0,
            badge: rule.frequency,
            rows: [],
          };
        }
        // Build condition string that backend parser can read
        const condStr = rule.operator
          ? `${rule.operator} ${rule.condValue}`
          : rule.condValue || 'Completed';
        grouped[key].rows.push({ condition: condStr, marks: rule.marks, frequency: rule.frequency });
        grouped[key].maxMarks = Math.max(grouped[key].maxMarks, rule.marks);
      }

      // Merge existing scheme activities so we don't wipe them
      for (const act of existingRules) {
        const key = String(act.id).split('_')[0];
        if (!grouped[key]) {
          grouped[key] = {
            id: act.id, title: act.title, icon: act.icon || '🎯',
            maxMarks: act.maxMarks, badge: act.badge || 'daily',
            rows: act.rows || [],
          };
        } else {
          grouped[key].rows = [...(act.rows || []), ...grouped[key].rows];
          grouped[key].maxMarks = Math.max(grouped[key].maxMarks, act.maxMarks);
        }
      }

      await saveScheme(schemeName, Object.values(grouped), Number(schemeId), false);

      // Reload saved rules so summary panel reflects the new state
      const resRules = await getSchemeActivities(schemeId);
      setExistingRules(resRules?.activities || []);

      // Clear drafts — stay on this page so user can keep adding more rules
      setDraftRules([]);
      setCondRows([emptyRow()]);
      setFormActivity('');
      setSelectedUnit('');

      showToast('✅ Rules saved! Add more or go back when done.');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedAct = allActivities.find(a => String(a.id) === String(formActivity));

  const summaryMap = (() => {
    const m = {};
    for (const act of existingRules)
      m[String(act.id).split('_')[0]] = { name: act.title, icon: act.icon || '🎯', saved: true };
    for (const r of draftRules)
      if (!m[String(r.activityId)])
        m[String(r.activityId)] = { name: r.activityName, icon: r.activityIcon, saved: false };
    return m;
  })();

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A192F] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-slate-400 dark:text-[#6b7a99]">Loading scheme...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A192F] font-sans pb-24">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-2xl text-[13px] font-semibold flex items-center gap-2 animate-fade-in ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-teal-600 dark:bg-[#1de9b6] text-white dark:text-[#042C53]'
        }`}>
          <Icon name={toast.type === 'error' ? 'info' : 'check'} className="w-4 h-4" />
          {toast.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A192F]/80 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/counsellor/marking-scheme/${schemeId}`)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-[#6b7a99] hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.06)] active:scale-90 transition-all"
            >
              <Icon name="back" />
            </button>
            <div>
              <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] dark:text-white leading-tight">
                Add Grading Rules
              </h1>
              <p className="text-[11px] font-semibold text-teal-600 dark:text-[#1de9b6] mt-0.5">{schemeName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {draftRules.length > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-[12px] font-semibold text-slate-500 dark:text-[#6b7a99] bg-slate-100 dark:bg-[rgba(255,255,255,0.06)] px-3 py-1.5 rounded-full">
                <Icon name="spark" className="w-3.5 h-3.5 text-amber-500" />
                {draftRules.length} pending
              </span>
            )}
            <button
              onClick={handleSaveAll}
              disabled={isSaving || !draftRules.length}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] rounded-xl text-[13px] font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Icon name="save" className="w-4 h-4" />}
              Save Rules
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* ── LEFT ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* ── Card: Rule Builder ─────────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-sm border border-gray-100 dark:border-[rgba(255,255,255,0.06)] overflow-hidden">

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[rgba(255,255,255,0.06)] bg-slate-50 dark:bg-[#0d1e3a]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                  <span className="text-[13px]">📋</span>
                </div>
                <h2 className="text-[14px] font-bold text-[#0F172A] dark:text-white">Add New Grading Rule</h2>
              </div>
              {selectedAct && (
                <span className="text-[11px] font-semibold text-teal-600 dark:text-[#1de9b6]">
                  {selectedAct.icon || '🎯'} {selectedAct.name || selectedAct.title}
                </span>
              )}
            </div>

            <div className="p-5 flex flex-col gap-5">

              {/* Activity selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase tracking-wider mb-1.5">
                  Select Activity
                </label>
                <div className="relative">
                  <select
                    value={formActivity}
                    onChange={e => handleActivityChange(e.target.value)}
                    className="w-full appearance-none bg-slate-50 dark:bg-[#0b1628] border-2 border-gray-200 dark:border-[rgba(255,255,255,0.08)] focus:border-teal-500 dark:focus:border-[#1de9b6] rounded-xl px-4 py-3 text-[14px] font-semibold text-[#0F172A] dark:text-white outline-none transition-all cursor-pointer pr-10"
                  >
                    <option value="">-- Click to select activity --</option>
                    {allActivities.map(act => (
                      <option key={act.id} value={act.id}>
                        {act.icon ? `${act.icon} ` : ''}{act.name || act.title}{act.unit ? ` (${act.unit})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {/* Unit badge shown after selecting */}
                {selectedUnit && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-[#4b5a7a] uppercase">Unit:</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                      {selectedUnit}
                    </span>
                    {selectedUnit === 'boolean' && (
                      <span className="text-[10px] text-slate-400 dark:text-[#4b5a7a] ml-1">→ Yes / No condition</span>
                    )}
                    {selectedUnit === 'time' && (
                      <span className="text-[10px] text-slate-400 dark:text-[#4b5a7a] ml-1">→ HH:MM format</span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Condition rows ─────────────────────────────────────────── */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase tracking-wider mb-1.5">
                  Set Conditions
                </label>

                <div className="flex flex-col gap-3">
                  {condRows.map((row, idx) => {
                    const unitMeta = getUnitMeta(selectedUnit);
                    const opDef    = OPERATORS.find(o => o.value === row.operator);
                    return (
                      <div key={idx} className="bg-slate-50 dark:bg-[#0b1628] rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.06)] p-4">

                        {/* Row 1: Operator + Value + Marks */}
                        <div className="flex flex-wrap items-end gap-3">

                          {/* Condition type — hidden for boolean */}
                          {!unitMeta.hideOperator && (
                            <div className="flex-1 min-w-[160px]">
                              <label className="block text-[10px] font-bold text-slate-400 dark:text-[#4b5a7a] uppercase mb-1">
                                Condition Type
                              </label>
                              <Sel value={row.operator} onChange={e => updateCondRow(idx, 'operator', e.target.value)}>
                                {OPERATORS.filter(op => op.value !== '').map(op => (
                                  <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                              </Sel>
                            </div>
                          )}

                          {/* Value input — varies by unit */}
                          {(unitMeta.hideOperator || opDef?.needsValue) && (
                            <div className="flex-1 min-w-[120px]">
                              <label className="block text-[10px] font-bold text-slate-400 dark:text-[#4b5a7a] uppercase mb-1">
                                Value{unitMeta.label ? ` (${unitMeta.label})` : ''}
                              </label>

                              {/* boolean → Yes / No toggle buttons */}
                              {unitMeta.inputType === 'bool' ? (
                                <div className="flex gap-2">
                                  {['true', 'false'].map(bv => (
                                    <button
                                      key={bv}
                                      type="button"
                                      onClick={() => updateCondRow(idx, 'condValue', bv)}
                                      className={`flex-1 py-2 rounded-lg text-[13px] font-bold border-2 transition-all active:scale-95 ${
                                        row.condValue === bv
                                          ? bv === 'true'
                                            ? 'bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] border-teal-500'
                                            : 'bg-rose-500 text-white border-rose-500'
                                          : 'bg-white dark:bg-[#112240] border-gray-200 dark:border-[rgba(255,255,255,0.08)] text-slate-500 hover:border-teal-400'
                                      }`}
                                    >
                                      {bv === 'true' ? 'Yes ✓' : 'No ✗'}
                                    </button>
                                  ))}
                                </div>
                              ) : unitMeta.inputType === 'time' ? (
                                /* time → HTML time input */
                                <input
                                  type="time"
                                  value={row.condValue}
                                  onChange={e => updateCondRow(idx, 'condValue', e.target.value)}
                                  className="w-full bg-white dark:bg-[#112240] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-[13px] font-semibold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              ) : (
                                /* number / text */
                                <input
                                  type={unitMeta.inputType === 'number' ? 'number' : 'text'}
                                  min={unitMeta.inputType === 'number' ? 0 : undefined}
                                  value={row.condValue}
                                  onChange={e => updateCondRow(idx, 'condValue', e.target.value)}
                                  placeholder={unitMeta.placeholder || opDef?.placeholder || 'value'}
                                  className="w-full bg-white dark:bg-[#112240] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-[13px] font-semibold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300 dark:placeholder:text-[#3d4f6e]"
                                />
                              )}
                            </div>
                          )}

                          {/* Marks */}
                          <div className="w-[110px] shrink-0">
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-[#4b5a7a] uppercase mb-1">
                              Marks
                            </label>
                            <input
                              type="number"
                              value={row.marks}
                              onChange={e => updateCondRow(idx, 'marks', e.target.value)}
                              placeholder="e.g. 25"
                              className="w-full bg-white dark:bg-[#112240] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-[13px] font-bold text-center text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          {/* Remove row */}
                          {condRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCondRow(idx)}
                              className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-90 transition-all self-end"
                            >
                              <Icon name="trash" className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Row 2: Frequency */}
                        <div className="mt-3 flex items-center gap-2">
                          <Icon name="clock" className="w-3.5 h-3.5 text-slate-400 dark:text-[#4b5a7a] shrink-0" />
                          <label className="text-[10px] font-bold text-slate-400 dark:text-[#4b5a7a] uppercase whitespace-nowrap">
                            Frequency:
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {FREQUENCIES.map(f => (
                              <button
                                key={f.value}
                                type="button"
                                onClick={() => updateCondRow(idx, 'frequency', f.value)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                                  row.frequency === f.value
                                    ? FREQ_COLOR[f.value] + ' border-transparent ring-2 ring-offset-1 ring-teal-400 dark:ring-offset-[#0b1628]'
                                    : 'bg-white dark:bg-[#112240] border-gray-200 dark:border-[rgba(255,255,255,0.08)] text-slate-500 dark:text-[#6b7a99] hover:border-teal-400'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preview string */}
                        {formActivity && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[rgba(255,255,255,0.04)]">
                            <p className="text-[11px] text-slate-400 dark:text-[#6b7a99] leading-relaxed">
                              <span className="text-[10px] font-bold uppercase text-teal-500 mr-1">Preview:</span>
                              If{' '}
                              <strong className="text-[#0F172A] dark:text-white">
                                {opDef?.needsValue ? `${opDef.label} ${row.condValue || '…'}` : 'Completed / Yes'}
                              </strong>
                              {' '}→ award{' '}
                              <strong className={Number(row.marks) >= 0 ? 'text-teal-600 dark:text-[#1de9b6]' : 'text-rose-500'}>
                                {Number(row.marks) >= 0 ? '+' : ''}{row.marks} pts
                              </strong>
                              {' '}({row.frequency})
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add condition row */}
                  <button
                    type="button"
                    onClick={addCondRow}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-teal-600 dark:text-[#1de9b6] hover:opacity-75 transition-all self-start"
                  >
                    <Icon name="plus" className="w-4 h-4" />
                    Add Another Condition
                  </button>
                </div>
              </div>

              {/* Add to list button */}
              <button
                type="button"
                onClick={handleAddToDraft}
                className="flex items-center justify-center gap-2 w-full py-3 bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] rounded-xl text-[14px] font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Icon name="plus" className="w-5 h-5" />
                Add Rule to List
              </button>
            </div>
          </div>

          {/* ── Draft rules card ─────────────────────────────────────────────── */}
          {draftRules.length > 0 && (
            <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-sm border border-gray-100 dark:border-[rgba(255,255,255,0.06)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[rgba(255,255,255,0.06)] bg-slate-50 dark:bg-[#0d1e3a]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <span className="text-[13px]">📝</span>
                  </div>
                  <h2 className="text-[14px] font-bold text-[#0F172A] dark:text-white">Draft Rules to Save</h2>
                </div>
                <Badge label={`${draftRules.length} pending`} color="blue" />
              </div>

              <div className="divide-y divide-gray-100 dark:divide-[rgba(255,255,255,0.04)]">
                {draftRules.map(rule => {
                  const opLabel = OPERATORS.find(o => o.value === rule.operator)?.label || rule.operator;
                  const condSummary = rule.operator
                    ? `${opLabel}: ${rule.condValue}`
                    : 'Completed / Yes';
                  return (
                    <div key={rule.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <span className="text-xl shrink-0">{rule.activityIcon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#0F172A] dark:text-white truncate">{rule.activityName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-[#6b7a99] truncate">{condSummary}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${FREQ_COLOR[rule.frequency]}`}>
                        {rule.frequency}
                      </span>
                      <span className={`text-[13px] font-bold shrink-0 ${rule.marks >= 0 ? 'text-teal-600 dark:text-[#1de9b6]' : 'text-rose-500'}`}>
                        {rule.marks >= 0 ? '+' : ''}{rule.marks} pts
                      </span>
                      <button
                        onClick={() => removeDraftRule(rule.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-90 transition-all shrink-0"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-4 bg-slate-50 dark:bg-[#0d1e3a] border-t border-gray-100 dark:border-[rgba(255,255,255,0.06)]">
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] rounded-xl text-[14px] font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  {isSaving
                    ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <Icon name="save" className="w-5 h-5" />}
                  Save {draftRules.length} Rule{draftRules.length !== 1 ? 's' : ''} to Database
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT — Summary panel ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-sm border border-gray-100 dark:border-[rgba(255,255,255,0.06)] overflow-hidden sticky top-24">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[rgba(255,255,255,0.06)] bg-slate-50 dark:bg-[#0d1e3a]">
              <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <Icon name="eye" className="w-4 h-4 text-teal-500" />
                Rules Summary
              </h3>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-[rgba(255,255,255,0.04)]">
              {!Object.keys(summaryMap).length ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-5">
                  <span className="text-4xl">📋</span>
                  <p className="text-[12px] font-semibold text-slate-400 dark:text-[#6b7a99]">
                    No rules yet.<br />Add your first rule using the form.
                  </p>
                </div>
              ) : (
                Object.entries(summaryMap).map(([key, act]) => {
                  const pendingCount = draftRules.filter(r => String(r.activityId) === key).length;
                  return (
                    <div key={key} className="px-4 py-3 flex items-center gap-3">
                      <span className="text-lg shrink-0">{act.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#0F172A] dark:text-white truncate">{act.name}</p>
                        {pendingCount > 0 && (
                          <p className="text-[10px] font-semibold text-amber-500">+{pendingCount} pending</p>
                        )}
                      </div>
                      {act.saved
                        ? <Badge label="Saved" color="teal" />
                        : <Badge label="New" color="amber" />}
                    </div>
                  );
                })
              )}
            </div>

            {/* Active build preview */}
            {selectedAct && condRows.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-100 dark:border-[rgba(255,255,255,0.06)] bg-teal-50/50 dark:bg-teal-900/10">
                <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase mb-2">Active Build</p>
                <p className="text-[12px] font-bold text-[#0F172A] dark:text-white mb-1">
                  {selectedAct.icon || '🎯'} {selectedAct.name || selectedAct.title}
                </p>
                {condRows.map((row, i) => {
                  const opDef = OPERATORS.find(o => o.value === row.operator);
                  return (
                    <p key={i} className="text-[11px] text-slate-500 dark:text-[#6b7a99] leading-relaxed">
                      {opDef?.needsValue ? `${opDef.label} ${row.condValue || '…'}` : 'Completed / Yes'}{' '}
                      → <strong className={Number(row.marks) >= 0 ? 'text-teal-500' : 'text-rose-400'}>
                        {Number(row.marks) >= 0 ? '+' : ''}{row.marks} pts
                      </strong>
                      {' '}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${FREQ_COLOR[row.frequency]}`}>
                        {row.frequency}
                      </span>
                    </p>
                  );
                })}
              </div>
            )}

            {/* Steps footer */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-[rgba(255,255,255,0.06)] bg-slate-50 dark:bg-[#0d1e3a]">
              <div className="flex items-center gap-1">
                {['Select Activity', 'Set Conditions', 'Save Rules'].map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`flex-1 text-center py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider ${
                      i === 0 ? 'bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53]' : 'text-slate-400 dark:text-[#4b5a7a]'
                    }`}>{s}</div>
                    {i < 2 && <div className="w-2 h-px bg-gray-300 dark:bg-[rgba(255,255,255,0.1)] shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddRulesPage;
