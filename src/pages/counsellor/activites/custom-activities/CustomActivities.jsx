import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../../../components/shared/ThemeToggle';
import CreateNewActivity from './CreateNewActivity';
import { getRequest, postRequest } from '../../../../services/api';

const CustomActivities = () => {
    const navigate = useNavigate();
    const { userDetails } = useOutletContext();

    // States
    const [assignedActivities, setAssignedActivities] = useState([]);
    const [availableActivities, setAvailableActivities] = useState([]);
    const [centers, setCenters] = useState([]);
    const [labels, setLabels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedLabel, setSelectedLabel] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const SELECTION_LIMIT = 50;

    const fetchCenters = useCallback(() => {
        getRequest('/group-subgroup-list', { user_id: userDetails.user_id }, (response) => {
            const res = response.data;
            if (res && res.code === 200 && Array.isArray(res.data)) {
                setCenters(res.data);
            }
        });
    }, [userDetails.user_id]);

    // Fetch all assigned activities (status === 1)
    const fetchAssignedActivities = useCallback(() => {
        if (!selectedGroup) return;
        const payload = {
            user_id: userDetails.user_id,
            page_no: 1,
            center_id: selectedGroup,
            label_id: selectedLabel,
            rowSelected: 1000
        };
        getRequest('/selectable-activities-list', payload, (response) => {
            const res = response.data;
            if (res && res.code === 200) {
                const rawData = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
                const mapped = rawData
                    .filter(s => s.status === 1)
                    .map(s => ({
                        id: s.master_activity_id,
                        name: s.name,
                        activity_type: s.activity_type || 'Activity',
                        status: s.status,
                        original_status: s.original_status
                    }));
                setAssignedActivities(mapped);
            }
        });
    }, [userDetails.user_id, selectedGroup, selectedLabel]);

    // Fetch paginated available activities (status !== 1)
    const fetchAvailableActivities = useCallback((pageNum = 1, shouldAppend = false) => {
        if (!selectedGroup) return;
        setIsLoading(true);
        const payload = {
            user_id: userDetails.user_id,
            page_no: pageNum,
            center_id: selectedGroup,
            label_id: selectedLabel,
            search_text: searchQuery,
            rowSelected: 15,
            only_available: 1
        };

        getRequest('/selectable-activities-list', payload, (response) => {
            const res = response.data;
            if (res && res.code === 200) {
                const rawData = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
                const mapped = rawData
                    .filter(s => s.status !== 1) // Safe fallback local filter
                    .map(s => ({
                        id: s.master_activity_id,
                        name: s.name,
                        activity_type: s.activity_type || 'Activity',
                        status: s.status,
                        original_status: s.original_status,
                        avatar: s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`
                    }));
                setAvailableActivities(prev => {
                    return shouldAppend ? [...prev, ...mapped] : mapped;
                });
                setTotalPages(res.total_page || 1);
            }
            setIsLoading(false);
        });
    }, [userDetails.user_id, selectedGroup, selectedLabel, searchQuery]);

    useEffect(() => { fetchCenters(); }, [fetchCenters]);

    useEffect(() => {
        if (centers.length > 0 && !selectedGroup) {
            setSelectedGroup(String(centers[0].center_id));
        }
    }, [centers, selectedGroup]);

    useEffect(() => {
        if (selectedGroup) {
            const center = centers.find(c => String(c.center_id) === String(selectedGroup));
            setLabels(center?.labels || []);
        } else {
            setLabels([]);
        }
        setSelectedLabel('');
    }, [selectedGroup, centers]);

    useEffect(() => {
        if (selectedGroup) {
            fetchAssignedActivities();
            fetchAvailableActivities(1, false);
            setPage(1);
            setSelectedStudents([]);
        } else {
            setAssignedActivities([]);
            setAvailableActivities([]);
        }
    }, [selectedGroup, selectedLabel, searchQuery, fetchAssignedActivities, fetchAvailableActivities]);

    const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };
    const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };

    const toggleStudent = (id) => {
        setSelectedStudents(prev => {
            if (prev.includes(id)) return prev.filter(sid => sid !== id);
            if (prev.length >= SELECTION_LIMIT) { showError(`Max ${SELECTION_LIMIT} activities selected.`); return prev; }
            return [...prev, id];
        });
    };

    const handleBulkAssign = () => {
        if (!selectedGroup) {
            return showError("Please select a Group first.");
        }
        const payload = {
            user_id: userDetails.user_id,
            master_activity_ids: selectedStudents,
            center_id: selectedGroup,
            label_id: selectedLabel
        };
        postRequest('/assign-group-activities', payload, (res) => {
            const data = res.data;
            if (data?.status === 1) {
                showSuccess(data.message || 'Activities assigned successfully');
                fetchAssignedActivities();
                fetchAvailableActivities(1, false);
                setPage(1);
                setSelectedStudents([]);
            } else {
                showError(data?.message || 'Failed to assign activities');
            }
        });
    };

    const handleRemoveGroupCustomActivity = (activityId, name) => {
        if (!selectedGroup) {
            return showError("Please select a Group first.");
        }
        if (window.confirm(`Remove "${name}" from this group? This will delete all student logs for it in this group.`)) {
            const payload = {
                center_id: selectedGroup,
                label_id: selectedLabel,
                master_activity_id: activityId
            };
            postRequest('/delete-assigned-custom-activity', payload, (res) => {
                const data = res.data;
                if (data?.status === 1) {
                    showSuccess(data.message?.[0] || 'Removed custom activity successfully');
                    fetchAssignedActivities();
                    fetchAvailableActivities(1, false);
                    setPage(1);
                } else {
                    showError(data?.message?.[0] || 'Failed to remove custom activity');
                }
            });
        }
    };

    const handleCreateActivity = async (activityData) => {
        const payload = {
            counsellor_id: userDetails.user_id,
            name: activityData.name,
            activity_type: activityData.activityType,
            unit: activityData.unit,
            target: activityData.target || 0
        };
        postRequest('/create-custom-activity', payload, (res) => {
            const data = res.data;
            if (data?.status === 1) {
                showSuccess(data.message || 'Custom activity created successfully');
                setIsCreateActivityOpen(false);
                fetchAvailableActivities(1, false);
                setPage(1);
            } else {
                showError(data?.message || 'Failed to create custom activity');
            }
        });
    };

    const handleDeleteCustomActivity = (activityId, name) => {
        if (window.confirm(`Permanently delete "${name}"? This removes it from ALL groups and deletes all student records.`)) {
            const payload = {
                master_activity_id: activityId,
                user_id: userDetails.user_id
            };
            postRequest('/delete-custom-activity', payload, (res) => {
                const data = res.data;
                if (data?.status === 1) {
                    showSuccess(data.message?.[0] || 'Custom activity deleted successfully');
                    fetchAvailableActivities(1, false);
                    setPage(1);
                } else {
                    showError(data?.message?.[0] || 'Failed to delete custom activity');
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1628] font-sans pb-32 transition-colors duration-300 flex flex-col">
            <AnimatePresence>
                {errorMessage && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 left-0 right-0 z-[100] flex justify-center">
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-red-100 dark:border-red-900/30">{errorMessage}</div>
                    </motion.div>
                )}
                {successMessage && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 left-0 right-0 z-[100] flex justify-center">
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-green-100 dark:border-green-900/30">{successMessage}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b1628]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#112240] flex items-center justify-between px-6 py-4 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-[#6b7a99] hover:bg-gray-100 dark:hover:bg-[#112240] active:scale-90 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-[16px] font-semibold text-[#0f172a] dark:text-[#ffffff] leading-none tracking-tight">Custom Activities</h1>
                        <p className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6] mt-1">Assign custom activities to groups and sub-groups</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>

            {/* Main Content Container */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col">

                {/* Selectors Card */}
                <div className="bg-white dark:bg-[#112240] rounded-[16px] p-5 shadow-sm border border-gray-200 dark:border-[rgba(255,255,255,0.05)] mb-6 flex flex-col sm:flex-row gap-4 items-center transition-all duration-300">
                    <div className="flex-1 w-full relative">
                        <label className="text-[10px] font-bold text-[#6b7a99] dark:text-[#8899bb] uppercase tracking-wider block mb-1.5">Group</label>
                        <select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="appearance-none w-full bg-slate-50 dark:bg-[#0b1628] border border-gray-200 dark:border-slate-800 focus:border-teal-500 dark:focus:border-[#1de9b6] rounded-xl px-4 py-2.5 font-bold text-[13px] text-gray-800 dark:text-[#F8FAFC] outline-none transition-colors duration-300"
                        >
                            <option value="">-- Select Group --</option>
                            {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
                        </select>
                        <svg className="w-4 h-4 absolute right-3 bottom-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="flex-1 w-full relative">
                        <label className="text-[10px] font-bold text-[#6b7a99] dark:text-[#8899bb] uppercase tracking-wider block mb-1.5">Sub-Group (Label)</label>
                        <select
                            value={selectedLabel}
                            onChange={(e) => setSelectedLabel(e.target.value)}
                            className="appearance-none w-full bg-slate-50 dark:bg-[#0b1628] border border-gray-200 dark:border-slate-800 focus:border-teal-500 dark:focus:border-[#1de9b6] rounded-xl px-4 py-2.5 font-bold text-[13px] text-gray-800 dark:text-[#F8FAFC] outline-none transition-colors duration-300"
                        >
                            <option value="">All Sub-Groups</option>
                            {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <svg className="w-4 h-4 absolute right-3 bottom-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {!selectedGroup ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white dark:bg-[#112240] border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-[20px] shadow-sm text-center px-6 transition-all duration-300">
                        <div className="w-16 h-16 bg-teal-50 dark:bg-[rgba(29,233,182,0.12)] text-teal-500 dark:text-[#1de9b6] rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <h3 className="text-[#0f172a] dark:text-[#ffffff] font-extrabold text-lg mb-2">Select a Group First</h3>
                        <p className="text-gray-500 dark:text-[#6b7a99] text-sm max-w-sm">Please select a group and optional sub-group in the panel above to view, assign, and remove custom activities.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                        {/* Left: Already Added Activities */}
                        <div className="bg-white dark:bg-[#112240] rounded-[20px] p-6 shadow-sm border border-gray-200 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300">
                            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100 dark:border-slate-800">
                                <div className="text-[12px] font-black uppercase text-[#6b7a99] tracking-wider">Already Added Activities</div>
                            </div>

                            {assignedActivities.length === 0 ? (
                                <div className="text-center py-10 text-[12px] text-gray-400 dark:text-[#6b7a99]">No activities added to this group yet.</div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {assignedActivities.map(student => {
                                        return (
                                            <div
                                                key={student.id}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 text-[#22c55e] hover:bg-[#22c55e]/15 transition-all"
                                            >
                                                <span className="text-[12px] font-semibold lowercase">{student.name}</span>
                                                <button
                                                    onClick={() => handleRemoveGroupCustomActivity(student.id, student.name)}
                                                    className="hover:text-red-500 transition-colors"
                                                    title="Remove activity from this group"
                                                >
                                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right: Activities That Can Be Added */}
                        <div className="bg-white dark:bg-[#112240] rounded-[20px] p-6 shadow-sm border border-gray-200 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300">
                            <div className="flex justify-between items-center mb-4 pb-2">
                                <div className="text-[12px] font-black uppercase text-[#6b7a99] tracking-wider">Available Activities</div>
                                <button
                                    onClick={() => setIsCreateActivityOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-[rgba(29,233,182,0.1)] text-teal-600 dark:text-[#1de9b6] rounded-lg font-bold text-[11px] hover:opacity-85 transition-all"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                    Add Custom
                                </button>
                            </div>

                            {/* Search filter input */}
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    placeholder="Search activities..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#0b1628]/60 border border-gray-200 dark:border-slate-800 focus:border-teal-500 dark:focus:border-[#1de9b6] rounded-xl py-2.5 px-4 pl-10 text-[13px] text-gray-800 dark:text-white outline-none transition-colors"
                                />
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>

                            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                                {availableActivities.length === 0 ? (
                                    <div className="text-center py-10 text-[12px] text-gray-400 dark:text-[#6b7a99]">No available activities found.</div>
                                ) : (
                                    availableActivities.map(student => {
                                        const isSelected = selectedStudents.includes(student.id);
                                        return (
                                            <div
                                                key={student.id}
                                                onClick={() => toggleStudent(student.id)}
                                                className={`flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0b1628]/40 border cursor-pointer rounded-xl transition-all ${isSelected
                                                    ? 'border-[#1de9b6]/40 bg-[#1de9b6]/5'
                                                    : 'border-transparent hover:bg-slate-100 dark:hover:bg-[#0b1628]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={student.avatar}
                                                        className="w-9 h-9 rounded-full border border-gray-200 dark:border-slate-700"
                                                    />
                                                    <div>
                                                        <h3 className="font-bold text-[14px] text-gray-800 dark:text-white leading-tight">{student.name}</h3>
                                                        <span className="text-[10px] text-gray-400 dark:text-[#6b7a99] capitalize mt-0.5 inline-block">{student.activity_type}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {student.original_status === 3 && (
                                                        <button
                                                            onClick={() => handleDeleteCustomActivity(student.id, student.name)}
                                                            className="w-7.5 h-7.5 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                                            title="Delete custom activity permanently"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                    <div
                                                        onClick={() => toggleStudent(student.id)}
                                                        className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isSelected
                                                            ? 'bg-[#1de9b6] text-[#042C53]'
                                                            : 'bg-slate-200 dark:bg-slate-800 text-gray-500 dark:text-[#6b7a99]'
                                                            }`}
                                                    >
                                                        {isSelected ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {page < totalPages && (
                                <button
                                    onClick={() => {
                                        const nextPage = page + 1;
                                        setPage(nextPage);
                                        fetchAvailableActivities(nextPage, true);
                                    }}
                                    disabled={isLoading}
                                    className="w-full mt-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-[12px] font-bold text-gray-600 dark:text-[#8899bb] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Loading...' : 'Load More Activities'}
                                </button>
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* Desktop Action Dock */}
            <AnimatePresence>
                {selectedStudents.length > 0 && (
                    <motion.div
                        drag
                        dragMomentum={false}
                        dragElastic={0.1}
                        initial={{ y: 150, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 150, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -ml-[160px] sm:-ml-[175px] z-50 bg-white/95 dark:bg-[#112240]/95 backdrop-blur-md border border-slate-200 dark:border-teal-500/30 rounded-2xl px-5 sm:px-6 py-4 shadow-2xl flex items-center gap-4 sm:gap-6 w-[320px] sm:w-[350px] justify-between text-slate-800 dark:text-white transition-colors cursor-grab active:cursor-grabbing select-none"
                    >
                        <div className="flex items-center gap-2.5">
                            {/* Grab Handle Icon */}
                            <div className="text-slate-400 dark:text-slate-500 pr-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-[13px] font-black block leading-none mb-1">{selectedStudents.length} Selected</span>
                                <button onClick={() => setSelectedStudents([])} className="text-[10px] text-red-500 dark:text-teal-400 font-bold hover:underline">Clear selection</button>
                            </div>
                        </div>
                        <button
                            onClick={handleBulkAssign}
                            className="bg-teal-500 hover:bg-teal-600 dark:bg-[#1de9b6] dark:hover:bg-[#1de9b6]/90 text-white dark:text-[#042C53] font-bold text-[12px] px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-teal-500/10 dark:shadow-none"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,9V6H3V9H0V11H3V14H5V11H8V9H5Z" /></svg>
                            Assign Activities
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Activity Dialog modal */}
            <CreateNewActivity
                isOpen={isCreateActivityOpen}
                onClose={() => setIsCreateActivityOpen(false)}
                onSave={handleCreateActivity}
            />
        </div>
    );
};

export default CustomActivities;
