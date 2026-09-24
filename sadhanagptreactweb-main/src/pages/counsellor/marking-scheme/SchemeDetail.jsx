import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSchemes, getSchemeActivities, saveScheme, getActivities, deleteMarkingRuleAPI, deleteActivityRulesAPI } from '../../../api/markingSchemes';
import ConfirmModal from '../../../components/shared/ConfirmModal';

const getBadgeStyles = (type) => {
  if (type === 'Daily') return 'bg-[rgba(29,233,182,0.12)] text-[#1de9b6]';
  if (type === 'Weekly') return 'bg-[rgba(239,159,39,0.12)] text-[#EF9F27]';
  return 'bg-[rgba(255,255,255,0.1)] text-[#6b7a99]';
};

const OPERATORS = [
  { value: '>=', label: 'At Least (≥)',    needsValue: true,  placeholder: 'e.g. 16' },
  { value: '<=', label: 'Up To (≤)',       needsValue: true,  placeholder: 'e.g. 30' },
  { value: '>',  label: 'More Than (>)',   needsValue: true,  placeholder: 'e.g. 10' },
  { value: '<',  label: 'Less Than (<)',   needsValue: true,  placeholder: 'e.g. 5'  },
  { value: '=',  label: 'Exactly (=)',     needsValue: true,  placeholder: 'e.g. 16' },
  { value: '',   label: 'Completed / Yes', needsValue: false, placeholder: ''         },
];

const UNIT_META = {
  numb:    { inputType: 'number', placeholder: 'e.g. 16',    label: 'numb',   hideOperator: false },
  min:     { inputType: 'number', placeholder: 'e.g. 30',    label: 'min',    hideOperator: false },
  time:    { inputType: 'time',   placeholder: 'HH:MM',      label: 'time',   hideOperator: false },
  yes_no:  { inputType: 'bool',   placeholder: '',           label: 'yes_no', hideOperator: true  },
  // Fallbacks
  rounds:  { inputType: 'number', placeholder: 'e.g. 16',    label: 'rounds', hideOperator: false },
  boolean: { inputType: 'bool',   placeholder: '',           label: '',       hideOperator: true  },
};
const getUnitMeta = (unit) => UNIT_META[unit] || { inputType: 'text', placeholder: 'value', label: unit || '', hideOperator: false };

const parseCondition = (conditionStr) => {
  const str = (conditionStr || '').trim();
  
  for (const op of OPERATORS.filter(o => o.value)) {
    if (str.startsWith(op.value)) {
      let val = str.substring(op.value.length).trim();
      val = val.replace(/\bboolean\b/gi, 'days');
      return { operator: op.value, value: val };
    }
  }

  const opMapWord = {
    'At least': '>=',
    'Up To': '<=',
    'Up to': '<=',
    'After': '>',
    'Before': '<',
    'Exact Time': '=',
    'Yes': '',
    'No': '',
    'Completed': ''
  };

  for (const [word, opValue] of Object.entries(opMapWord)) {
    if (str.toLowerCase().startsWith(word.toLowerCase())) {
      let val = str.substring(word.length).trim();
      val = val.replace(/\bboolean\b/gi, 'days');
      if (word === 'Yes' || word === 'Completed') return { operator: '', value: 'true' };
      if (word === 'No') return { operator: '', value: 'false' };
      return { operator: opValue, value: val };
    }
  }

  if (str === 'Completed' || str === 'Yes' || str === 'true') return { operator: '', value: 'true' };
  if (str === 'No' || str === 'false') return { operator: '', value: 'false' };

  return { operator: '=', value: str.replace(/\bboolean\b/gi, 'days') };
};


const SchemeTable = ({ data, onUpdateRow, onDeleteRow, onAddRow, onDeleteActivity }) => {
  const meta = getUnitMeta(data.unit);
  const maxMarks = data.rows?.reduce((max, r) => Math.max(max, r.marks || 0), 0) || 0;

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#112240] rounded-[16px] p-[16px] sm:p-[24px] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-none flex flex-col w-full">
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pb-5 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[22px]">
            {data.icon || '🎯'}
          </div>
          <div>
            <h3 className="font-bold text-[18px] text-[#0F172A] dark:text-white leading-tight mb-1">{data.title}</h3>
            <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wide uppercase ${getBadgeStyles(data.badge)}`}>
              {data.badge}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onDeleteActivity(data.id)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
            title="Delete Activity Rules"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/30 px-4 py-2 rounded-[10px] border border-teal-100 dark:border-teal-800/30">
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide">Max Pts:</span>
            <span className="text-[16px] font-black text-teal-600 dark:text-[#1de9b6]">{maxMarks}</span>
          </div>
        </div>
      </div>

      <div className="pt-6 flex-1 flex flex-col relative">
        <div className="grid grid-cols-[1.5fr_1.5fr_1fr_40px] gap-3 pb-3 mb-3 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-2">
          <div className="text-[11px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Condition-Values</div>
          <div className="text-[11px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Conditions</div>
          <div className="text-[11px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Marks</div>
          <div></div>
        </div>
        
        <div className="flex flex-col gap-2">
          {data.rows?.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1.5fr_1.5fr_1fr_40px] gap-3 items-center min-h-[48px] bg-slate-50 dark:bg-[rgba(255,255,255,0.02)] rounded-[12px] p-2 hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200">
              
              <div>
                {meta.inputType === 'bool' ? (
                  <div className="flex gap-1 h-9">
                    {['true', 'false'].map(bv => (
                      <button
                        key={bv}
                        onClick={() => onUpdateRow(data.id, idx, 'value', bv)}
                        className={`flex-1 rounded-[6px] text-[12px] font-bold transition-all ${
                          row.value === bv 
                            ? bv === 'true' ? 'bg-teal-500 text-white' : 'bg-rose-500 text-white'
                            : 'bg-white dark:bg-[#0b1628] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {bv === 'true' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                ) : meta.inputType === 'time' ? (
                  <input
                    type="time"
                    value={row.value || ''}
                    onChange={(e) => onUpdateRow(data.id, idx, 'value', e.target.value)}
                    className="w-full h-9 bg-white dark:bg-[#0b1628] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] rounded-[8px] px-3 text-[13px] font-bold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type={meta.inputType === 'number' ? 'number' : 'text'}
                      value={row.value || ''}
                      onChange={(e) => onUpdateRow(data.id, idx, 'value', e.target.value)}
                      placeholder={meta.placeholder}
                      className="w-full h-9 bg-white dark:bg-[#0b1628] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] rounded-[8px] px-3 pr-8 text-[13px] font-bold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {meta.label && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">{meta.label}</span>}
                  </div>
                )}
              </div>

              <div>
                {!meta.hideOperator && (
                  <select
                    value={row.operator || '='}
                    onChange={(e) => onUpdateRow(data.id, idx, 'operator', e.target.value)}
                    className="w-full h-9 bg-white dark:bg-[#0b1628] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] rounded-[8px] px-2 text-[12px] font-bold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {OPERATORS.filter(op => op.value !== '').map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <select
                  value={row.marks || 0}
                  onChange={(e) => onUpdateRow(data.id, idx, 'marks', Number(e.target.value))}
                  className={`w-full h-9 bg-white dark:bg-[#0b1628] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] rounded-[8px] px-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
                    row.marks > 0 ? 'text-[#059669] dark:text-[#00D4AA]' : row.marks === 0 ? 'text-[#64748B] dark:text-[#94A3B8]' : 'text-[#DC2626] dark:text-[#FF5C5C]'
                  }`}
                >
                  {Array.from({ length: 11 }, (_, i) => i * 5).map(v => (
                    <option key={v} value={v}>+{v}</option>
                  ))}
                  {Array.from({ length: 10 }, (_, i) => -(i + 1) * 5).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => onDeleteRow(data.id, idx)} 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => onAddRow(data.id)}
          className="mt-4 w-full h-10 border border-dashed border-teal-300 dark:border-teal-700/50 rounded-[10px] text-[13px] font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Rule for {data.title}
        </button>
      </div>
    </div>
  );
};

const SchemeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const schemeId = Number(id) || id;

  const [scheme, setScheme] = useState(null);
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [activeActivityId, setActiveActivityId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const resSelectable = await getActivities(schemeId);
      const allActs = resSelectable.activities || [];
      setAllActivities(allActs);

      const resSchemes = await getSchemes(true);
      const currentScheme = resSchemes.schemes.find(s => s.id == schemeId);
      if (currentScheme) setScheme(currentScheme);

      const resAct = await getSchemeActivities(schemeId);
      const acts = resAct.activities || [];
      
      const initialized = acts.map(act => {
         const matchInfo = allActs.find(a => String(a.id) === String(act.id)) || {};
         const meta = getUnitMeta(matchInfo.badge || matchInfo.unit || '');
         return {
            ...act,
            unit: matchInfo.badge || matchInfo.unit,
            rows: (act.rows || []).map(r => {
               const parsed = parseCondition(r.condition);
               let val = parsed.value;
               if (meta.inputType === 'number' && val) {
                  const match = String(val).match(/[\d.]+/);
                  if (match) val = match[0];
               }
               return {
                  ...r,
                  operator: meta.hideOperator ? '' : parsed.operator,
                  value: val
               }
            }).sort((a, b) => (Number(b.marks) || 0) - (Number(a.marks) || 0))
         };
      });
      setActivities(initialized);
      setLoading(false);
    };
    fetchData();
  }, [schemeId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSelectActivity = (actId) => {
    setActiveActivityId(actId);
    if (actId && !activities.some(a => String(a.id) === String(actId))) {
       const actInfo = allActivities.find(a => String(a.id) === String(actId));
       const unit = actInfo?.unit || '';
       const meta = getUnitMeta(unit);
       const newAct = {
          id: actInfo.id,
          title: actInfo.name || actInfo.title,
          icon: actInfo.icon || '🎯',
          badge: actInfo.badge || 'daily',
          unit: unit,
          rows: [
            { operator: meta.hideOperator ? '' : '>=', value: meta.inputType === 'bool' ? 'true' : '', marks: 25 }
          ]
       };
       setActivities(prev => [...prev, newAct]);
       setIsDirty(true);
    }
  };

  const handleSave = async (activitiesToSave = activities) => {
    // If handleSave is called from an event handler, activitiesToSave will be an Event object
    if (activitiesToSave && activitiesToSave.nativeEvent) {
      activitiesToSave = activities;
    }
    try {
      setIsSaving(true);
      
      const payloadActivities = activitiesToSave.map(act => ({
        ...act,
        rows: act.rows.map(r => {
           let conditionStr = r.operator ? `${r.operator} ${r.value}` : String(r.value);
           if (!r.operator && (r.value === 'true' || r.value === 'Completed' || r.value === 'Yes')) conditionStr = 'Completed';
           if (!r.operator && (r.value === 'false' || r.value === 'No')) conditionStr = 'No';
           return {
              id: r.id,
              condition: conditionStr,
              operator: r.operator || '=',
              value: r.value || '',
              marks: r.marks
           };
        })
      }));

      await saveScheme(scheme.name, payloadActivities, schemeId, false);
      setIsDirty(false);
      setIsSaving(false);
      showToast("Changes saved successfully!");
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      showToast('Failed to save scheme: ' + err.message);
    }
  };

  const handleDeleteActivity = (activityId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Activity Rules',
      message: 'Are you sure you want to remove all rules for this activity from the scheme?',
      onConfirm: async () => {
        try {
          await deleteActivityRulesAPI(schemeId, activityId);
          const newActivities = activities.map(a => {
            if (String(a.id) === String(activityId)) {
              return { ...a, rows: [] };
            }
            return a;
          });
          setActivities(newActivities);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast("Activity rules deleted successfully!");
        } catch (err) {
          console.error(err);
          showToast('Failed to delete activity rules: ' + err.message);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteRow = (activityId, rowIdx) => {
    const act = activities.find(a => String(a.id) === String(activityId));
    if (act && act.rows && act.rows.length === 1) {
       handleDeleteActivity(activityId);
       return;
    }

    const ruleToDelete = act?.rows[rowIdx];

    setConfirmModal({
      isOpen: true,
      title: 'Delete Rule',
      message: 'Are you sure you want to delete this specific rule?',
      onConfirm: async () => {
        try {
          if (ruleToDelete && ruleToDelete.id) {
            await deleteMarkingRuleAPI(ruleToDelete.id);
          }
          const newActivities = activities.map(a => {
            if (String(a.id) !== String(activityId)) return a;
            const newRows = [...a.rows];
            newRows.splice(rowIdx, 1);
            return { ...a, rows: newRows };
          });
          setActivities(newActivities);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast("Rule deleted successfully!");
        } catch (err) {
          console.error(err);
          showToast('Failed to delete rule: ' + err.message);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleUpdateRow = (activityId, rowIdx, field, value) => {
    setActivities(prev => prev.map(a => {
      if (String(a.id) !== String(activityId)) return a;
      const newRows = [...a.rows];
      newRows[rowIdx] = { ...newRows[rowIdx], [field]: value };
      return { ...a, rows: newRows };
    }));
    setIsDirty(true);
  };

  const handleAddRow = (activityId) => {
    setActivities(prev => prev.map(a => {
      if (String(a.id) !== String(activityId)) return a;
      const meta = getUnitMeta(a.unit);
      const newRows = [...a.rows, { operator: meta.hideOperator ? '' : '>=', value: meta.inputType === 'bool' ? 'true' : '', marks: 5 }];
      return { ...a, rows: newRows };
    }));
    setIsDirty(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0A192F] flex items-center justify-center text-[#6b7a99]">Loading builder...</div>;
  }

  const activeActivity = activities.find(a => String(a.id) === String(activeActivityId));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A192F] font-sans pb-28 transition-colors duration-300 flex flex-col relative">

      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A192F]/80 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] py-4 transition-all duration-300 box-border shadow-sm">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-[200px]">
            <button
              onClick={() => navigate('/counsellor/marking-scheme')}
              className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-slate-500 dark:text-[#6b7a99] hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.06)] active:scale-90 transition-all"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                 <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] dark:text-white leading-none tracking-tight truncate">
                  {scheme?.name || 'Custom Scheme Builder'}
                </h1>
                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[9px] font-bold uppercase rounded-full tracking-wide">Builder</span>
              </div>
              <p className="text-[11px] sm:text-[12px] font-medium text-slate-500 dark:text-[#6b7a99] mt-1.5 truncate">
                View, modify, and add custom rules instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleSave(activities)}
              disabled={!isDirty || isSaving}
              className={`flex items-center gap-2 px-[16px] py-[8px] rounded-[10px] text-[13px] font-bold shadow-md transition-all ${
                isDirty 
                  ? 'bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] hover:opacity-90 active:scale-95 animate-pulse-slight ring-2 ring-offset-2 ring-teal-400 dark:ring-offset-[#0A192F]'
                  : 'bg-slate-200 dark:bg-[rgba(255,255,255,0.06)] text-slate-400 dark:text-[#4b5a7a] cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              )}
              {isDirty ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-[90%] max-w-[800px] mx-auto px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] py-8 transition-all duration-300 box-border">

        <div className="mb-8">
          <label className="block text-[12px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase mb-2 tracking-wider">
            Select Activity to Edit
          </label>
          <div className="relative w-full">
            <select
              value={activeActivityId}
              onChange={(e) => handleSelectActivity(e.target.value)}
              className="w-full bg-white dark:bg-[#112240] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-[12px] p-3.5 pr-10 text-[14px] font-bold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500 appearance-none shadow-sm cursor-pointer"
            >
              <option value="">-- Choose an Activity --</option>
              {allActivities.map(act => {
                const hasConfig = activities.some(a => String(a.id) === String(act.id));
                return (
                  <option key={act.id} value={act.id}>
                    {hasConfig ? '✓ ' : ''}{act.icon ? `${act.icon} ` : ''}{act.name || act.title}
                  </option>
                )
              })}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {activeActivity ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SchemeTable
              data={activeActivity}
              onUpdateRow={handleUpdateRow}
              onDeleteRow={handleDeleteRow}
              onAddRow={handleAddRow}
              onDeleteActivity={handleDeleteActivity}
            />
          </div>
        ) : (
          <div className="py-16 mt-4 text-center bg-white dark:bg-[#112240] rounded-[16px] border border-dashed border-gray-300 dark:border-[rgba(255,255,255,0.1)]">
            <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-[rgba(255,255,255,0.1)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
            <h3 className="text-[16px] font-bold text-slate-700 dark:text-white mb-2">Select an Activity</h3>
            <p className="text-[13px] text-slate-500 dark:text-[#6b7a99]">Choose an activity from the dropdown above to view or modify its rules.</p>
          </div>
        )}

      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-2 bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] px-5 py-3 rounded-full shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            <span className="text-[13px] font-bold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};

export default SchemeDetail;
