import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import { getSchemes, getSchemeActivities, saveScheme, deleteActivityFromScheme, deleteScheme, getActivities } from '../../../api/markingSchemes';
import SchemeNameModal from './SchemeNameModal';
import EditChoiceModal from './EditChoiceModal';
import ConfirmModal from '../../../components/shared/ConfirmModal';

const getBadgeStyles = (type) => {
  if (type === 'Daily') return 'bg-[rgba(29,233,182,0.12)] text-[#1de9b6]';
  if (type === 'Weekly') return 'bg-[rgba(239,159,39,0.12)] text-[#EF9F27]';
  return 'bg-[rgba(255,255,255,0.1)] text-[#6b7a99]';
};

const parseCondition = (conditionStr) => {
  const opMap = {
    '>=': 'At least',
    '<=': 'Upto',
    '>': 'After',
    '<': 'Before'
  };

  const str = (conditionStr || '').trim();
  
  for (const [op, text] of Object.entries(opMap)) {
    if (str.startsWith(op)) {
      let remainder = str.substring(op.length).trim();
      remainder = remainder.replace(/\bboolean\b/gi, 'days');
      return { value: remainder, rule: text };
    }
  }

  const rules = ["Before", "After", "Up To", "Up to", "At Least", "Exact Time", "Yes", "No"];
  const lowerStr = str.toLowerCase();
  
  for (const rule of rules) {
    const lowerRule = rule.toLowerCase();
    if (lowerStr.startsWith(lowerRule)) {
      let remainder = str.substring(rule.length).trim();
      remainder = remainder.replace(/\bboolean\b/gi, 'days');
      let titleCaseRule = rule.toLowerCase() === "up to" ? "Up To" : rule;
      titleCaseRule = titleCaseRule.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      return { value: remainder || str, rule: titleCaseRule };
    }
  }
  
  return { value: str.replace(/\bboolean\b/gi, 'days'), rule: "" };
};

const getOptionsForRule = (ruleName) => {
  const common = [
    { label: 'At Least (>=)', value: 'At Least', symbol: '>=' },
    { label: 'Up To (<=)', value: 'Up To', symbol: '<=' }
  ];
  if (ruleName === 'Yes' || ruleName === 'No') {
    return [
      { label: 'Yes', value: 'Yes', symbol: '=' },
      { label: 'No', value: 'No', symbol: '=' }
    ];
  }
  if (ruleName === 'Before' || ruleName === 'After' || ruleName === 'Exact Time') {
    return [
      { label: 'Before (<)', value: 'Before', symbol: '<' },
      { label: 'After (>)', value: 'After', symbol: '>' },
      { label: 'Exact Time (=)', value: 'Exact Time', symbol: '=' }
    ];
  }
  return common;
};

const StepperControl = ({ value, onChange }) => {
  const handleMinus = (e) => {
    e.stopPropagation();
    if (value > 5) onChange(value - 5);
  };
  const handlePlus = (e) => {
    e.stopPropagation();
    if (value < 50) onChange(value + 5);
  };

  return (
    <div className="flex items-center justify-between bg-[#0b1628] border border-[rgba(255,255,255,0.1)] rounded-lg p-1 w-[90px] shadow-inner">
      <button
        onClick={handleMinus}
        disabled={value <= 5}
        className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-lg ${value <= 5 ? 'text-gray-600 dark:text-gray-700 cursor-not-allowed' : 'text-slate-400 dark:text-[#6b7a99] hover:bg-white/10 active:scale-95 transition-all'}`}
      >
        −
      </button>
      <span className="text-white text-[12px] font-medium leading-none">{value}</span>
      <button
        onClick={handlePlus}
        disabled={value >= 50}
        className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-lg ${value >= 50 ? 'text-gray-600 dark:text-gray-700 cursor-not-allowed' : 'text-[#1de9b6] hover:bg-white/10 active:scale-95 transition-all'}`}
      >
        +
      </button>
    </div>
  );
};

const SchemeTable = ({ data, isEditing, onDelete, onRowMarkChange, onRowConditionChange, onMaxMarksChange, onAddRow, onDeleteRow }) => {
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [openRuleDropdownIdx, setOpenRuleDropdownIdx] = useState(null);
  const dropdownRef = useRef(null);
  const options = Array.from({ length: Math.floor((data.maxMarks || 0) / 5) + 1 }, (_, i) => i * 5).reverse();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownIdx(null);
        setOpenRuleDropdownIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#112240] rounded-[16px] p-[12px] sm:p-[14px] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-none flex flex-col transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)] break-words w-full" ref={dropdownRef}>

      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <span className="text-[16px] leading-none">{data.icon || '🎯'}</span>
          <h3 className="font-semibold text-[13px] sm:text-[14px] text-[#0F172A] dark:text-white leading-none">{data.title}</h3>
          <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-bold tracking-wide uppercase ${getBadgeStyles(data.badge)}`}>
            {data.badge}
          </span>
        </div>
        <div className="flex items-center h-8 gap-2">
          {isEditing && (
            <button
              onClick={() => onDelete(data.id)}
              className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[11px] font-bold transition-colors"
            >
              Delete Rules
            </button>
          )}
          {isEditing ? (
            <StepperControl value={data.maxMarks} onChange={(newVal) => onMaxMarksChange(data.id, newVal)} />
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-[#059669]/10 dark:bg-[rgba(29,233,182,0.15)] text-[#059669] dark:text-[#1de9b6] text-[12px] font-semibold border border-transparent">
              {data.maxMarks} pts
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 flex-1 flex flex-col relative">
        {data.subTables ? (
          <div className="flex flex-col gap-4">
            {data.subTables.map((sub, sIdx) => (
              <div key={sIdx} className="flex flex-col">
                <h4 className="text-[9px] text-[#6b7a99] font-medium mb-[4px]">{sub.subHeader}</h4>
                <div className="grid grid-cols-3 gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">{sub.headers ? sub.headers[0] : 'Condition-Values'}</div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Conditions</div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider text-right sm:text-left sm:pl-6">{sub.headers ? sub.headers[1] : 'Marks'}</div>
                </div>
                <div className="flex flex-col">
                  {sub.rows.map((row, idx) => {
                    const parsed = parseCondition(row.condition);
                    const dropdownKey = `sub-${sIdx}-${idx}`;
                    const isLastRow = idx === sub.rows.length - 1;
                    const isNegative = row.marks < 0;
                    return (
                      <div key={idx} className="grid grid-cols-3 gap-2 items-center min-h-[28px] border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] last:border-0 py-1">
                        <div className="text-[11px] text-[#0F172A] dark:text-gray-200">{parsed.value}</div>
                        <div className="text-[11px] text-[#64748B] dark:text-gray-400">{parsed.rule}</div>
                        <div className="flex items-center justify-end sm:justify-start sm:pl-6">
                           <span className="text-[11px] font-semibold text-[#059669]">{row.marks > 0 ? `+${row.marks}` : row.marks}</span>
                          {isEditing && !isLastRow && !isNegative && (sub.rows.length > 1) && (
                            <button onClick={() => onDeleteRow(data.id, sIdx, idx)} className="ml-3 text-rose-500 hover:text-rose-400 active:scale-90 transition-all p-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {isEditing && (
                  <button onClick={() => onAddRow(data.id, sIdx)} className="mt-2 self-start px-2 py-0.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-[#1de9b6] text-[10px] font-bold rounded transition-colors flex items-center gap-1">
                    + Add Condition
                  </button>
                )}
                {sIdx < data.subTables.length - 1 && <div className="h-[0.5px] bg-[rgba(255,255,255,0.06)] my-[4px]" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col flex-1 relative">
            <div className="grid grid-cols-3 gap-2 pb-2 mb-1 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
              <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Condition-Values</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Conditions</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider text-right sm:text-left sm:pl-6">Marks</div>
            </div>
            <div className="flex flex-col flex-1 relative">
              {data.rows?.map((row, idx) => {
                const parsed = parseCondition(row.condition);
                const isLastRow = idx === data.rows.length - 1;
                const isNegative = row.marks < 0;
                return (
                  <div key={idx} className="grid grid-cols-3 gap-2 items-center min-h-[28px] border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] last:border-0 py-1">
                    <div className="text-[11px] text-[#0F172A] dark:text-gray-200">{parsed.value}</div>
                    <div className="text-[11px] text-[#64748B] dark:text-gray-400">{parsed.rule}</div>
                    <div className="flex items-center justify-end sm:justify-start sm:pl-6">
                      <span className="text-[11px] font-semibold text-[#059669]">{row.marks > 0 ? `+${row.marks}` : row.marks}</span>
                      {isEditing && !isLastRow && !isNegative && (data.rows ? data.rows.length > 1 : true) && (
                        <button onClick={() => onDeleteRow(data.id, null, idx)} className="ml-3 text-rose-500 hover:text-rose-400 active:scale-90 transition-all p-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {isEditing && (
              <button onClick={() => onAddRow(data.id, null)} className="mt-2 self-start px-2 py-0.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-[#1de9b6] text-[10px] font-bold rounded transition-colors flex items-center gap-1">
                + Add Condition
              </button>
            )}
            {data.note && <p className="mt-[12px] text-[11px] text-[#6b7a99] italic">{data.note}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const SchemeDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const schemeId = Number(id) || id;

  const [scheme, setScheme] = useState(null);
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [schemeDraft, setSchemeDraft] = useState([]);
  const [editModeType, setEditModeType] = useState('fork');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEditChoiceModal, setShowEditChoiceModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [deleteActivityTarget, setDeleteActivityTarget] = useState(null);
  const [formActivity, setFormActivity] = useState('');
  const [formRule, setFormRule] = useState('At Least');
  const [formValue, setFormValue] = useState('');
  const [formMarks, setFormMarks] = useState(25);

  const fetchSelectableActivities = async () => {
    try {
      const res = await getActivities(schemeId);
      setAllActivities(res.activities || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const resSchemes = await getSchemes(true);
      const currentScheme = resSchemes.schemes.find(s => s.id == schemeId);
      if (currentScheme) setScheme(currentScheme);

      const resAct = await getSchemeActivities(schemeId);
      setActivities(resAct.activities || []);
      
      setLoading(false);
    };
    fetchData();
    fetchSelectableActivities();
  }, [schemeId, location.state, navigate]);

  const handleEditInitiate = () => {
    if (scheme?.isSystemDefault) {
      handleEditClick('fork');
    } else {
      setShowEditChoiceModal(true);
    }
  };

  const handleEditClick = (type = 'fork') => {
    setEditModeType(type);
    setSchemeDraft([...activities]);
    setIsEditing(true);
    setIsDirty(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSchemeDraft([]);
    setIsDirty(false);
  };

  const handleDeleteActivity = async (activityId) => {
    setSchemeDraft(prev => prev.filter(a => a.id !== activityId));
    setIsDirty(true);
  };

  const handleAddActivityDirect = (actId) => {
    const actInfo = allActivities.find(a => String(a.id) === String(actId));
    if (actInfo) {
      const newActivity = {
        id: actInfo.id + '_' + Date.now(),
        title: actInfo.name || actInfo.title,
        icon: actInfo.icon || '🎯',
        maxMarks: 25,
        badge: actInfo.badge || 'Daily',
        rows: [
          { condition: '>= 0', marks: 0 }
        ]
      };
      setSchemeDraft(prev => [...prev, newActivity]);
      setIsDirty(true);
    }
  };

  const handleAddRuleDirect = () => {
    if (!formActivity) {
      alert("Please select a linked activity.");
      return;
    }

    const actInfo = allActivities.find(a => String(a.id) === String(formActivity));
    if (!actInfo) return;

    let conditionText = '';
    if (formRule === 'Yes' || formRule === 'No') {
      conditionText = formRule;
    } else {
      if (!formValue.trim()) {
        alert("Please enter a condition value.");
        return;
      }
      conditionText = `${formRule} ${formValue.trim()}`;
    }

    setSchemeDraft(prev => {
      const existingIdx = prev.findIndex(a => String(a.id).split('_')[0] === String(formActivity));
      
      if (existingIdx >= 0) {
        const updated = [...prev];
        const act = JSON.parse(JSON.stringify(updated[existingIdx]));
        if (!act.rows) act.rows = [];
        
        const duplicated = act.rows.some(r => r.condition === conditionText);
        if (!duplicated) {
          act.rows.splice(act.rows.length - 1, 0, { condition: conditionText, marks: formMarks });
        } else {
          alert("This condition is already configured for this activity.");
          return prev;
        }
        
        const maxAwarded = act.rows.reduce((m, r) => Math.max(m, r.marks), 0);
        act.maxMarks = Math.max(act.maxMarks, maxAwarded);
        
        updated[existingIdx] = act;
        return updated;
      } else {
        const newAct = {
          id: actInfo.id + '_' + Date.now(),
          title: actInfo.name || actInfo.title,
          icon: actInfo.icon || '🎯',
          maxMarks: Math.max(25, formMarks),
          badge: actInfo.badge || 'Daily',
          rows: [
            { condition: conditionText, marks: formMarks },
            { condition: '0 rounds', marks: 0 }
          ]
        };
        return [...prev, newAct];
      }
    });

    setIsDirty(true);
    setFormValue('');
  };

  const handleAddRow = (activityId, subTableIdx) => {
    setSchemeDraft(prev => prev.map(act => {
      if (act.id !== activityId) return act;
      
      const newAct = JSON.parse(JSON.stringify(act));
      if (subTableIdx !== null && newAct.subTables) {
        newAct.subTables[subTableIdx].rows.splice(newAct.subTables[subTableIdx].rows.length - 1, 0, { condition: '>= 0', marks: 0 });
      } else if (newAct.rows) {
        newAct.rows.splice(newAct.rows.length - 1, 0, { condition: '>= 0', marks: 0 });
      }
      return newAct;
    }));
    setIsDirty(true);
  };

  const handleDeleteRow = (activityId, subTableIdx, rowIdx) => {
    setSchemeDraft(prev => prev.map(act => {
      if (act.id !== activityId) return act;
      
      const newAct = JSON.parse(JSON.stringify(act));
      if (subTableIdx !== null && newAct.subTables) {
        newAct.subTables[subTableIdx].rows = newAct.subTables[subTableIdx].rows.filter((_, idx) => idx !== rowIdx);
      } else if (newAct.rows) {
        newAct.rows = newAct.rows.filter((_, idx) => idx !== rowIdx);
      }
      return newAct;
    }));
    setIsDirty(true);
  };

  const handleRowMarkChange = (activityId, subTableIdx, rowIdx, newMark) => {
    setSchemeDraft(prev => prev.map(act => {
      if (act.id !== activityId) return act;
      
      const newAct = JSON.parse(JSON.stringify(act));
      if (subTableIdx !== null && newAct.subTables) {
        newAct.subTables[subTableIdx].rows[rowIdx].marks = newMark;
      } else if (newAct.rows) {
        newAct.rows[rowIdx].marks = newMark;
      }
      return newAct;
    }));
    setIsDirty(true);
  };

  const handleRowConditionChange = (activityId, subTableIdx, rowIdx, newCondition) => {
    setSchemeDraft(prev => prev.map(act => {
      if (act.id !== activityId) return act;
      
      const newAct = JSON.parse(JSON.stringify(act));
      if (subTableIdx !== null && newAct.subTables) {
        newAct.subTables[subTableIdx].rows[rowIdx].condition = newCondition;
      } else if (newAct.rows) {
        newAct.rows[rowIdx].condition = newCondition;
      }
      return newAct;
    }));
    setIsDirty(true);
  };

  const handleMaxMarksChange = (activityId, newMax) => {
    setSchemeDraft(prev => prev.map(act => {
      if (act.id !== activityId) return act;
      
      const newAct = JSON.parse(JSON.stringify(act));
      newAct.maxMarks = newMax;
      
      const processRows = (rows) => {
        return rows.map(r => r.marks > newMax ? { ...r, marks: newMax } : r);
      };
      
      if (newAct.subTables) {
        newAct.subTables = newAct.subTables.map(sub => ({
          ...sub,
          rows: processRows(sub.rows)
        }));
      } else if (newAct.rows) {
        newAct.rows = processRows(newAct.rows);
      }
      
      return newAct;
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (editModeType === 'fork') {
      setShowNameModal(true);
      return;
    }
    
    try {
      setLoading(true);
      await saveScheme(scheme.name, schemeDraft, schemeId, false);
      
      const resAct = await getSchemeActivities(schemeId);
      setActivities(resAct.activities || []);
      
      setIsEditing(false);
      setSchemeDraft([]);
      setIsDirty(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Failed to save scheme: ' + err.message);
    }
  };

  const handleCreateScheme = async (name, centerId, labelId) => {
    try {
      setLoading(true);
      const res = await saveScheme(name, schemeDraft, 'new', true, centerId, labelId);
      setShowNameModal(false);
      setIsEditing(false);
      setSchemeDraft([]);
      setIsDirty(false);
      
      if (res.scheme_id) {
        navigate(`/counsellor/marking-scheme/${res.scheme_id}`);
      } else {
        navigate('/counsellor/marking-scheme');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Failed to create new scheme: ' + err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0A192F] flex items-center justify-center text-[#6b7a99]">Loading marking scheme...</div>;
  }

  const renderList = isEditing ? schemeDraft : activities;
  const totalActivities = renderList.length;
  const currentTotalMarks = renderList.reduce((acc, curr) => acc + (curr.maxMarks || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A192F] font-sans pb-28 transition-colors duration-300 flex flex-col relative">

      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A192F]/80 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] py-4 transition-all duration-300 box-border">
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
              <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] dark:text-white leading-none tracking-tight truncate">
                {scheme?.name || 'Marking Scheme'}
              </h1>
              <p className="text-[11px] sm:text-[12px] font-medium text-teal-600 dark:text-[#1de9b6] mt-1 truncate">
                {isEditing ? 'Editing session (unsaved)' : 'Full Activity List'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            {!isEditing ? (
              <>
                <button
                  onClick={() => navigate(`/counsellor/marking-scheme/add-rules/${schemeId}`)}
                  className="flex items-center gap-1.5 px-[14px] py-[6px] bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] rounded-[8px] text-[13px] font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Rules
                </button>
                <button
                  onClick={handleEditInitiate}
                  className="flex items-center gap-1.5 px-[14px] py-[6px] border border-teal-500 dark:border-[#1de9b6] text-teal-600 dark:text-[#1de9b6] rounded-[8px] text-[13px] font-medium hover:bg-teal-50 dark:hover:bg-[#1de9b6]/10 active:scale-95 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-[14px] py-[6px] text-gray-500 dark:text-[#6b7a99] rounded-[8px] text-[13px] font-medium hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty}
                  className="px-[14px] py-[6px] bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] rounded-[8px] text-[13px] font-medium hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 w-[90%] max-w-[1080px] mx-auto px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] py-8 transition-all duration-300 box-border">

        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 md:mb-10">
          <div className="bg-[#FFFFFF] dark:bg-[#112240] rounded-[16px] p-4 border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-sm flex flex-col justify-center h-[72px] md:h-[81px] backdrop-blur-sm">
            <p className="text-[10px] md:text-[12px] font-medium text-slate-500 dark:text-[#6b7a99] mb-1">Total Activities</p>
            <h2 className="text-[24px] md:text-[32px] font-bold text-[#0F172A] dark:text-white leading-none">{totalActivities}</h2>
          </div>

          <div className={`bg-gradient-to-r from-[#059669] to-[#10B981] dark:from-[rgba(29,233,182,0.1)] dark:to-[rgba(29,233,182,0.05)] rounded-[16px] p-4 border dark:border-[rgba(29,233,182,0.2)] shadow-md flex flex-col justify-center h-[72px] md:h-[81px] text-white transition-colors duration-300`}>
            <p className={`text-[10px] md:text-[12px] font-medium mb-1 dark:text-[#1de9b6]`}>Max Possible Marks</p>
            <h2 className={`text-[24px] md:text-[32px] font-bold leading-none dark:text-white`}>{currentTotalMarks}</h2>
          </div>
        </div>

        {renderList.length > 0 ? (
          <div className="block md:grid md:grid-cols-2 md:gap-4 mb-6">
            {renderList.map((act) => (
              <SchemeTable
                key={act.id}
                data={act}
                isEditing={isEditing}
                onDelete={handleDeleteActivity}
                onRowMarkChange={handleRowMarkChange}
                onRowConditionChange={handleRowConditionChange}
                onMaxMarksChange={handleMaxMarksChange}
                onAddRow={handleAddRow}
                onDeleteRow={handleDeleteRow}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 mb-6 text-center text-[#6b7a99] bg-[#112240] rounded-[16px] border border-[rgba(255,255,255,0.06)]">
            <p>No activities configured for this scheme yet.</p>
          </div>
        )}

        {isEditing && (
          <div className="mt-6 p-6 bg-[#FFFFFF] dark:bg-[#112240] rounded-[16px] border border-dashed border-teal-500/40 shadow-sm flex flex-col gap-4">
            <h3 className="text-[14px] font-bold text-[#0F172A] dark:text-white border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] pb-2 uppercase tracking-wide">
              Add Grading Rule to Scheme
            </h3>
            
            <div className="flex flex-wrap items-end gap-4">
              {/* Select Activity */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase mb-1.5">
                  Linked Activity
                </label>
                <select
                  value={formActivity}
                  onChange={(e) => setFormActivity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b1628] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-[8px] p-2 text-[13px] font-semibold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Activity --</option>
                  {allActivities.map(act => (
                    <option key={act.id} value={act.id}>
                      {act.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition Type */}
              <div className="w-[140px] shrink-0">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase mb-1.5">
                  Condition Type
                </label>
                <select
                  value={formRule}
                  onChange={(e) => setFormRule(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b1628] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-[8px] p-2 text-[13px] font-semibold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="At Least">At Least (&gt;=)</option>
                  <option value="Up To">Up To (&lt;=)</option>
                  <option value="Before">Before (&lt;)</option>
                  <option value="After">After (&gt;)</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Target Value */}
              {formRule !== 'Yes' && formRule !== 'No' && (
                <div className="w-[120px] shrink-0">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase mb-1.5">
                    Target Value
                  </label>
                  <input
                    type="text"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="e.g. 16 or 05:00"
                    className="w-full bg-slate-50 dark:bg-[#0b1628] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-[8px] p-2 text-[13px] font-semibold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Marks */}
              <div className="w-[120px] shrink-0">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase mb-1.5">
                  Marks to Award
                </label>
                <select
                  value={formMarks}
                  onChange={(e) => setFormMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#0b1628] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-[8px] p-2 text-[13px] font-semibold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {Array.from({ length: 11 }, (_, i) => i * 5).map(v => (
                    <option key={v} value={v}>+{v}</option>
                  ))}
                  {Array.from({ length: 10 }, (_, i) => -(i + 1) * 5).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Button */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleAddRuleDirect}
                  className="px-4 py-2.5 bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] rounded-[8px] text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shadow-md"
                >
                  <span className="text-lg leading-none font-extrabold">+</span> Add Rule to List
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditChoiceModal && (
        <EditChoiceModal
          schemeName={scheme?.name}
          onClose={() => setShowEditChoiceModal(false)}
          onEditInPlace={() => {
            handleEditClick('mutate');
            setShowEditChoiceModal(false);
          }}
          onFork={() => {
            handleEditClick('fork');
            setShowEditChoiceModal(false);
          }}
        />
      )}

      {showNameModal && (
        <SchemeNameModal
          onClose={() => setShowNameModal(false)}
          onCreate={handleCreateScheme}
        />
      )}



    </div>
  );
};

export default SchemeDetail;
