import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../../../components/shared/ThemeToggle';
import { getRequest } from '../../../../services/api';

export const CustomActivitiesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userDetails } = useOutletContext() || {};
    
    // We expect center_id and label_id, and maybe name, in location state
    const center_id = location.state?.center_id || '';
    const label_id = location.state?.label_id || '';
    const groupName = location.state?.name || 'Group / Sub-Group';

    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };
    const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };

    const fetchActivities = useCallback(() => {
        if (!userDetails?.user_id) return;
        setIsLoading(true);
        const payload = {
            user_id: userDetails.user_id,
            page_no: 1,
            center_id: center_id,
            label_id: label_id,
        };

        // Fetch assigned items
        getRequest('/selectable-activities-list', payload, (response) => {
            const res = response.data;
            if (res && res.code === 200) {
                const rawData = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
                // Filter only assigned activities (status === 1)
                setActivities(rawData.filter(a => a.status === 1));
            } else {
                showError('Failed to fetch activities');
            }
            setIsLoading(false);
        });
    }, [userDetails?.user_id, center_id, label_id]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const handleRemoveActivity = (activityId) => {
        // Simulated deletion/removal for UI feedback
        if(window.confirm("Are you sure you want to remove this activity from the group?")) {
            showSuccess('Activity removed successfully (Simulated)');
            setActivities(prev => prev.filter(a => a.master_activity_id !== activityId));
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1628] font-sans pb-28 transition-colors duration-300 flex flex-col">
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

            {/* Header */}
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
                        <h1 className="text-[16px] font-semibold text-[#0f172a] dark:text-[#ffffff] leading-none tracking-tight">{groupName}</h1>
                        <p className="text-[11px] font-medium text-teal-600 dark:text-[#1de9b6] mt-1">Activities assigned to this sub-group</p>
                    </div>
                </div>
                <ThemeToggle />
            </header>

            {/* Main Content Area */}
            <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
                
                <div className="bg-white dark:bg-[#112240] rounded-[20px] p-6 shadow-sm border border-gray-200 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300 flex-1 flex flex-col min-h-[400px]">
                    <div className="text-[12px] font-black uppercase text-[#6b7a99] tracking-wider mb-6 pb-3 border-b border-gray-100 dark:border-slate-800">
                        Assigned Activities
                    </div>
                    
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-teal-500 dark:border-[#1de9b6] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-slate-800">
                                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            </div>
                            <h3 className="text-[#0f172a] dark:text-white font-bold text-[16px] mb-1">No activities assigned</h3>
                            <p className="text-gray-500 dark:text-[#6b7a99] text-sm max-w-sm px-4 leading-relaxed">This sub-group currently doesn't have any custom activities assigned to it.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 content-start">
                            {activities.map(activity => (
                                <div key={activity.master_activity_id} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0b1628]/40 rounded-2xl border border-gray-200/50 dark:border-slate-800 hover:border-teal-500/30 dark:hover:border-teal-500/20 transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-800 text-[#1de9b6] rounded-xl flex items-center justify-center shadow-sm">
                                            <svg className="w-5 h-5 text-teal-500 dark:text-[#1de9b6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white text-[14px] leading-tight">{activity.name}</h3>
                                            <p className="text-[10px] font-medium text-gray-400 dark:text-[#6b7a99] capitalize mt-1">{activity.activity_type || 'Activity Task'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveActivity(activity.master_activity_id)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/30 transition-all shadow-sm"
                                        title="Remove Activity"
                                    >
                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bottom Action Area */}
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                        <button 
                            onClick={() => navigate('/counsellor/custom-activities', { state: { center_id, label_id } })}
                            className="px-6 py-3.5 bg-teal-500 hover:bg-teal-600 text-[#042C53] rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-[0_8px_30px_rgb(20,184,166,0.15)] hover:shadow-[0_8px_30px_rgb(20,184,166,0.25)] active:scale-[0.98] text-[14px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            Add Custom Activities
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomActivitiesPage;
