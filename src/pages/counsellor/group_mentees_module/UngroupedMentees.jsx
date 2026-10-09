import ThemeToggle from '../../../components/shared/ThemeToggle';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import AiDateFilterModal from '../../../components/AiAnalysis/AiDateFilterModal';
import { getRequest } from '../../../services/api';

// Students linked to this counsellor who are not in any group. No subgroups.
const PAGE_SIZE = 20;

const UngroupedMentees = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const fetchStudents = useCallback((pageNum, replace) => {
    if (!userDetails?.user_id) return;
    setIsLoading(true);
    getRequest('/student-list', {
      user_id: userDetails.user_id,
      page_no: pageNum,
      rowSelected: PAGE_SIZE,
      categroy: 'un-categorized',
      search_text: search
    }, (response) => {
      const res = response.data;
      if (res && res.code === 200) {
        const rows = (Array.isArray(res.data) ? res.data : []).map((s) => ({
          id: s.user_id,
          name: s.name,
          mobile: s.mobile || 'N/A',
          notificationStatus: s.notification_status,
          avatar: s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`
        }));
        setStudents((prev) => (replace ? rows : [...prev, ...rows]));
        setPage(pageNum);
        setTotalPages(res.total_page || 1);
        setTotal(res.total ?? rows.length);
      }
      setIsLoading(false);
    });
  }, [userDetails?.user_id, search]);

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(1, true), 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] font-sans pb-[84px]">
      <div className="max-w-md mx-auto pb-6">
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white dark:bg-[#0F172A] z-20">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-[20px] font-extrabold text-[#0f172a] dark:text-white uppercase dark:text-[#F8FAFC] truncate px-4">Ungrouped</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
          <button
            onClick={() => setIsAiOpen(true)}
            disabled={total === 0}
            className="px-4 h-10 flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm font-bold text-[13px] disabled:opacity-50"
          >
            AI
          </button>
        </div>

        <div className="px-6 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mentees..."
            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-[14px] outline-none text-gray-900 dark:text-white"
          />
          <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-2">{total} mentee{total === 1 ? '' : 's'} not in any group</p>
        </div>

        <div className="px-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-400/70 dark:border-slate-700 p-2 space-y-1">
            {students.length === 0 && !isLoading && (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-slate-400">No ungrouped mentees</div>
            )}
            {students.map((s, i) => (
              <div
                key={s.id}
                onClick={() => navigate(`/counsellor/mentee/${s.id}`, { state: s })}
                className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
              >
                <div className="w-6 text-[12px] font-bold text-gray-400 text-center flex-shrink-0">{i + 1}</div>
                <img src={s.avatar} alt="" className="w-10 h-10 rounded-full ml-2 border-2 border-gray-300 dark:border-slate-600" />
                <div className="ml-3 min-w-0">
                  <h4 className="font-bold text-[15px] text-gray-900 dark:text-white truncate">{s.name}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{s.mobile}</p>
                </div>
              </div>
            ))}
            {isLoading && <div className="p-4 text-center text-sm text-gray-500">Loading...</div>}
          </div>

          {page < totalPages && !isLoading && (
            <button
              onClick={() => fetchStudents(page + 1, false)}
              className="w-full mt-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-sm"
            >
              Load more
            </button>
          )}
        </div>
      </div>

      <AiDateFilterModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        title="AI Analysis: Ungrouped"
        subtitle="Select date window for all ungrouped mentees"
        strategy="BULK_MENTEES"
        entityParams={{
          studentIds: [],
          centerId: 'ungrouped',
          userId: userDetails?.user_id,
          contextName: 'Ungrouped Mentees Analysis'
        }}
      />
      <CounsellorBottomNavigation />
    </div>
  );
};

export default UngroupedMentees;
