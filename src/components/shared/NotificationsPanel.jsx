import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { getRequest } from '../../services/api';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { userDetails } = useOutletContext();
  const [activePanelTab, setActivePanelTab] = useState('notifications'); // 'notifications' | 'rankings'

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Rankings State
  const [rankingType, setRankingType] = useState('center'); // 'center' (Group) or 'global' (Global)
  const [timeFilter, setTimeFilter] = useState('today'); // 'today' | 'yesterday' | 'weekly'
  const [rankings, setRankings] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [rankingPage, setRankingPage] = useState(1);
  const [hasMoreRankings, setHasMoreRankings] = useState(true);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [isFetchingMoreRankings, setIsFetchingMoreRankings] = useState(false);

  const fetchNotifications = (pageNum = 1, append = false) => {
    if (!userDetails?.user_id) return;
    
    if (append) setIsFetchingMore(true);
    else setIsLoading(true);

    const payload = {
      user_id: userDetails.user_id,
      page_no: pageNum
    };

    getRequest('/student-notification-list', payload, (res) => {
      const resData = res?.data;
      if (resData && resData.status === 1) {
        const newData = Array.isArray(resData.data) ? resData.data : (resData.data?.data || []);
        
        if (append) {
          setNotifications(prev => [...prev, ...newData]);
        } else {
          setNotifications(newData);
        }

        if (newData.length < 5) setHasMore(false);
        else setHasMore(true);
      }
      setIsLoading(false);
      setIsFetchingMore(false);
    });
  };

  const fetchRankings = (pageNum = 1, append = false, type = rankingType, filter = timeFilter) => {
    if (!userDetails?.user_id) return;
    if (append) setIsFetchingMoreRankings(true);
    else setIsLoadingRankings(true);

    const payload = {
      user_id: userDetails.user_id,
      page_no: pageNum,
      limit: 10,
      center_filter: type === 'center',
      time_filter: filter
    };

    getRequest('/weekly-ranking', payload, (res) => {
      const resData = res?.data;
      if (resData && resData.status === 1) {
        const newData = resData.data?.ranking || [];
        if (append) {
          setRankings(prev => [...prev, ...newData]);
        } else {
          setRankings(newData);
          setCurrentUserRank(resData.data?.currentUserRank ?? null);
        }
        if (newData.length < 10) setHasMoreRankings(false);
        else setHasMoreRankings(true);
      }
      setIsLoadingRankings(false);
      setIsFetchingMoreRankings(false);
    });
  };

  useEffect(() => {
    if (isOpen) {
      if (activePanelTab === 'notifications') {
        setPage(1);
        fetchNotifications(1, false);
      } else {
        setRankingPage(1);
        fetchRankings(1, false, rankingType, timeFilter);
      }
    } else {
      // Reset defaults for next time panel is opened
      setTimeFilter('today');
      setRankingType('center');
    }
  }, [isOpen, activePanelTab, rankingType, timeFilter]);

  const loadMoreNotifications = (e) => {
    e.stopPropagation();
    if (isFetchingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const loadMoreRankings = (e) => {
    e.stopPropagation();
    if (isFetchingMoreRankings || !hasMoreRankings) return;
    const nextPage = rankingPage + 1;
    setRankingPage(nextPage);
    fetchRankings(nextPage, true, rankingType, timeFilter);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[360px] bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Panel Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex flex-col bg-white relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[20px] font-black text-[#0f172a] tracking-tight">Updates & Rankings</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95"
                  aria-label="Close panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Main Panel Tabs (Notifications vs Rankings) */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setActivePanelTab('notifications')}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    activePanelTab === 'notifications'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  🔔 Updates
                </button>
                <button
                  onClick={() => setActivePanelTab('rankings')}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    activePanelTab === 'rankings'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  🏆 Rankings
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-[#fcfcfc] custom-scrollbar">
              {activePanelTab === 'notifications' ? (
                /* --- NOTIFICATIONS TAB --- */
                isLoading && page === 1 ? (
                  <div className="flex flex-col items-center justify-center pt-20 gap-3">
                     <div className="w-8 h-8 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-gray-400 text-[13px] font-bold">Checking for updates...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-20 px-8">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </div>
                    <h3 className="text-[15px] font-bold text-gray-400">All caught up!</h3>
                    <p className="text-[13px] text-gray-300 mt-1">No new notifications at the moment.</p>
                  </div>
                ) : (
                  <>
                    {notifications.map((notif, idx) => {
                      const isRead = String(notif.status) === '1';
                      const timeStr = notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
                      
                      return (
                        <motion.div 
                          key={notif.id || idx} 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-4 rounded-[24px] bg-white shadow-sm border ${isRead ? 'border-transparent' : 'border-orange-100 bg-orange-50/10'} relative group hover:shadow-md transition-all cursor-pointer overflow-hidden`}
                        >
                          {!isRead && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />}
                          <div className="flex gap-3">
                            <div className={`flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center ${isRead ? 'bg-gray-50 text-gray-300' : 'bg-orange-100 text-orange-600'}`}>
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                 <h3 className={`text-[14px] leading-tight ${isRead ? 'font-bold text-gray-500' : 'font-black text-[#0f172a]'}`}>{notif.heading}</h3>
                                 {!isRead && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-1"></span>}
                              </div>
                              <p className="text-[12px] text-gray-400 mt-1 font-medium leading-relaxed">{notif.description}</p>
                              <div className="mt-2 flex items-center gap-1">
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {hasMore && notifications.length >= 5 && (
                      <div className="pt-2 pb-6 flex justify-center">
                         <button 
                           onClick={loadMoreNotifications}
                           disabled={isFetchingMore}
                           className="px-6 py-2.5 bg-white border border-gray-100 rounded-full text-[12px] font-black text-[#1a73e8] shadow-sm hover:border-[#1a73e8]/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                         >
                           {isFetchingMore ? (
                             <div className="w-3.5 h-3.5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                           ) : 'Earlier Updates'}
                         </button>
                      </div>
                    )}
                  </>
                )
              ) : (
                /* --- RANKINGS TAB --- */
                <div className="space-y-4">
                  {/* Group Rank vs Global Rank Sub-Toggles */}
                  <div className="flex bg-slate-200/70 p-1 rounded-2xl shadow-inner">
                    <button
                      onClick={() => setRankingType('center')}
                      className={`flex-1 py-2 rounded-xl text-[12px] font-extrabold transition-all flex items-center justify-center gap-1 ${
                        rankingType === 'center'
                          ? 'bg-white text-teal-600 shadow-md'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      🏢 Group Rank
                    </button>
                    <button
                      onClick={() => setRankingType('global')}
                      className={`flex-1 py-2 rounded-xl text-[12px] font-extrabold transition-all flex items-center justify-center gap-1 ${
                        rankingType === 'global'
                          ? 'bg-white text-blue-600 shadow-md'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      🌐 Global Rank
                    </button>
                  </div>

                  {/* Time Horizon Filter Bar */}
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-[11px] font-bold">
                    <button
                      onClick={() => setTimeFilter('today')}
                      className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
                        timeFilter === 'today'
                          ? 'bg-teal-600 text-white shadow-sm font-black'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      📅 Today
                    </button>
                    <button
                      onClick={() => setTimeFilter('yesterday')}
                      className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
                        timeFilter === 'yesterday'
                          ? 'bg-teal-600 text-white shadow-sm font-black'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      ⏪ Previous Day
                    </button>
                    <button
                      onClick={() => setTimeFilter('weekly')}
                      className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
                        timeFilter === 'weekly'
                          ? 'bg-teal-600 text-white shadow-sm font-black'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      📊 Last 1 Week
                    </button>
                  </div>

                  {/* Current User Stats Card */}
                  {currentUserRank !== null && (
                    <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-[20px] p-5 text-white shadow-md relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                      <p className="text-teal-100 font-medium text-xs uppercase tracking-wider">
                        {timeFilter === 'today' && `Your Daily ${rankingType === 'center' ? 'Group' : 'Global'} Rank`}
                        {timeFilter === 'yesterday' && `Your Previous Day ${rankingType === 'center' ? 'Group' : 'Global'} Rank`}
                        {timeFilter === 'weekly' && `Your Weekly ${rankingType === 'center' ? 'Group' : 'Global'} Rank`}
                      </p>
                      <div className="flex items-end gap-2 mt-1">
                        <h2 className="text-4xl font-black">#{currentUserRank}</h2>
                        <span className="text-teal-100 font-medium text-xs pb-1">
                          {timeFilter === 'today' && (rankingType === 'center' ? 'today in your group' : 'today globally')}
                          {timeFilter === 'yesterday' && (rankingType === 'center' ? 'yesterday in your group' : 'yesterday globally')}
                          {timeFilter === 'weekly' && (rankingType === 'center' ? 'this week in your group' : 'this week globally')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Leaderboard */}
                  {isLoadingRankings && rankingPage === 1 ? (
                    <div className="flex flex-col items-center justify-center pt-16 gap-3">
                      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-400 text-[13px] font-bold">Loading leaderboard...</p>
                    </div>
                  ) : rankings.length === 0 ? (
                    <div className="text-center py-16 px-6">
                      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                        🏆
                      </div>
                      <h3 className="text-[14px] font-bold text-gray-400">No rankings available</h3>
                    </div>
                  ) : (
                    <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 space-y-3">
                      {rankings.map((user, idx) => {
                        const rank = idx + 1;
                        let rankColor = "text-gray-500 bg-gray-100";
                        if (rank === 1) rankColor = "text-yellow-600 bg-yellow-100 border border-yellow-300";
                        if (rank === 2) rankColor = "text-slate-600 bg-slate-100 border border-slate-300";
                        if (rank === 3) rankColor = "text-amber-700 bg-amber-100 border border-amber-300";

                        const avatarUrl = user.profile ? (user.profile.startsWith('http') ? user.profile : `${import.meta.env.VITE_IMAGE_URL}${user.profile}`) : null;

                        return (
                          <div 
                            key={user.user_id || idx} 
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${rankColor}`}>
                                #{rank}
                              </div>
                              {avatarUrl ? (
                                <img src={avatarUrl} className="w-9 h-9 rounded-full object-cover shadow-sm border border-white" alt={user.name} />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm border border-white">
                                  {user.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-[#1e293b] text-[14px] leading-tight">{user.name}</h4>
                                <p className="text-[11px] font-medium text-gray-400">{user.total_marks || 0} Marks</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {hasMoreRankings && rankings.length >= 10 && (
                        <div className="pt-2 pb-2 flex justify-center">
                          <button 
                            onClick={loadMoreRankings}
                            disabled={isFetchingMoreRankings}
                            className="px-6 py-2 bg-white border border-gray-100 rounded-full text-[12px] font-black text-teal-600 shadow-sm hover:border-teal-200 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {isFetchingMoreRankings ? (
                              <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : 'Load More Ranks'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
