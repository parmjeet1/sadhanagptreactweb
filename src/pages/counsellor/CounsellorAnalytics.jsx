import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import NotificationsPanel from '../../components/shared/NotificationsPanel';
import AddGroupModal from '../../components/shared/AddGroupModal';
import ReportSettingsModal from '../../components/counsellor/ReportSettingsModal';
import { postRequest, getRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';

const CounsellorAnalytics = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [totalMentees, setTotalMentees] = useState(0);

  const [topRanks, setTopRanks] = useState([]);
  const [bottomRanks, setBottomRanks] = useState([]);
  const [isLoadingRanks, setIsLoadingRanks] = useState(true);

  const [editGroup, setEditGroup] = useState(null);
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [selectedGroupForOptions, setSelectedGroupForOptions] = useState(null);

  const [toastState, setToastState] = useState({ show: false, message: '', type: 'success' });
  
  const showToast = (message, type = 'success') => {
    const msg = Array.isArray(message) ? message[0] : message;
    setToastState({ show: true, message: msg, type });
    setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 4000);
  };

  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error')
  };

  const fetchGroups = async () => {
    try {
      setIsLoadingGroups(true);
      const payload = {
        user_id: userDetails.user_id,
        page_no: 1
      };

      getRequest('/group-list', payload, (response) => {
        const res = response.data;
        if (res && res.code === 200 && Array.isArray(res.data)) {
          const fetchedGroups = res.data.map(g => ({
            id: g.center_id,
            name: g.name,
            members: g.total_student || 0,
            status: g.city || 'Active',
            image: '/group.jpg',
            statusIcon: '⚡',
            iconColor: 'bg-blue-500'
          }));
          setGroups(fetchedGroups);
          setTotalMentees(res.total || 0);
        }
        setIsLoadingGroups(false);
      });
    } catch (error) {
      console.error("Error fetching groups:", error);
      setIsLoadingGroups(false);
    }
  };

  const fetchRanks = async () => {
    try {
      setIsLoadingRanks(true);
      
      // Fetch Top 3
      getRequest(`/student-rank?limit=3&sort=desc&user_id=${userDetails.user_id}`, {}, (response) => {
        if (response.data && response.data.code === 200) {
          setTopRanks(response.data.data.ranks || []);
        }
      });
      
      // Fetch Bottom 3
      getRequest(`/student-rank?limit=3&sort=asc&user_id=${userDetails.user_id}`, {}, (response) => {
        if (response.data && response.data.code === 200) {
          setBottomRanks(response.data.data.ranks || []);
        }
        setIsLoadingRanks(false);
      });

    } catch (error) {
      console.error("Error fetching ranks:", error);
      setIsLoadingRanks(false);
    }
  };

  useEffect(() => {
    if (userDetails?.user_id) {
      fetchGroups();
      fetchRanks();
    }
  }, [userDetails?.user_id]);

  const handleAddGroup = async (newGroupData) => {
    try {
      const payload = {
        user_id: userDetails.user_id,
        name: newGroupData.name,
        city: newGroupData.city
      };

      postRequest('/add-new-group', payload, (response) => {
        const { message, type } = processResponse(response.data);
        if (type === 'success') {
          fetchGroups();
          setIsAddGroupOpen(false);
          toast.success(message);
        } else {
          toast.error(message);
        }
      });
    } catch (error) {
      console.error("Error adding group:", error);
      toast.error("Failed to add group");
    }
  };

  const submitEditGroup = async () => {
    if (!editGroup.name.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }
    try {
      const payload = {
        user_id: userDetails.user_id,
        center_id: editGroup.id,
        name: editGroup.name,
        city: editGroup.city || editGroup.status
      };
      postRequest('/edit-center', payload, (response) => {
        const { message, type } = processResponse(response.data);
        if (type === 'success') {
          toast.success(message || "Group updated successfully");
          setEditGroup(null);
          fetchGroups();
        } else {
          toast.error(message || "Failed to update group");
        }
      });
    } catch (error) {
      toast.error("Failed to update group");
    }
  };

  const submitDeleteGroup = async () => {
    try {
      const payload = {
        user_id: userDetails.user_id,
        center_id: deleteGroup.id
      };
      postRequest('/delete-center', payload, (response) => {
        const { message, type } = processResponse(response.data);
        if (type === 'success') {
          toast.success(message || "Group deleted successfully");
          setDeleteGroup(null);
          fetchGroups();
        } else {
          toast.error(message || "Failed to delete group");
        }
      });
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-28 relative overflow-x-hidden text-[#0f172a]">
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6">
          <h1 className="text-[28px] font-bold text-[#0f172a] border-b-2 border-[#0f172a] inline-block pb-1">
            Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative w-12 h-12 rounded-full border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-3 right-3 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 border-2 border-white"></span>
            </button>
          </div>
        </div>

        {/* Top 2 Columns: Students Rank & Students Need Follow-up */}
        <div className="px-6 flex gap-4 mb-6">
          {/* Students Rank Card */}
          <div className="flex-1 bg-white border border-gray-200 rounded-3xl p-5 flex flex-col shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
              </div>
              <h3 className="font-bold text-[#0f172a] text-[15px] leading-tight">Students<br/>Rank</h3>
            </div>
            
            <div className="flex-1 border-t border-gray-100 pt-3">
              {isLoadingRanks ? (
                <div className="flex justify-center py-2"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : topRanks.length > 0 ? (
                <div className="space-y-3">
                  {topRanks.map((student, idx) => (
                    <div key={student.student_id} className="flex items-center text-sm font-semibold text-gray-500 gap-3">
                      <span className="w-4 text-center">{idx + 1}</span>
                      <span className="text-gray-400">-</span>
                      <span className="truncate flex-1" title={student.student_name}>{student.student_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">No data</div>
              )}
            </div>

            <button 
              onClick={() => navigate('/counsellor/ranks/top')}
              className="w-full mt-4 bg-blue-50 text-blue-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-1 active:scale-95 transition-all text-sm"
            >
              View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Students Need Follow-up Card */}
          <div className="flex-1 bg-red-50 border border-red-100 rounded-3xl p-5 flex flex-col shadow-[0_4px_20px_-10px_rgba(255,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-white text-red-500 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="font-bold text-[#991b1b] text-[15px] leading-tight">Students<br/>Need<br/>Follow-up</h3>
            </div>
            
            <div className="flex-1 pt-2">
              {isLoadingRanks ? (
                <div className="flex justify-center py-2"><div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : bottomRanks.length > 0 ? (
                <div className="space-y-3">
                  {bottomRanks.map((student, idx) => (
                    <div key={student.student_id} className="flex items-center text-sm font-semibold text-red-700 gap-3">
                      <span className="w-4 text-center">{idx + 1}</span>
                      <span className="text-red-300">-</span>
                      <span className="truncate flex-1" title={student.student_name}>{student.student_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-red-400">No data</div>
              )}
            </div>

            <button 
              onClick={() => navigate('/counsellor/ranks/bottom')}
              className="w-full mt-4 bg-white/60 text-red-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-1 active:scale-95 transition-all text-sm"
            >
              View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Groups Section */}
        <div className="px-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-[28px] p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4A4 4 0 1 1 8 8A4 4 0 0 1 12 4M12 14C16.42 14 20 15.79 20 18V20H4V18C4 15.79 7.58 14 12 14ZM12 6A2 2 0 1 0 14 8A2 2 0 0 0 12 6ZM12 16C8.58 16 6 17.36 6 18V18H18V18C18 17.36 15.42 16 12 16Z" /></svg>
              <h2 className="text-[18px] font-bold text-[#0f172a] border-b border-blue-200 pb-1">Groups</h2>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
              {isLoadingGroups ? (
                <div className="text-sm text-gray-500 py-4">Loading groups...</div>
              ) : (
                <>
                  {groups.length > 0 && groups.map(group => (
                    <div key={group.id} className="relative flex-shrink-0 group/card">
                      <div 
                        onClick={() => navigate('/counsellor/group-mentees', { state: { groupName: group.name, centerId: group.id } })}
                        className="w-[160px] bg-white border border-blue-50 rounded-2xl p-3 flex items-center gap-3 cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" /></svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-[#0f172a] text-[13px] leading-tight truncate w-[80px]">{group.name}</h3>
                          <p className="text-[#64748b] text-[11px] mt-0.5">{group.members} members</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedGroupForOptions(group); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 bg-white/80 transition-all z-10 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => setIsAddGroupOpen(true)}
                    className="flex-shrink-0 w-[160px] bg-blue-50 border border-blue-100 border-dashed rounded-2xl p-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-100 active:scale-95 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="font-bold text-blue-600 text-[13px]">Add New</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="px-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-[28px] p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M13,2.05v3.03c3.39,0.49,6,3.39,6,6.92c0,0.9-0.18,1.75-0.48,2.54l2.6,1.53c0.56-1.24,0.88-2.62,0.88-4.07 C22,6.39,18.05,2.54,13,2.05z M12,19c-3.87,0-7-3.13-7-7c0-3.53,2.61-6.43,6-6.92V2.05C5.94,2.55,2,6.4,2,12c0,5.52,4.48,10,10,10 c3.45,0,6.65-1.74,8.55-4.44l-2.55-1.5C16.56,17.82,14.41,19,12,19z M13,11h3v2h-3v3h-2v-3H8v-2h3V8h2V11z" /></svg>
              <h2 className="text-[18px] font-bold text-[#0f172a] border-b border-blue-200 pb-1">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div 
                onClick={() => {
                  const encoded = btoa(userDetails.user_id);
                  const link = `https://sadhanagpt.com?ref=${encoded}`;
                  navigator.clipboard.writeText(link).then(() => toast.success("Referral link copied!"));
                }}
                className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded-2xl p-2 cursor-pointer active:scale-95 transition-all aspect-[3/4]"
              >
                <div className="w-8 h-8 flex items-center justify-center text-blue-500 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <span className="text-[10px] font-bold text-center leading-tight">Invite</span>
              </div>

              <div 
                onClick={() => navigate('/counsellor/marking-scheme')}
                className="flex flex-col items-center justify-center bg-emerald-50 border border-emerald-200 rounded-2xl p-2 cursor-pointer active:scale-95 transition-all aspect-[3/4]"
              >
                <div className="w-8 h-8 flex items-center justify-center text-emerald-500 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
                <span className="text-[10px] font-bold text-center leading-tight">Marking<br/>Scheme</span>
              </div>

              <div 
                onClick={() => navigate('/counsellor/custom-activities')}
                className="flex flex-col items-center justify-center bg-purple-50 border border-purple-200 rounded-2xl p-2 cursor-pointer active:scale-95 transition-all aspect-[3/4]"
              >
                <div className="w-8 h-8 flex items-center justify-center text-purple-500 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
                <span className="text-[10px] font-bold text-center leading-tight">Custom<br/>Activities</span>
              </div>

              <div 
                onClick={() => navigate('/counsellor/rewards')}
                className="flex flex-col items-center justify-center bg-yellow-50 border border-yellow-200 rounded-2xl p-2 cursor-pointer active:scale-95 transition-all aspect-[3/4]"
              >
                <div className="w-8 h-8 flex items-center justify-center text-yellow-500 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                </div>
                <span className="text-[10px] font-bold text-center leading-tight">Rewards</span>
              </div>

              <div 
                onClick={() => setIsSettingsOpen(true)}
                className="flex flex-col items-center justify-center bg-pink-50 border border-pink-200 rounded-2xl p-2 cursor-pointer active:scale-95 transition-all aspect-[3/4]"
              >
                <div className="w-8 h-8 flex items-center justify-center text-pink-500 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span className="text-[10px] font-bold text-center leading-tight">Report<br/>Settings</span>
              </div>
            </div>
          </div>
        </div>

        {/* View All Mentees Button */}
        <div className="px-6 mb-8">
          <button
            onClick={() => navigate('/counsellor/mentees')}
            className="w-full bg-blue-50 border border-blue-100 text-[#1e3a8a] font-bold py-4 rounded-[20px] shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-[16px]"
          >
            View All Mentees (Total - {totalMentees}) <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

      </div>

      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <ReportSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userDetails={userDetails}
        showToast={showToast}
      />

      <AddGroupModal
        isOpen={isAddGroupOpen}
        onClose={() => setIsAddGroupOpen(false)}
        onSave={handleAddGroup}
      />

      {/* Group Options Bottom Sheet */}
      <AnimatePresence>
        {selectedGroupForOptions && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedGroupForOptions(null)}
              className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-[2px] z-[9998]"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 bg-white rounded-t-[32px] shadow-2xl z-[9999] flex flex-col px-6 pb-8 pt-4"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" onClick={() => setSelectedGroupForOptions(null)} />
              <h2 className="text-xl font-extrabold text-center mb-6">Manage "{selectedGroupForOptions.name}"</h2>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setEditGroup(selectedGroupForOptions); setSelectedGroupForOptions(null); }}
                  className="w-full bg-blue-50 text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit Group Name
                </button>
                <button 
                  onClick={() => { setDeleteGroup(selectedGroupForOptions); setSelectedGroupForOptions(null); }}
                  className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Group
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Group Modal */}
      <AnimatePresence>
        {editGroup && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditGroup(null)}
              className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-[2px] z-[9998]"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 bg-white rounded-t-[32px] shadow-2xl z-[9999] px-6 pb-8 pt-4"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" onClick={() => setEditGroup(null)} />
              <h2 className="text-2xl font-extrabold mb-6 text-[#0f172a]">Edit Group</h2>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Group Name</label>
                  <input
                    type="text"
                    value={editGroup.name}
                    onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-[#0f172a] rounded-2xl px-5 py-4 font-semibold text-[15px] focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="Enter group name"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditGroup(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-all">Cancel</button>
                <button onClick={submitEditGroup} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all">Save Changes</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Group Modal */}
      <AnimatePresence>
        {deleteGroup && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div 
                className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
                onClick={() => setDeleteGroup(null)} 
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center"
              >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-extrabold text-[#0f172a] mb-2">Delete Group?</h3>
              <p className="text-gray-500 text-sm font-medium mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-gray-800">"{deleteGroup.name}"</span>? 
                This will unassign all students and delete all its sub-groups. Students' accounts will not be deleted. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={submitDeleteGroup} className="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all">Yes, Delete Group</button>
                <button onClick={() => setDeleteGroup(null)} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl active:scale-95 transition-all">Cancel</button>
              </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastState.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border w-max max-w-[90%] ${toastState.type === 'error'
              ? 'bg-red-50 border-red-100 text-red-700'
              : 'bg-green-50 border-green-100 text-green-700'
              }`}
          >
            {toastState.type === 'error' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            )}
            <span className="text-[14px] font-bold truncate">{toastState.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <CounsellorBottomNavigation />

    </div>
  );
};

export default CounsellorAnalytics;
