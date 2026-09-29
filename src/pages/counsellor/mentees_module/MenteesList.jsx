import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import { getRequest, postRequest } from '../../../services/api';
import { processResponse } from '../../../utils/apiUtils';
import { openChatGPTWithPrompt } from '../../../utils/chatGptUtils';
import AiDateFilterModal from '../../../components/AiAnalysis/AiDateFilterModal';
import { exportBulkReportsToCSV, exportBulkReportsToExcel, exportBulkReportsToPDF } from '../../../utils/exportUtils';

// Generic themed confirmation dialog — replaces raw window.confirm() so every
// destructive action (Delete Group, Delete Subgroup, Remove Mentee) gets a
// proper "explain the consequence + cannot be undone" confirmation, per spec.
const ConfirmDialog = ({ isOpen, title, message, confirmLabel = 'Confirm', destructive = true, onConfirm, onCancel }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={onCancel} />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center">
          <div className={`w-16 h-16 ${destructive ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-xl font-extrabold text-[#0f172a] mb-2">{title}</h3>
          <p className="text-gray-500 text-sm font-medium mb-6 leading-relaxed whitespace-pre-line">{message}</p>
          <div className="flex flex-col gap-3">
            <button onClick={onConfirm} className={`w-full ${destructive ? 'bg-red-500' : 'bg-blue-600'} text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all`}>{confirmLabel}</button>
            <button onClick={onCancel} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl active:scale-95 transition-all">Cancel</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const MenteesList = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  // Default to "All" so every mentee is visible on load, per spec D
  // ("ALL mentees must appear" / never accidentally limited by a filter default).
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedLabel, setSelectedLabel] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Per-student ⋮ action menu (Edit Name / Change Group-Subgroup / Remove as Mentee)
  const [actionMenuStudent, setActionMenuStudent] = useState(null);

  // "Change Group/Subgroup" (single student) — reuses the existing
  // /assign-student-center-label endpoint.
  const [editingStudent, setEditingStudent] = useState(null);
  const [editGroup, setEditGroup] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editLabelsList, setEditLabelsList] = useState([]);

  // "Edit Name" (single student) — new /edit-mentee-name endpoint.
  const [namingStudent, setNamingStudent] = useState(null);
  const [nameDraft, setNameDraft] = useState('');

  // "Remove as Mentee" (single student) — new /remove-mentee endpoint.
  const [removingStudent, setRemovingStudent] = useState(null);

  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkGroup, setBulkGroup] = useState('');
  const [bulkLabel, setBulkLabel] = useState('');
  const [bulkLabelsList, setBulkLabelsList] = useState([]);

  // Group/Subgroup management (rename/delete), reachable from the Assign
  // Group popup per spec section I.
  const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
  const [editGroupTarget, setEditGroupTarget] = useState(null); // {id, name}
  const [deleteGroupTarget, setDeleteGroupTarget] = useState(null);
  const [isManageSubgroupsOpen, setIsManageSubgroupsOpen] = useState(false);
  const [manageSubgroupsCenterId, setManageSubgroupsCenterId] = useState('');
  const [subgroupsForManage, setSubgroupsForManage] = useState([]);
  const [editSubgroupTarget, setEditSubgroupTarget] = useState(null); // {label_id, label_name}
  const [editSubgroupDraft, setEditSubgroupDraft] = useState('');
  const [deleteSubgroupTarget, setDeleteSubgroupTarget] = useState(null);
  const [newSubgroupName, setNewSubgroupName] = useState('');

  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
  const [aiDateFrom, setAiDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [aiDateTo, setAiDateTo] = useState(new Date().toISOString().split('T')[0]);

  const SELECTION_LIMIT = 50;
  const observerTarget = useRef(null);

  const fetchCenters = useCallback(() => {
    getRequest('/group-list', { user_id: userDetails.user_id, page_no: 1 }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        setCenters(res.data);
      }
    });
  }, [userDetails.user_id]);

  const fetchLabels = useCallback((centerId, setList) => {
    if (!centerId || centerId === 'All' || centerId === 'Uncategorized') {
      if (setList) setList([]);
      return;
    }
    getRequest('/lable-list', { user_id: userDetails.user_id, center_id: centerId }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        const list = res.data.map(l => ({ id: l.label_id, name: l.label_name }));
        if (setList) setList(list);
      }
    });
  }, [userDetails.user_id]);

  const fetchStudents = useCallback((pageNum = 1, shouldAppend = false) => {
    setIsLoading(true);
    const payload = {
      user_id: userDetails.user_id,
      categroy: selectedGroup === 'Uncategorized' ? 'un-categorized' : (selectedGroup === 'All' ? 'all' : ''),
      page_no: pageNum,
      rowSelected: 30,
      center_id: (selectedGroup === 'All' || selectedGroup === 'Uncategorized') ? "" : selectedGroup,
      label_id: selectedLabel === 'All' ? "" : selectedLabel,
      search_text: searchQuery
    };

    getRequest('/student-list', payload, (response) => {
      const res = response.data;
      if (res && res.code === 200) {
        const rawData = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
        const mappedStudents = rawData.map(s => ({
          id: s.user_id,
          name: s.name,
          group: s.center_name || '',
          label: s.label_name || '',
          center_id: s.center_id,
          label_id: s.label_id,
          avatar: s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`,
          activities: s.activities || []
        }));
        setStudents(prev => shouldAppend ? [...prev, ...mappedStudents] : mappedStudents);
        setTotalPages(res.total_page || 1);
      }
      setIsLoading(false);
    }, () => setIsLoading(false));
  }, [userDetails.user_id, selectedGroup, selectedLabel, searchQuery]);

  useEffect(() => { fetchCenters(); }, [fetchCenters]);
  useEffect(() => {
    fetchLabels(selectedGroup, setLabels);
    setSelectedLabel('All');
  }, [selectedGroup, fetchLabels]);
  useEffect(() => { fetchStudents(1, false); setPage(1); }, [fetchStudents]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoading && page < totalPages) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchStudents(nextPage, true);
      }
    }, { threshold: 0.1 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [page, totalPages, isLoading, fetchStudents]);

  useEffect(() => { if (editGroup) fetchLabels(editGroup, setEditLabelsList); else setEditLabelsList([]); }, [editGroup, fetchLabels]);
  useEffect(() => { if (bulkGroup) fetchLabels(bulkGroup, setBulkLabelsList); else setBulkLabelsList([]); }, [bulkGroup, fetchLabels]);

  // Alphabetical A→Z, case-insensitive — applied client-side on every render
  // of the fetched set so search/filter/pagination all stay sorted, per spec D.
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  }, [students]);

  const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3500); };
  const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3500); };

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      if (prev.includes(id)) return prev.filter(sid => sid !== id);
      if (prev.length >= SELECTION_LIMIT) { showError(`Max ${SELECTION_LIMIT} students.`); return prev; }
      return [...prev, id];
    });
  };

  const refreshAfterMutation = () => { fetchStudents(1, false); setPage(1); };

  // ---------------------------------------------------------------------------
  // Bulk "Assign Group" (Group + Subgroup together) — reuses the existing
  // /assign-student-center-label endpoint (bulkAssignStudents on the backend).
  // ---------------------------------------------------------------------------
  const handleBulkAssign = () => {
    if (!bulkGroup) return showError("Select a group for assignment");
    const payload = {
      user_id: userDetails.user_id,
      student_ids: selectedStudents,
      center_id: bulkGroup,
      label_id: bulkLabel
    };
    postRequest('/assign-student-center-label', payload, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess(data.message?.[0] || data.message || 'Students assigned successfully');
        setIsBulkAssignOpen(false);
        setBulkGroup(''); setBulkLabel('');
        setSelectedStudents([]);
        refreshAfterMutation();
      } else {
        showError(data?.message?.[0] || data?.message || 'Failed to assign students');
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Single-student "Change Group/Subgroup"
  // ---------------------------------------------------------------------------
  const handleSingleAssign = () => {
    if (!editGroup) return showError("Select a group");
    const payload = {
      user_id: userDetails.user_id,
      student_ids: [editingStudent.id],
      center_id: editGroup,
      label_id: editLabel
    };
    postRequest('/assign-student-center-label', payload, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess(data.message?.[0] || data.message || 'Student updated successfully');
        setEditingStudent(null);
        refreshAfterMutation();
      } else {
        showError(data?.message?.[0] || data?.message || 'Failed to update student');
      }
    });
  };

  // ---------------------------------------------------------------------------
  // "Edit Name"
  // ---------------------------------------------------------------------------
  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) return showError("Name cannot be empty");
    postRequest('/edit-mentee-name', { user_id: userDetails.user_id, student_id: namingStudent.id, name: trimmed }, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess('Name updated successfully');
        setNamingStudent(null);
        refreshAfterMutation();
      } else {
        showError(data?.message?.[0] || data?.message || 'Failed to update name');
      }
    });
  };

  // ---------------------------------------------------------------------------
  // "Remove as Mentee" — relationship only. Never touches the student's
  // account, Sadhna records, or analytics history (see backend comment).
  // ---------------------------------------------------------------------------
  const confirmRemoveMentee = () => {
    if (!removingStudent) return;
    postRequest('/remove-mentee', { user_id: userDetails.user_id, student_id: removingStudent.id }, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess('Mentee removed successfully');
        setRemovingStudent(null);
        setSelectedStudents(prev => prev.filter(id => id !== removingStudent.id));
        refreshAfterMutation();
      } else {
        showError(data?.message?.[0] || data?.message || 'Failed to remove mentee');
        setRemovingStudent(null);
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Group management (rename/delete) — mirrors CounsellorAnalytics.jsx's
  // Dashboard-level Groups management so this page offers the same controls
  // per spec section I, without duplicating the AI/export/group-card UI.
  // ---------------------------------------------------------------------------
  const submitEditGroupTarget = () => {
    if (!editGroupTarget?.name?.trim()) return showError("Group name cannot be empty");
    postRequest('/edit-center', { user_id: userDetails.user_id, center_id: editGroupTarget.id, name: editGroupTarget.name.trim() }, (response) => {
      const { message, type } = processResponse(response.data);
      if (type === 'success') {
        showSuccess(message || "Group updated successfully");
        setEditGroupTarget(null);
        fetchCenters();
      } else {
        showError(message || "Failed to update group");
      }
    });
  };

  const submitDeleteGroupTarget = () => {
    if (!deleteGroupTarget) return;
    postRequest('/delete-center', { user_id: userDetails.user_id, center_id: deleteGroupTarget.id }, (response) => {
      const { message, type } = processResponse(response.data);
      if (type === 'success') {
        showSuccess(message || "Group deleted successfully");
        setDeleteGroupTarget(null);
        fetchCenters();
        if (selectedGroup === deleteGroupTarget.id) setSelectedGroup('All');
        if (bulkGroup === deleteGroupTarget.id) setBulkGroup('');
        refreshAfterMutation();
      } else {
        showError(message || "Failed to delete group");
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Subgroup (Label) management (rename/delete) for a chosen Group.
  // ---------------------------------------------------------------------------
  const openManageSubgroups = (centerId) => {
    if (!centerId) return showError("Select a group first to manage its subgroups");
    setManageSubgroupsCenterId(centerId);
    setIsManageSubgroupsOpen(true);
    getRequest('/lable-list', { user_id: userDetails.user_id, center_id: centerId }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) setSubgroupsForManage(res.data);
    });
  };

  const handleAddSubgroupInManage = () => {
    if (!newSubgroupName.trim()) return;
    postRequest('/add-lable', { user_id: userDetails.user_id, center_id: manageSubgroupsCenterId, lable_name: newSubgroupName.trim() }, (response) => {
      const resData = response.data;
      if (resData?.code === 200) {
        setNewSubgroupName('');
        openManageSubgroups(manageSubgroupsCenterId);
        if (manageSubgroupsCenterId === bulkGroup) fetchLabels(bulkGroup, setBulkLabelsList);
        if (manageSubgroupsCenterId === editGroup) fetchLabels(editGroup, setEditLabelsList);
        if (manageSubgroupsCenterId === selectedGroup) fetchLabels(selectedGroup, setLabels);
      } else {
        showError(processResponse(resData)?.message || 'Failed to add sub-group');
      }
    });
  };

  const submitEditSubgroupTarget = () => {
    if (!editSubgroupDraft.trim()) return setEditSubgroupTarget(null);
    postRequest('/edit-lable', { user_id: userDetails.user_id, label_id: editSubgroupTarget.label_id, lable_name: editSubgroupDraft.trim() }, (response) => {
      const resData = response.data;
      if (resData?.code === 200) {
        setEditSubgroupTarget(null);
        openManageSubgroups(manageSubgroupsCenterId);
        if (manageSubgroupsCenterId === bulkGroup) fetchLabels(bulkGroup, setBulkLabelsList);
        if (manageSubgroupsCenterId === editGroup) fetchLabels(editGroup, setEditLabelsList);
        if (manageSubgroupsCenterId === selectedGroup) fetchLabels(selectedGroup, setLabels);
      } else {
        showError(processResponse(resData)?.message || 'Failed to rename sub-group');
      }
    });
  };

  const submitDeleteSubgroupTarget = () => {
    if (!deleteSubgroupTarget) return;
    postRequest('/delete-lable', { user_id: userDetails.user_id, label_id: deleteSubgroupTarget.label_id }, (response) => {
      const resData = response.data;
      if (resData?.code === 200) {
        setDeleteSubgroupTarget(null);
        openManageSubgroups(manageSubgroupsCenterId);
        if (manageSubgroupsCenterId === bulkGroup) fetchLabels(bulkGroup, setBulkLabelsList);
        if (manageSubgroupsCenterId === editGroup) fetchLabels(editGroup, setEditLabelsList);
        if (manageSubgroupsCenterId === selectedGroup) fetchLabels(selectedGroup, setLabels);
        refreshAfterMutation();
      } else {
        showError(processResponse(resData)?.message || 'Failed to delete sub-group');
      }
    });
  };

  // ---------------------------------------------------------------------------
  // AI Analysis (bulk, selected students) — unchanged existing behavior.
  // ---------------------------------------------------------------------------
  const handleAiAnalysis = async () => {
    if (selectedStudents.length === 0) return showError("Select at least one student");
    if (!aiDateFrom || !aiDateTo) return showError("Select date range");

    const newWin = window.open('about:blank', '_blank');
    setIsAiAnalysisModalOpen(false);
    showSuccess("Collecting student data for ChatGPT...");

    const payload = {
      filter: 'custom',
      start_date: aiDateFrom,
      end_date: aiDateTo,
      student_ids: selectedStudents
    };

    let reportRows = [];
    try {
      const res = await postRequest('/export-bulk-student-reports', payload);
      const data = res?.data;
      if (data?.status === 1 && Array.isArray(data.data) && data.data.length > 0) {
        reportRows = data.data;
      }
    } catch (err) {
      console.warn("Could not fetch bulk report for ChatGPT prompt, using local student state:", err);
    }

    let studentDataText = "";
    const selectedStudentObjects = students.filter(s => selectedStudents.includes(s.id));

    if (reportRows.length > 0) {
      const grouped = {};
      reportRows.forEach(row => {
        const key = row.student_name || 'Unknown Student';
        if (!grouped[key]) {
          grouped[key] = {
            mobile: row.mobile || 'N/A',
            center: row.center_name || 'N/A',
            label: row.label_name || 'Uncategorized',
            activities: []
          };
        }
        if (row.activity_name) {
          grouped[key].activities.push({
            date: row.activity_date || '',
            name: row.activity_name || '',
            value: row.activity_value ?? '',
            marks: row.activity_marks ?? ''
          });
        }
      });

      studentDataText = Object.entries(grouped).map(([name, info], idx) => {
        const actLines = info.activities.map(a => `  - Date: ${a.date} | Activity: ${a.name} | Value: ${a.value} | Marks: ${a.marks}`).join('\n');
        return `Student #${idx + 1}: ${name} (Mobile: ${info.mobile}, Group: ${info.center}, Sub-Group: ${info.label})\nActivities Logged:\n${actLines || '  - No activity logs recorded in this period'}`;
      }).join('\n\n');
    } else {
      studentDataText = selectedStudentObjects.map((s, idx) => {
        const acts = Array.isArray(s.activities) && s.activities.length > 0
          ? s.activities.map(a => `  - ${a.name || a.activity_name}: ${a.value ?? a.count ?? 0} (Marks: ${a.marks ?? 0})`).join('\n')
          : '  - No detailed activity breakdown available';
        return `Student #${idx + 1}: ${s.name || 'N/A'} (Group: ${s.group || 'Uncategorised'}, Subgroup: ${s.label || 'Uncategorised'})\nActivities:\n${acts}`;
      }).join('\n\n');
    }

    const fullPrompt = `Please analyze the following Sadhana (spiritual practice) performance data for my mentee(s) over the specified period and provide a comprehensive, actionable counseling analysis:

========================================
MENTEE GROUP & PERFORMANCE DATA
========================================
- Time Duration: ${aiDateFrom} to ${aiDateTo}
- Total Mentees Analyzed: ${selectedStudents.length}

MENTEE DETAILS & ACTIVITY LOGS:
${studentDataText}

========================================
ANALYSIS & COUNSELING REQUEST
========================================
Please provide:
1. OVERALL SUMMARY: Executive summary of student Sadhana consistency, chanting, reading, wake-up times, and overall engagement during ${aiDateFrom} to ${aiDateTo}.
2. STRENGTHS & HIGHLIGHTS: Key areas where mentees are excelling.
3. LAGGINGS & CONCERNS: Critical gaps (e.g., missed japa rounds, irregular wake-up times, low reading/chanting marks).
4. COUNSELOR RECOMMENDATIONS: Specific, empathetic counseling advice and strategies for the counselor to motivate and guide these mentees effectively.`;

    await openChatGPTWithPrompt(fullPrompt, newWin);
  };

  // ---------------------------------------------------------------------------
  // Export (selected students) — reuses the SAME working export pipeline as
  // GroupMenteesList.jsx (/export-bulk-student-reports + exportUtils), instead
  // of the previous non-functional format buttons.
  // ---------------------------------------------------------------------------
  const handleExport = async (format) => {
    if (selectedStudents.length === 0) return showError("Select at least one student");

    showSuccess('Preparing export file...');
    const startDate = '2000-01-01';
    const endDate = new Date().toISOString().split('T')[0];

    let exportData = [];
    try {
      const payload = {
        filter: 'all',
        start_date: startDate,
        end_date: endDate,
        student_ids: selectedStudents
      };
      const res = await postRequest('/export-bulk-student-reports', payload);
      const data = res?.data;
      if (data?.status === 1 && Array.isArray(data.data)) {
        exportData = data.data;
      } else {
        showError(data?.message?.[0] || data?.message || "Export failed: unable to fetch report data.");
        return;
      }
    } catch (error) {
      console.error("Export endpoint error:", error);
      showError("Export failed: unable to fetch data from server.");
      return;
    }

    if (exportData.length === 0) {
      showError("No data available to export for the selected mentees.");
      return;
    }

    const filename = `mentees_export_${new Date().getTime()}`;
    const normalizedFmt = (format || '').toUpperCase();
    if (normalizedFmt.includes('EXCEL') || normalizedFmt.includes('XLS')) {
      await exportBulkReportsToExcel(exportData, `${filename}.xlsx`, startDate, endDate);
    } else if (normalizedFmt.includes('CSV')) {
      exportBulkReportsToCSV(exportData, `${filename}.csv`, startDate, endDate);
    } else {
      await exportBulkReportsToPDF(exportData, 'all_time', `${filename}.pdf`, startDate, endDate);
    }

    showSuccess('Export file generated successfully!');
    setIsDownloadModalOpen(false);
  };

  const groupSubgroupLabel = (student) => {
    if (!student.group) return 'Uncategorised';
    if (student.label) return `${student.group} • ${student.label}`;
    return student.group;
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-[84px]">
      <AnimatePresence>
        {errorMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-red-100">{errorMessage}</div></motion.div>)}
        {successMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-green-100">{successMessage}</div></motion.div>)}
      </AnimatePresence>

      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white z-20 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="text-[#64748b] font-bold">Back</button>
          <h1 className="text-[17px] font-extrabold text-[#0f172a] text-center leading-tight">Mentees n<br/>Group Management</h1>
          <button onClick={() => selectedStudents.length > 0 ? setSelectedStudents([]) : setSelectedStudents(sortedStudents.slice(0, SELECTION_LIMIT).map(s=>s.id))} className="text-[#1a73e8] font-bold shrink-0">{selectedStudents.length > 0 ? 'Clear' : 'Select'}</button>
        </div>

        <div className="px-6 py-4">
          <input type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#f8fafc] rounded-full py-3.5 px-6 text-[15px] outline-none" />
        </div>

        <div className="px-6 pb-4 flex gap-3 overflow-x-auto hide-scrollbar">
          <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedLabel('All'); setLabels([]); }} className={`shrink-0 rounded-full px-5 py-2.5 font-bold text-[13px] outline-none border-none ${selectedGroup !== 'All' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
            <option value="All">All Groups</option>
            <option value="Uncategorized">Uncategorised</option>
            {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
          </select>

          <select value={selectedLabel} onChange={(e) => setSelectedLabel(e.target.value)} disabled={selectedGroup === 'All' || selectedGroup === 'Uncategorized'} className={`shrink-0 rounded-full px-5 py-2.5 font-bold text-[13px] outline-none border-none disabled:opacity-50 ${selectedLabel !== 'All' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
            <option value="All">All Subgroups</option>
            {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        {isLoading && students.length === 0 ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : sortedStudents.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 font-medium">No mentees found for this search/filter.</div>
        ) : (
          <div className="px-2">
            {sortedStudents.map(student => (
              <div key={student.id} className="flex items-center px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <button onClick={() => toggleStudent(student.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mr-3 shrink-0 ${selectedStudents.includes(student.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
                  {selectedStudents.includes(student.id) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>
                <div onClick={() => navigate(`/counsellor/mentee/${student.id}`, { state: { student } })} className="flex items-center flex-1 min-w-0 cursor-pointer gap-3">
                  <img src={student.avatar} className="w-11 h-11 rounded-full border border-gray-100 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-[15px] text-[#0f172a] truncate">{student.name}</h3>
                    <p className={`text-[12px] font-medium truncate ${student.group ? 'text-gray-400' : 'text-gray-300 italic'}`}>{groupSubgroupLabel(student)}</p>
                  </div>
                </div>
                <button onClick={() => setActionMenuStudent(student)} className="p-2 text-gray-300 hover:text-gray-900 transition-colors shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
              </div>
            ))}
            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {isLoading && students.length > 0 && <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
            </div>
          </div>
        )}
      </div>

      {/* Sticky selection action bar */}
      <AnimatePresence>
        {selectedStudents.length > 0 && (
          <motion.div
            drag="y"
            dragConstraints={{ top: -340, bottom: 0 }}
            dragElastic={0.08}
            dragMomentum={false}
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-[84px] left-0 right-0 max-w-md mx-auto z-40 px-4 touch-none select-none"
          >
            <div className="bg-[#1a73e8] rounded-[32px] shadow-2xl shadow-blue-500/40 w-full relative">
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1.5 rounded-full bg-white/40" />
              </div>
              <div className="px-5 pb-5 pt-2">
                <div className="flex justify-between items-center mb-4 text-white px-2">
                  <span className="font-extrabold text-[15px]">{selectedStudents.length} Students Selected</span>
                  <button onClick={() => setSelectedStudents([])} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center touch-auto"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsBulkAssignOpen(true)} className="touch-auto flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,9V6H3V9H0V11H3V14H5V11H8V9H5Z" /></svg>Assign Group</button>
                  <button onClick={() => setIsAiAnalysisModalOpen(true)} className="touch-auto flex-1 bg-white text-[#1a73e8] rounded-2xl py-3.5 font-black text-[13px] flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93M13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07M12 11.5A1.5 1.5 0 0 1 10.5 10A1.5 1.5 0 0 1 12 8.5A1.5 1.5 0 0 1 13.5 10A1.5 1.5 0 0 1 12 11.5M12 15.5A1.5 1.5 0 0 1 10.5 14A1.5 1.5 0 0 1 12 12.5A1.5 1.5 0 0 1 13.5 14A1.5 1.5 0 0 1 12 15.5Z" /></svg>AI Analysis</button>
                  <button onClick={() => setIsDownloadModalOpen(true)} className="touch-auto flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>Export</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⋮ Per-student action menu: Edit Name / Change Group-Subgroup / Remove as Mentee */}
      <AnimatePresence>
        {actionMenuStudent && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setActionMenuStudent(null)} className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-[2px] z-[80]" />
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 bg-white rounded-t-[32px] shadow-2xl z-[90] flex flex-col px-6 pb-8 pt-4">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              <h2 className="text-lg font-extrabold text-center mb-1">{actionMenuStudent.name}</h2>
              <p className="text-gray-400 text-sm text-center mb-6">{groupSubgroupLabel(actionMenuStudent)}</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setNameDraft(actionMenuStudent.name); setNamingStudent(actionMenuStudent); setActionMenuStudent(null); }} className="w-full bg-gray-50 text-gray-800 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit Name
                </button>
                <button onClick={() => { setEditingStudent(actionMenuStudent); setEditGroup(actionMenuStudent.center_id || ''); setEditLabel(actionMenuStudent.label_id || ''); setActionMenuStudent(null); }} className="w-full bg-blue-50 text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1a4 4 0 10-4-4 4 4 0 004 4zm6-2a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Change Group/Subgroup
                </button>
                <button onClick={() => { setRemovingStudent(actionMenuStudent); setActionMenuStudent(null); }} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
                  Remove as Mentee
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Name modal */}
      <AnimatePresence>
        {namingStudent && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setNamingStudent(null)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px]">
              <h2 className="text-xl font-black mb-6">Edit Mentee Name</h2>
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border border-transparent focus:border-blue-200 mb-6"
                placeholder="Student name"
                autoFocus
              />
              <button onClick={handleSaveName} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl mb-3">Save Name</button>
              <button onClick={()=>setNamingStudent(null)} className="w-full py-3 text-gray-400 font-bold">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Mentee confirmation */}
      <ConfirmDialog
        isOpen={!!removingStudent}
        title={`Remove ${removingStudent?.name || 'this mentee'} as your mentee?`}
        message={`This will remove the mentor–mentee relationship only.\n\n${removingStudent?.name || 'The student'}'s account and Sadhna data will remain intact.\n\nThis action cannot be undone.`}
        confirmLabel="Remove Mentee"
        onConfirm={confirmRemoveMentee}
        onCancel={() => setRemovingStudent(null)}
      />

      {/* Modals Bundle */}
      <AnimatePresence>
        <AiDateFilterModal
          isOpen={isAiAnalysisModalOpen}
          onClose={() => setIsAiAnalysisModalOpen(false)}
          title="AI Mentee Analysis"
          subtitle={`Analyzing ${selectedStudents.length} selected mentees`}
          strategy="BULK_MENTEES"
          entityParams={{
            studentIds: selectedStudents,
            fallbackStudents: students.filter(s => selectedStudents.includes(s.id)),
            userId: userDetails?.user_id
          }}
        />

        {isBulkAssignOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setIsBulkAssignOpen(false)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[48px]">
               <h2 className="text-2xl font-black mb-6">Assign {selectedStudents.length} Students</h2>
               <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Group</label>
                      <button onClick={() => setIsManageGroupsOpen(true)} className="text-[11px] font-bold text-blue-600">Manage Groups</button>
                    </div>
                    <select value={bulkGroup} onChange={e=>setBulkGroup(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border-none">
                      <option value="">Select Group</option>
                      {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Subgroup</label>
                      <button onClick={() => openManageSubgroups(bulkGroup)} disabled={!bulkGroup} className="text-[11px] font-bold text-blue-600 disabled:opacity-40">Manage Subgroups</button>
                    </div>
                    <select value={bulkLabel} onChange={e=>setBulkLabel(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border-none" disabled={!bulkGroup}>
                      <option value="">Select Subgroup</option>
                      {bulkLabelsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <button onClick={handleBulkAssign} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Assign {selectedStudents.length} Students</button>
                  <button onClick={()=>setIsBulkAssignOpen(false)} className="w-full py-4 text-gray-400 font-bold">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {editingStudent && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setEditingStudent(null)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[48px]">
               <h2 className="text-2xl font-black mb-1">{editingStudent.name}</h2>
               <p className="text-gray-400 font-bold mb-6">Change Group / Subgroup</p>
               <div className="space-y-5">
                  <select value={editGroup} onChange={e=>setEditGroup(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none">
                    <option value="">Select Group</option>
                    {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
                  </select>
                  <select value={editLabel} onChange={e=>setEditLabel(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none" disabled={!editGroup}>
                    <option value="">Select Subgroup</option>
                    {editLabelsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <button onClick={handleSingleAssign} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Save Changes</button>
                  <button onClick={()=>setEditingStudent(null)} className="w-full py-4 text-gray-400 font-bold">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {isDownloadModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsDownloadModalOpen(false)} className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
             <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-10 rounded-t-[48px]">
                <h2 className="text-2xl font-black mb-2">Export {selectedStudents.length} Students</h2>
                <p className="text-gray-400 font-bold mb-8 text-sm">Full activity history, all formats</p>
                <div className="space-y-3">
                   <button onClick={() => handleExport('Excel')} className="w-full p-5 bg-gray-50 rounded-2xl font-bold flex items-center justify-between group hover:bg-blue-50 transition-colors">
                      <span className="group-hover:text-blue-600">Excel (.xlsx)</span>
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9V3.5L18.5,9H13Z" /></svg>
                   </button>
                   <button onClick={() => handleExport('CSV')} className="w-full p-5 bg-gray-50 rounded-2xl font-bold flex items-center justify-between group hover:bg-blue-50 transition-colors">
                      <span className="group-hover:text-blue-600">CSV (.csv)</span>
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9V3.5L18.5,9H13Z" /></svg>
                   </button>
                   <button onClick={() => handleExport('PDF')} className="w-full p-5 bg-gray-50 rounded-2xl font-bold flex items-center justify-between group hover:bg-blue-50 transition-colors">
                      <span className="group-hover:text-blue-600">Print PDF</span>
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9V3.5L18.5,9H13Z" /></svg>
                   </button>
                   <button onClick={()=>setIsDownloadModalOpen(false)} className="w-full py-6 text-gray-400 font-bold">Close</button>
                </div>
             </motion.div>
          </motion.div>
        )}

        {/* Manage Groups (rename/delete) — "Uncategorised" is a system state,
            never listed here since it isn't a row in `centers`. */}
        {isManageGroupsOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsManageGroupsOpen(false)} className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end justify-center">
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px] max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-black mb-6">Manage Groups</h2>
              <div className="space-y-2">
                {centers.length === 0 ? (
                  <p className="text-sm text-gray-400 font-medium italic text-center py-4">No groups created yet.</p>
                ) : centers.map(c => (
                  <div key={c.center_id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                    <span className="font-bold text-[#0f172a] text-sm">{c.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setEditGroupTarget({ id: c.center_id, name: c.name })} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => setDeleteGroupTarget({ id: c.center_id, name: c.name })} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={()=>setIsManageGroupsOpen(false)} className="w-full mt-6 py-4 text-gray-400 font-bold">Close</button>
            </motion.div>
          </motion.div>
        )}

        {editGroupTarget && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setEditGroupTarget(null)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px]">
              <h2 className="text-xl font-black mb-6">Rename Group</h2>
              <input type="text" value={editGroupTarget.name} onChange={(e) => setEditGroupTarget({ ...editGroupTarget, name: e.target.value })} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border border-transparent focus:border-blue-200 mb-6" autoFocus />
              <button onClick={submitEditGroupTarget} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl mb-3">Save Changes</button>
              <button onClick={()=>setEditGroupTarget(null)} className="w-full py-3 text-gray-400 font-bold">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        <ConfirmDialog
          isOpen={!!deleteGroupTarget}
          title={`Delete '${deleteGroupTarget?.name}'?`}
          message={`All students currently assigned to this group will be moved to Uncategorised and their subgroup assignment will be cleared.\n\nTheir accounts and Sadhna records will NOT be deleted.\n\nThis action cannot be undone.`}
          confirmLabel="Delete Group"
          onConfirm={submitDeleteGroupTarget}
          onCancel={() => setDeleteGroupTarget(null)}
        />

        {/* Manage Subgroups (rename/delete) for the chosen Group */}
        {isManageSubgroupsOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsManageSubgroupsOpen(false)} className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end justify-center">
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px] max-h-[85vh] overflow-y-auto">
              <h2 className="text-xl font-black mb-6">Manage Subgroups</h2>
              <div className="space-y-2 mb-4">
                {subgroupsForManage.length === 0 ? (
                  <p className="text-sm text-gray-400 font-medium italic text-center py-2">No subgroups exist yet.</p>
                ) : subgroupsForManage.map(l => (
                  <div key={l.label_id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                    <span className="font-bold text-[#0f172a] text-sm">{l.label_name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditSubgroupTarget(l); setEditSubgroupDraft(l.label_name); }} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => setDeleteSubgroupTarget(l)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-6">
                <input type="text" placeholder="Add subgroup..." value={newSubgroupName} onChange={(e) => setNewSubgroupName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubgroupInManage(); }} className="flex-1 bg-gray-50 rounded-2xl py-4 px-5 text-[14px] font-medium outline-none border border-transparent focus:border-blue-200" />
                <button onClick={handleAddSubgroupInManage} disabled={!newSubgroupName.trim()} className="w-[50px] h-[50px] bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              <button onClick={()=>setIsManageSubgroupsOpen(false)} className="w-full py-4 text-gray-400 font-bold">Close</button>
            </motion.div>
          </motion.div>
        )}

        {editSubgroupTarget && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setEditSubgroupTarget(null)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px]">
              <h2 className="text-xl font-black mb-6">Rename Subgroup</h2>
              <input type="text" value={editSubgroupDraft} onChange={(e) => setEditSubgroupDraft(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border border-transparent focus:border-blue-200 mb-6" autoFocus />
              <button onClick={submitEditSubgroupTarget} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl mb-3">Save Changes</button>
              <button onClick={()=>setEditSubgroupTarget(null)} className="w-full py-3 text-gray-400 font-bold">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        <ConfirmDialog
          isOpen={!!deleteSubgroupTarget}
          title={`Delete '${deleteSubgroupTarget?.label_name}'?`}
          message={`Students in this subgroup will NOT be deleted. Their Group stays unchanged, but their Subgroup will be cleared to Uncategorised.\n\nThis action cannot be undone.`}
          confirmLabel="Delete Subgroup"
          onConfirm={submitDeleteSubgroupTarget}
          onCancel={() => setDeleteSubgroupTarget(null)}
        />
      </AnimatePresence>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default MenteesList;
