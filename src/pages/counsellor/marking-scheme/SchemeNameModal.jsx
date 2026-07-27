import React, { useState, useEffect } from 'react';
import { getGroupSubgroupList } from '../../../api/markingSchemes';

const SchemeNameModal = ({ onClose, onCreate, initialCenterId = '', initialLabelId = '', editingSchemeId = null }) => {
  const [name, setName] = useState('');
  const [groupSubgroups, setGroupSubgroups] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState(initialCenterId ? String(initialCenterId) : '');
  const [selectedLabelId, setSelectedLabelId] = useState(initialLabelId ? String(initialLabelId) : '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await getGroupSubgroupList();
        setGroupSubgroups(list || []);
      } catch (err) {
        console.error("Failed to load modal dropdowns:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedGroupObj = groupSubgroups.find(g => Number(g.center_id) === Number(selectedCenterId));
  const subgroupsToDisplay = selectedGroupObj ? (selectedGroupObj.labels || []) : [];
  const selectedSubgroupObj = subgroupsToDisplay.find(l => Number(l.id) === Number(selectedLabelId));

  const isAlreadyAssigned = selectedSubgroupObj && selectedSubgroupObj.marking_scheme_id && Number(selectedSubgroupObj.marking_scheme_id) !== 1 && Number(selectedSubgroupObj.marking_scheme_id) !== Number(editingSchemeId);

  useEffect(() => {
    if (selectedGroupObj && selectedSubgroupObj) {
      const groupNameClean = selectedGroupObj.name.trim();
      const subgroupNameClean = selectedSubgroupObj.name.trim();
      const autoName = `${groupNameClean}-${subgroupNameClean}`.toLowerCase().replace(/\s+/g, '-');
      setName(autoName);
    } else {
      setName('');
    }
  }, [selectedCenterId, selectedLabelId, groupSubgroups]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (name.trim() && !isSubmitting && !isAlreadyAssigned) {
      setIsSubmitting(true);
      try {
        await onCreate(name.trim(), selectedCenterId || null, selectedLabelId || null);
      } catch (err) {
        console.error("Error saving scheme:", err);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-[rgba(0,0,0,0.6)] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[360px] bg-white dark:bg-[#112240] rounded-[20px] p-6 shadow-2xl border border-slate-100 dark:border-[rgba(255,255,255,0.06)] animate-in zoom-in-95 fade-in duration-200">
        <h2 className="text-[#0f172a] dark:text-white text-[16px] font-bold mb-[16px] text-center">
          {editingSchemeId ? 'Edit Scheme Association' : 'Create New Scheme'}
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 text-[12px] text-slate-500">
            <svg className="animate-spin h-5 w-5 text-[#1d4ed8] dark:text-[#1de9b6] mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Fetching groups and subgroups...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Scheme Name Input is auto-generated and commented out */}
            {/* 
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase tracking-wider mb-1.5">Scheme Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Mid-Term Projects"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b1628] border border-slate-200 dark:border-[rgba(255,255,255,0.1)] rounded-[12px] p-[10px] text-[13px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#1d4ed8] dark:focus:border-[#1de9b6] transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
            </div>
            */}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase tracking-wider mb-1.5">Select Group <span className="text-red-500">*</span></label>
              <select
                value={selectedCenterId}
                onChange={(e) => {
                  setSelectedCenterId(e.target.value);
                  setSelectedLabelId(''); // Reset subgroup selection on center change
                }}
                className="w-full bg-slate-50 dark:bg-[#0b1628] border border-slate-200 dark:border-[rgba(255,255,255,0.1)] rounded-[12px] p-[10px] text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[#1d4ed8] dark:focus:border-[#1de9b6] transition-colors"
              >
                <option value="">Select Group</option>
                {groupSubgroups.map(c => (
                  <option key={c.center_id} value={c.center_id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase tracking-wider mb-1.5">Select Sub Group <span className="text-red-500">*</span></label>
              <select
                value={selectedLabelId}
                disabled={!selectedCenterId}
                onChange={(e) => setSelectedLabelId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b1628] border border-slate-200 dark:border-[rgba(255,255,255,0.1)] rounded-[12px] p-[10px] text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[#1d4ed8] dark:focus:border-[#1de9b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Sub Group</option>
                {subgroupsToDisplay.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {isAlreadyAssigned && (
                <p className="text-[11px] font-semibold text-rose-500 mt-2">
                  ⚠️ A custom scheme is already assigned to this subgroup.
                </p>
              )}
            </div>

            {name && !isAlreadyAssigned && (
              <div className="bg-slate-50 dark:bg-[#0b1628] p-3 rounded-[12px] border border-slate-200 dark:border-[rgba(255,255,255,0.1)]">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-[#6b7a99] uppercase tracking-wider mb-1">Generated Scheme Name</span>
                <span className="text-[13px] font-semibold text-slate-800 dark:text-white">{name}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-[10px] bg-slate-100 dark:bg-[rgba(255,255,255,0.05)] text-slate-700 dark:text-white text-[13px] font-semibold hover:bg-slate-200 dark:hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !selectedCenterId || !selectedLabelId || isAlreadyAssigned || isSubmitting}
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
