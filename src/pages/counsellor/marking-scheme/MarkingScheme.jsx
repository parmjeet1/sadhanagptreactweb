// src/pages/counsellor/marking-scheme/MarkingScheme.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import { getSchemes, getSchemeActivities, getSchemeGroups, saveScheme, deleteActivityFromScheme, deleteScheme, toggleSchemeStatus, getCenters, getLabels, getLabelsRaw, getGroupSubgroupList, createScheme, updateMarkingScheme } from '../../../api/markingSchemes';
import SchemeGroupsPanel from './SchemeGroupsPanel';
import SchemeActivityPickerModal from './SchemeActivityPickerModal';
import SchemeNameModal from './SchemeNameModal';
import ConfirmModal from '../../../components/shared/ConfirmModal';

const MarkingScheme = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);

  // Edit Mode State
  const [editSchemeId, setEditSchemeId] = useState(null);
  const [editModeType, setEditModeType] = useState('fork'); // 'fork' or 'mutate'
  const [isDirty, setIsDirty] = useState(false);
  const [schemeDraft, setSchemeDraft] = useState([]);

  // Modal States
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [editSchemeTarget, setEditSchemeTarget] = useState(null);
  const [schemeActivitiesCache, setSchemeActivitiesCache] = useState({});
  const [schemeGroupsCache, setSchemeGroupsCache] = useState({});
  const [schemeLabelsCache, setSchemeLabelsCache] = useState({});

  // Filter States
  const [groupSubgroups, setGroupSubgroups] = useState([]);
  const [filterCenterId, setFilterCenterId] = useState('all');
  const [filterLabelId, setFilterLabelId] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // Confirmation Modal States
  const [deleteSchemeTarget, setDeleteSchemeTarget] = useState(null);
  const [deleteActivityTarget, setDeleteActivityTarget] = useState(null);

  const fetchSchemes = async () => {
    try {
      const res = await getSchemes();
      setSchemes(res.schemes);

      const cache = {};
      const groupsCache = {};
      const labelsCache = {};

      const list = await getGroupSubgroupList();
      setGroupSubgroups(list || []);

      const isDefaultSubgroup = (l, g) => {
        const lMsId = l.marking_scheme_id ? Number(l.marking_scheme_id) : null;
        const gMsId = g.marking_scheme_id ? Number(g.marking_scheme_id) : null;
        if (lMsId === 1) return true;
        if (lMsId === null && (gMsId === null || gMsId === 1)) return true;
        return false;
      };

      const isCustomSubgroup = (l, g, schemeId) => {
        const lMsId = l.marking_scheme_id ? Number(l.marking_scheme_id) : null;
        const gMsId = g.marking_scheme_id ? Number(g.marking_scheme_id) : null;
        if (lMsId === schemeId) return true;
        if (lMsId === null && gMsId === schemeId) return true;
        return false;
      };

      for (const s of res.schemes) {
        const actRes = await getSchemeActivities(s.id);
        cache[s.id] = actRes.activities || [];

        // DB-backed groups assigned to this scheme (directly or via subgroups)
        groupsCache[s.id] = (list || [])
          .filter(g => {
            if (s.id === 1) {
              return !(g.labels || []).length || (g.labels || []).some(l => isDefaultSubgroup(l, g));
            }
            const msId = Number(g.marking_scheme_id);
            return msId === s.id || (g.labels || []).some(l => isCustomSubgroup(l, g, s.id));
          })
          .map(g => {
            if (s.id === 1) {
              const total = g.labels?.length || 0;
              const defCount = (g.labels || []).filter(l => isDefaultSubgroup(l, g)).length;
              if (defCount < total && defCount > 0) {
                return { id: g.center_id, name: `${g.name} (${defCount}/${total})` };
              }
            }
            return { id: g.center_id, name: g.name };
          });

        // DB-backed subgroups (labels) assigned to this scheme
        labelsCache[s.id] = (list || [])
          .flatMap(g => (g.labels || []).map(l => ({ ...l, group: g })))
          .filter(item => {
            if (s.id === 1) {
              return isDefaultSubgroup(item, item.group);
            }
            return isCustomSubgroup(item, item.group, s.id);
          })
          .map(item => ({ id: item.id, name: item.name }));
      }
      setSchemeActivitiesCache(cache);
      setSchemeGroupsCache(groupsCache);
      setSchemeLabelsCache(labelsCache);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const getSchemeData = (id) => schemes.find(s => s.id === id) || {};

  const handleCountsChanged = (delta, forceRefresh = false) => {
    if (forceRefresh) {
      fetchSchemes();
    } else {
      setSchemes(prev => prev.map(s => {
        if (s.id === expandedSchemeId) {
          return { ...s, appliedGroupCount: s.appliedGroupCount + delta };
        }
        return s;
      }));
    }
  };

  const handleEditClick = (schemeId, type = 'fork', directDraft = null) => {
    setEditModeType(type);
    setEditSchemeId(schemeId);
    setIsDirty(false);
    if (directDraft) {
      setSchemeDraft([...directDraft]);
    } else if (schemeId === 'new') {
      setSchemeDraft([]);
    } else {
      setSchemeDraft([...(schemeActivitiesCache[schemeId] || [])]);
    }
  };

  const handleEditInitiate = async (scheme) => {
    if (scheme.isSystemDefault) {
      // Use the cached activities for the system default scheme
      const defaultActivitiesArray = schemeActivitiesCache[scheme.id] || [];

      // Save as a new Custom Scheme
      const res = await saveScheme('Custom Marking Scheme', defaultActivitiesArray, null, false);
      const newClone = res.scheme;

      // Navigate to the edit view of the new clone
      navigate(`/counsellor/marking-scheme/${newClone.id}`, { state: { autoEdit: true } });
    } else {
      const centerObj = (schemeGroupsCache[scheme.id] || [])[0];
      const labelObj = (schemeLabelsCache[scheme.id] || [])[0];
      setEditSchemeTarget({
        id: scheme.id,
        name: scheme.name,
        center_id: centerObj?.id || '',
        label_id: labelObj?.id || ''
      });
    }
  };

  const handleUpdateScheme = async (name, centerId, labelId) => {
    if (!editSchemeTarget) return;
    try {
      await updateMarkingScheme(editSchemeTarget.id, name, centerId, labelId);
      setToastMessage(`Scheme updated successfully!`);
      setTimeout(() => setToastMessage(''), 3000);
      fetchSchemes();
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to update marking scheme.');
      setTimeout(() => setToastMessage(''), 3000);
    }
    setEditSchemeTarget(null);
  };

  const handleDeleteSchemeAction = async (schemeId, name) => {
    setDeleteSchemeTarget({ id: schemeId, name });
  };

  const confirmDeleteScheme = async () => {
    if (!deleteSchemeTarget) return;
    try {
      await deleteScheme(deleteSchemeTarget.id);
      setToastMessage(`Scheme '${deleteSchemeTarget.name}' deleted successfully!`);
      setTimeout(() => setToastMessage(''), 3000);
      fetchSchemes();
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to delete scheme.');
      setTimeout(() => setToastMessage(''), 3000);
    }
    setDeleteSchemeTarget(null);
  };

  const handleToggleStatus = async (schemeId, currentStatus) => {
    await toggleSchemeStatus(schemeId, !currentStatus);
    fetchSchemes();
  };

  const handleCancelEdit = async () => {
    if (editSchemeId && editSchemeId !== 'new') {
      const scheme = schemes.find(s => s.id === editSchemeId);
      if (scheme?.isProvisional) {
        await deleteScheme(editSchemeId);
        setSchemes(prev => prev.filter(s => s.id !== editSchemeId));
      }
    }
    setEditSchemeId(null);
    setIsDirty(false);
    setSchemeDraft([]);
  };

  const handleDeleteActivity = async (activityId) => {
    setDeleteActivityTarget(activityId);
  };

  const confirmDeleteActivity = () => {
    if (!deleteActivityTarget) return;
    setSchemeDraft(prev => prev.filter(a => a.id !== deleteActivityTarget));
    setIsDirty(true);
    setDeleteActivityTarget(null);
  };

  const handleAddActivity = (newActivity) => {
    setSchemeDraft(prev => [...prev, newActivity]);
    setIsDirty(true);
    setShowPickerModal(false);
  };

  const handleSaveFlow = () => {
    const schemeObj = schemes.find(s => s.id === editSchemeId);
    if (editModeType === 'mutate' && editSchemeId !== 'new' && !schemeObj?.isProvisional) {
      handleCreateScheme(schemeObj.name); // Skips name modal, passes existing name
    } else {
      setShowNameModal(true);
    }
  };

  const handleCreateScheme = async (name, assignCenterId = null, assignLabelId = null) => {
    try {
      const res = await createScheme(name, assignCenterId, assignLabelId);
      setShowNameModal(false);

      setToastMessage(`Scheme '${name}' created successfully!`);
      fetchSchemes();

      setTimeout(() => {
        setToastMessage('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to create marking scheme.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const renderActivitiesList = (schemeId, isEditing) => {
    let activities = isEditing ? schemeDraft : (schemeActivitiesCache[schemeId] || []);

    activities = activities.slice(0, 3);

    if (activities.length === 0) {
      return (
        <div className="bg-gray-50 dark:bg-[rgba(0,0,0,0.2)] rounded-[8px] p-4 mb-[16px] text-center text-[11px] text-[#6b7a99]">
          No activities configured yet.
        </div>
      );
    }

    return (
      <div className="bg-gray-50 dark:bg-[rgba(0,0,0,0.2)] rounded-[8px] p-[10px] mb-[16px]">
        {activities.map((act, idx) => (
          <div key={act.id} className={`flex justify-between items-center ${idx < activities.length - 1 ? 'border-b border-gray-300 dark:border-[rgba(255,255,255,0.05)] pb-2 mb-2' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-[12px]">{act.icon}</span>
              <span className="text-[11px] font-normal text-gray-500 dark:text-[#8899bb]">{act.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6]">{act.maxMarks} pts</div>
                <div className="text-[10px] font-normal text-gray-400 dark:text-[#6b7a99]">max {act.maxMarks} pts</div>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleDeleteActivity(act.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#6b7a99] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEditFooter = () => (
    <div className="mt-auto space-y-3">
      <button
        onClick={() => setShowPickerModal(true)}
        className="w-full py-2.5 rounded-[8px] border border-dashed border-[#1de9b6]/50 text-[#1de9b6] text-[12px] font-medium hover:bg-[#1de9b6]/10 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        Add marking scheme for activity
      </button>
      <div className="flex gap-2">
        <button
          onClick={handleCancelEdit}
          className="flex-1 py-2 rounded-[8px] bg-[rgba(255,255,255,0.05)] text-white text-[12px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveFlow}
          disabled={!isDirty}
          className="flex-1 py-2 rounded-[8px] bg-[#1de9b6] text-[#042C53] text-[12px] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Save
        </button>
      </div>
    </div>
  );

  const labelOptions = filterCenterId === 'all'
    ? groupSubgroups.flatMap(g => (g.labels || []).map(l => ({ ...l, displayName: `${l.name} (${g.name})` })))
    : (groupSubgroups.find(g => Number(g.center_id) === Number(filterCenterId))?.labels || []).map(l => ({ ...l, displayName: l.name }));

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1628] font-sans pb-28 transition-colors duration-300 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b1628]/80 backdrop-blur-md border-b border-gray-300 dark:border-[#112240] flex items-center justify-between px-6 py-4 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-[#6b7a99] hover:bg-gray-50 dark:hover:bg-[#112240] active:scale-90 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-[#0f172a] dark:text-[#ffffff] leading-none tracking-tight">Marking Schemes</h1>
            <p className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6] mt-1">Create, manage, and assign grading rules for groups and assessments.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setShowNameModal(true)}
            className="flex items-center gap-1.5 bg-[#1d4ed8] dark:bg-[#1de9b6] text-white dark:text-[#042C53] hover:bg-[#1e40af] dark:hover:opacity-90 px-4 py-2 rounded-[8px] text-[13px] font-semibold active:scale-95 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create New Scheme
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-[#112240] p-4 rounded-[16px] border border-slate-100 dark:border-[#1e293b] mb-6 shadow-sm">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-[#6b7a99] uppercase tracking-wider mb-1.5">Filter by Group</label>
            <select
              value={filterCenterId}
              onChange={(e) => {
                setFilterCenterId(e.target.value);
                setFilterLabelId('all'); // Reset label filter when group changes
              }}
              className="w-full bg-slate-50 dark:bg-[#0b1628] border border-slate-200 dark:border-[rgba(255,255,255,0.1)] rounded-[10px] p-2 text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[#1d4ed8] dark:focus:border-[#1de9b6] transition-colors"
            >
              <option value="all">All Groups</option>
              {groupSubgroups.map(c => (
                <option key={c.center_id} value={c.center_id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-[#6b7a99] uppercase tracking-wider mb-1.5">Filter by Sub Group</label>
            <select
              value={filterLabelId}
              disabled={labelOptions.length === 0}
              onChange={(e) => setFilterLabelId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b1628] border border-slate-200 dark:border-[rgba(255,255,255,0.1)] rounded-[10px] p-2 text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[#1d4ed8] dark:focus:border-[#1de9b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">All Sub Groups</option>
              {labelOptions.map(l => (
                <option key={l.id} value={l.id}>{l.displayName || l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Dynamic Schemes (Default + Configured Customs) */}
          {schemes.filter(scheme => {
            if (filterCenterId !== 'all') {
              const isLinked = schemeGroupsCache[scheme.id]?.some(g => Number(g.id) === Number(filterCenterId));
              if (!isLinked) return false;
            }
            if (filterLabelId !== 'all') {
              const isLinked = schemeLabelsCache[scheme.id]?.some(l => Number(l.id) === Number(filterLabelId));
              if (!isLinked) return false;
            }
            return true;
          }).map(scheme => {
            const isEditing = editSchemeId === scheme.id;
            const isEnabled = scheme.isEnabled !== false;
            const activities = schemeActivitiesCache[scheme.id] || [];
            const groups = schemeGroupsCache[scheme.id] || [];
            const labels = schemeLabelsCache[scheme.id] || [];
            const totalGroupsLinked = Number(scheme.appliedGroupCount || 0) + Number(scheme.appliedSubgroupCount || 0);
            const activityCount = activities.length || (scheme.isSystemDefault ? 3 : 0);
            const totalCriteria = activities.reduce((sum, act) => sum + (act.rows?.length || 0), 0) || (scheme.isSystemDefault ? 3 : 0);

            let statusText = 'Active';
            let statusClasses = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-[#1de9b6] dark:border-[#1de9b6]/15';

            if (!isEnabled) {
              statusText = 'Inactive';
              statusClasses = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-[rgba(255,255,255,0.05)] dark:text-[#6b7a99] dark:border-[rgba(255,255,255,0.1)]';
            }

            const iconBoxClasses = `w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${scheme.isSystemDefault
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
              }`;

            const cardClasses = `relative bg-white dark:bg-[#112240] rounded-[16px] p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col border border-slate-100 dark:border-[#1e293b] ${!isEnabled ? 'opacity-65 grayscale-[10%]' : ''}`;

            const formatDate = (dateStr) => {
              if (!dateStr) return '07/12/26';
              const d = new Date(dateStr);
              if (isNaN(d.getTime())) return '07/12/26';
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const yy = String(d.getFullYear()).substring(2);
              return `${mm}/${dd}/${yy}`;
            };

            return (
              <div key={scheme.id} className={cardClasses}>

                {/* Top Row: Icon + Title + Status Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={iconBoxClasses}>
                      {scheme.isSystemDefault ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-[14px] text-[#0f172a] dark:text-[#ffffff] leading-tight">{scheme.name}</h2>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-[#6b7a99] mt-0.5">{scheme.isSystemDefault ? '(Global)' : '(Custom)'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => !scheme.isSystemDefault && handleToggleStatus(scheme.id, isEnabled)}
                    disabled={scheme.isSystemDefault}
                    className={`px-2.5 py-0.5 rounded-[12px] text-[10px] font-semibold border transition-all ${statusClasses} ${!scheme.isSystemDefault ? 'cursor-pointer hover:opacity-85' : 'cursor-default'}`}
                  >
                    {statusText}
                  </button>
                </div>

                {/* Short Meta Description */}
                <p className="text-[12px] font-normal text-slate-500 dark:text-[#8899bb] mb-1">
                  {scheme.isSystemDefault ? 'Standard system grading and evaluation rules.' : 'Customized local grading and evaluation rules.'}
                </p>

                <p className="text-[10px] font-normal text-slate-400 dark:text-[#6b7a99] mb-3">
                  Created on: {scheme.isSystemDefault ? '07/12/26' : formatDate(scheme.created_at)}
                </p>

                <div className="border-t border-slate-100 dark:border-slate-800/40 my-3" />

                {/* Groups Associated Block */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-white uppercase tracking-wider">
                      {groups.length} Groups Associated
                    </span>
                    {groups.length > 0 && (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <span className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white dark:ring-[#112240] bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-500">A</span>
                        <span className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white dark:ring-[#112240] bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-500">B</span>
                        <span className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white dark:ring-[#112240] bg-teal-500 flex items-center justify-center text-[9px] font-bold text-white">+</span>
                      </div>
                    )}
                  </div>
                  {groups.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {groups.slice(0, 3).map(g => (
                        <span key={g.id} className="px-2.5 py-0.5 rounded-[6px] bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-[#8899bb] text-[10px] font-medium border border-slate-200/20">
                          {g.name}
                        </span>
                      ))}
                      {groups.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium self-center">+{groups.length - 3} more</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-normal italic">No groups assigned yet.</p>
                  )}
                </div>

                {/* Subgroups Associated Block */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-white uppercase tracking-wider">
                      {labels.length} Sub Groups Associated
                    </span>
                  </div>
                  {labels.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {labels.slice(0, 3).map(l => (
                        <span key={l.id} className="px-2.5 py-0.5 rounded-[6px] bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-[#8899bb] text-[10px] font-medium border border-slate-200/20">
                          {l.name}
                        </span>
                      ))}
                      {labels.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium self-center">+{labels.length - 3} more</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-normal italic">No sub groups linked.</p>
                  )}
                </div>

                {/* Activities Linked Block */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-white uppercase tracking-wider">
                      {activityCount} Activities Linked
                    </span>
                    {activities.length > 0 && (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <span className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white dark:ring-[#112240] bg-[#1de9b6]/10 flex items-center justify-center text-[10px]">📿</span>
                        <span className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white dark:ring-[#112240] bg-[#1de9b6]/10 flex items-center justify-center text-[10px]">📖</span>
                      </div>
                    )}
                  </div>
                  {activities.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activities.slice(0, 3).map(act => (
                        <span key={act.id} className="px-2.5 py-0.5 rounded-[6px] bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-[#8899bb] text-[10px] font-medium border border-slate-200/20">
                          {act.title}
                        </span>
                      ))}
                      {activities.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium self-center">+{activities.length - 3} more</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-normal italic">No activities linked.</p>
                  )}
                </div>

                {/* ── Footer Action Bar ─────────────────────────────────────────── */}
                <div className="mt-auto">
                  <div className="border-t border-slate-100 dark:border-[rgba(255,255,255,0.05)] pt-3 flex items-center justify-between gap-2">

                    {/* Left: action buttons */}
                    <div className="flex items-center gap-1.5">

                      {/* Add Rules — only for custom schemes */}
                      {!scheme.isSystemDefault && (
                        <button
                          onClick={() => navigate(`/counsellor/marking-scheme/add-rules/${scheme.id}`)}
                          title="Add Rules"
                          className="group flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-500 dark:hover:bg-[#1de9b6] text-teal-600 dark:text-[#1de9b6] hover:text-white dark:hover:text-[#042C53] border border-teal-200/50 dark:border-teal-500/20 hover:border-teal-500 transition-all duration-150 active:scale-95 text-[11px] font-bold"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Rules</span>
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => handleEditInitiate(scheme)}
                        title="Edit Scheme"
                        className="group flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-600 dark:hover:bg-blue-500 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200/50 dark:border-blue-500/20 hover:border-blue-600 transition-all duration-150 active:scale-95 text-[11px] font-bold"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>

                      {/* Delete — only for custom schemes (not system default) */}
                      {!scheme.isSystemDefault && (
                        <button
                          onClick={() => handleDeleteSchemeAction(scheme.id, scheme.name)}
                          title="Delete Scheme"
                          className="group flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-500 dark:hover:bg-rose-500 text-rose-500 dark:text-rose-400 hover:text-white border border-rose-200/50 dark:border-rose-500/20 hover:border-rose-500 transition-all duration-150 active:scale-95 text-[11px] font-bold"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    {/* Right: View Rules CTA */}
                    <button
                      onClick={() => navigate(scheme.isSystemDefault ? '/counsellor/marking-scheme/default' : `/counsellor/marking-scheme/${scheme.id}`)}
                      className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-[#1de9b6] hover:opacity-75 transition-opacity shrink-0"
                    >
                      View Rules
                      {totalCriteria > 0 && (
                        <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                          {totalCriteria}
                        </span>
                      )}
                      <svg className="w-3.5 h-3.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                  </div>
                </div>

              </div>
            );
          })}

        </div>
      </div>

      {editSchemeTarget && (
        <SchemeNameModal
          editingSchemeId={editSchemeTarget.id}
          initialCenterId={editSchemeTarget.center_id}
          initialLabelId={editSchemeTarget.label_id}
          onClose={() => setEditSchemeTarget(null)}
          onCreate={handleUpdateScheme}
        />
      )}

      {showPickerModal && (
        <SchemeActivityPickerModal
          onClose={() => setShowPickerModal(false)}
          onApply={handleAddActivity}
        />
      )}

      {showNameModal && (
        <SchemeNameModal
          onClose={() => setShowNameModal(false)}
          onCreate={handleCreateScheme}
        />
      )}

      {/* Delete Scheme Modal */}
      <ConfirmModal
        isOpen={!!deleteSchemeTarget}
        onClose={() => setDeleteSchemeTarget(null)}
        onConfirm={confirmDeleteScheme}
        title="Delete Marking Scheme"
        description={`Delete '${deleteSchemeTarget?.name}'? This will permanently remove this scheme and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Activity Modal */}
      <ConfirmModal
        isOpen={!!deleteActivityTarget}
        onClose={() => setDeleteActivityTarget(null)}
        onConfirm={confirmDeleteActivity}
        title="Remove Activity"
        description="Are you sure you want to remove this activity from the scheme?"
        confirmText="Remove"
        cancelText="Cancel"
      />

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-2 bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] px-5 py-3 rounded-full shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            <span className="text-[13px] font-bold">{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default MarkingScheme;
