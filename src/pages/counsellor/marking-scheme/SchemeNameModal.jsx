import React, { useState, useEffect, useMemo } from 'react';
import { getGroupSubgroupList } from '../../../api/markingSchemes';

const SchemeNameModal = ({ onClose, onCreate, initialName = '', editingSchemeId = null, schemes = [] }) => {
  const [name, setName] = useState(initialName);
  const [groupSubgroups, setGroupSubgroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await getGroupSubgroupList();
        const fetchedList = Array.isArray(list) ? list : (list?.data || []);
        setGroupSubgroups(fetchedList);
        
        // If editing, preset selections (based on marking_scheme_id matching editingSchemeId)
        if (editingSchemeId) {
            const initialSelection = [];
            fetchedList.forEach(g => {
                if (Number(g.marking_scheme_id) === Number(editingSchemeId)) initialSelection.push({ type: 'group', id: String(g.center_id) });
                (g.labels || []).forEach(l => {
                    if (Number(l.marking_scheme_id) === Number(editingSchemeId)) initialSelection.push({ type: 'subgroup', id: String(l.id) });
                });
            });
            setSelectedAssignments(initialSelection);
        }
      } catch (err) {
        console.error("Failed to load modal dropdowns:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [editingSchemeId]);

  const [hasInitializedDefaults, setHasInitializedDefaults] = useState(false);

  // Map all groups and subgroups, identifying if they belong to another custom scheme
  const availableOptions = useMemo(() => {
    return groupSubgroups.map(g => {
      const gMsId = g.marking_scheme_id ? Number(g.marking_scheme_id) : 1;
      const gScheme = schemes.find(s => s.id === gMsId);
      const isGAssignedElseWhere = gScheme && !gScheme.isSystemDefault && gMsId !== Number(editingSchemeId);

      const labels = (g.labels || []).map(l => {
        const lMsId = l.marking_scheme_id ? Number(l.marking_scheme_id) : 1;
        const lScheme = schemes.find(s => s.id === lMsId);
        const isLAssignedElseWhere = lScheme && !lScheme.isSystemDefault && lMsId !== Number(editingSchemeId);
        
        return { 
          ...l, 
          isAssignedElseWhere: isLAssignedElseWhere,
          currentSchemeName: isLAssignedElseWhere ? lScheme.name : null 
        };
      });

      return {
        ...g,
        isAssignedElseWhere: isGAssignedElseWhere,
        currentSchemeName: isGAssignedElseWhere ? gScheme.name : null,
        availableLabels: labels
      };
    });
  }, [groupSubgroups, editingSchemeId, schemes]);

  useEffect(() => {
    // If we are creating a new scheme, and options are loaded, and we haven't initialized defaults yet
    if (!editingSchemeId && availableOptions.length > 0 && !hasInitializedDefaults) {
      const initialAll = [];
      availableOptions.forEach(g => {
        // Now ALL items are visible and checkable, but we might just pre-check the ones NOT assigned elsewhere
        if (!g.isAssignedElseWhere) initialAll.push({ type: 'group', id: String(g.center_id) });
        g.availableLabels.forEach(l => {
          if (!l.isAssignedElseWhere) initialAll.push({ type: 'subgroup', id: String(l.id) });
        });
      });
      setSelectedAssignments(initialAll);
      setHasInitializedDefaults(true);
    }
  }, [availableOptions, editingSchemeId, hasInitializedDefaults]);

  const handleToggle = (type, id) => {
    const isCurrentlyChecked = selectedAssignments.some(a => a.type === type && a.id === String(id));
    
    let nextAssignments = [...selectedAssignments];

    if (type === 'group') {
      const groupData = availableOptions.find(g => String(g.center_id) === String(id));
      if (!groupData) return;

      if (isCurrentlyChecked) {
        // Uncheck group and ALL its subgroups
        nextAssignments = nextAssignments.filter(a => !(a.type === 'group' && a.id === String(id)));
        const subgroupIds = groupData.availableLabels.map(l => String(l.id));
        nextAssignments = nextAssignments.filter(a => !(a.type === 'subgroup' && subgroupIds.includes(a.id)));
      } else {
        // Check group and ALL its subgroups
        if (!nextAssignments.some(a => a.type === 'group' && a.id === String(id))) {
          nextAssignments.push({ type: 'group', id: String(id) });
        }
        groupData.availableLabels.forEach(l => {
          if (!nextAssignments.some(a => a.type === 'subgroup' && a.id === String(l.id))) {
            nextAssignments.push({ type: 'subgroup', id: String(l.id) });
          }
        });
      }
    } else if (type === 'subgroup') {
      if (isCurrentlyChecked) {
        nextAssignments = nextAssignments.filter(a => !(a.type === 'subgroup' && a.id === String(id)));
      } else {
        nextAssignments.push({ type: 'subgroup', id: String(id) });
      }

      // Check if parent group should be updated
      const groupData = availableOptions.find(g => g.availableLabels.some(l => String(l.id) === String(id)));
      if (groupData) {
        const subgroupIds = groupData.availableLabels.map(l => String(l.id));
        const allSubgroupsChecked = subgroupIds.every(subId => nextAssignments.some(a => a.type === 'subgroup' && a.id === subId));
        
        const isGroupChecked = nextAssignments.some(a => a.type === 'group' && a.id === String(groupData.center_id));

        if (allSubgroupsChecked && !isGroupChecked && subgroupIds.length > 0) {
          nextAssignments.push({ type: 'group', id: String(groupData.center_id) });
        } else if (!allSubgroupsChecked && isGroupChecked) {
          nextAssignments = nextAssignments.filter(a => !(a.type === 'group' && a.id === String(groupData.center_id)));
        }
      }
    }

    setSelectedAssignments(nextAssignments);
  };

  const handleCreate = async () => {
    if (name.trim() && !isSubmitting && selectedAssignments.length > 0) {
      setIsSubmitting(true);
      try {
        await onCreate(name.trim(), selectedAssignments);
      } catch (err) {
        console.error("Error saving scheme:", err);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-[rgba(0,0,0,0.6)] backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="relative w-full max-w-[420px] bg-white dark:bg-[#112240] rounded-[20px] p-6 shadow-2xl border border-slate-100 dark:border-[rgba(255,255,255,0.06)] flex flex-col max-h-[90vh]">
        <h2 className="text-[#0f172a] dark:text-white text-[16px] font-bold mb-[16px] text-center shrink-0">
          {editingSchemeId ? 'Edit Scheme Association' : 'Create New Scheme'}
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-[12px] text-slate-500">
             Loading options...
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden">
            {/* Scheme Name Input */}
            <div className="mb-4 shrink-0">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase tracking-wider mb-1.5">Scheme Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Strict Assessment Scheme"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b1628] border border-slate-200 dark:border-[rgba(255,255,255,0.1)] rounded-[12px] p-[10px] text-[13px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#1d4ed8] dark:focus:border-[#1de9b6] transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
            </div>

            <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase tracking-wider mb-1.5 shrink-0">Assign To <span className="text-red-500">*</span></label>
            <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-3 custom-scrollbar">
               {availableOptions.length === 0 ? (
                 <p className="text-[12px] text-slate-500 italic text-center py-4">No groups available.</p>
               ) : (
                 availableOptions.map(g => (
                   <div key={g.center_id} className="bg-slate-50 dark:bg-[#0b1628] rounded-[10px] p-3 border border-slate-100 dark:border-[rgba(255,255,255,0.05)]">
                     <label className="flex items-center gap-2 cursor-pointer mb-2">
                       <input 
                          type="checkbox" 
                          checked={selectedAssignments.some(a => a.type === 'group' && a.id === String(g.center_id))}
                          onChange={() => handleToggle('group', g.center_id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                       />
                       <div className="flex items-center gap-2">
                         <span className="text-[13px] font-bold text-slate-800 dark:text-white">Group: {g.name}</span>
                         {g.isAssignedElseWhere && (
                           <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                             (Currently in {g.currentSchemeName})
                           </span>
                         )}
                       </div>
                     </label>
                     
                     {g.availableLabels.length > 0 && (
                       <div className="pl-6 space-y-2 border-l-2 border-slate-200 dark:border-slate-800 ml-2 mt-1">
                         {g.availableLabels.map(l => (
                           <label key={l.id} className="flex items-center gap-2 cursor-pointer">
                             <input 
                                type="checkbox"
                                checked={selectedAssignments.some(a => a.type === 'subgroup' && a.id === String(l.id))}
                                onChange={() => handleToggle('subgroup', l.id)}
                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                             />
                             <div className="flex items-center gap-2">
                               <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">Subgroup: {l.name}</span>
                               {l.isAssignedElseWhere && (
                                 <span className="text-[9px] text-red-500 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20">
                                   (Currently in {l.currentSchemeName})
                                 </span>
                               )}
                             </div>
                           </label>
                         ))}
                       </div>
                     )}
                   </div>
                 ))
               )}
            </div>

            <div className="flex gap-3 pt-4 shrink-0 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-[10px] bg-slate-100 dark:bg-[rgba(255,255,255,0.05)] text-slate-700 dark:text-white text-[13px] font-semibold hover:bg-slate-200 dark:hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || selectedAssignments.length === 0 || isSubmitting}
                className="flex-1 py-2 rounded-[10px] bg-[#1d4ed8] dark:bg-[#1de9b6] text-white dark:text-[#042C53] text-[13px] font-bold hover:bg-[#1e40af] dark:hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {editingSchemeId ? 'Saving...' : 'Creating...'}
                  </>
                ) : (editingSchemeId ? 'Save' : 'Create')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemeNameModal;
