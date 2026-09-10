import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import { getRequest } from '../../../services/api';

const StudentRanksList = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const { type } = useParams(); // 'top' or 'bottom'
  
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const observerTarget = useRef(null);
  
  const fetchCenters = useCallback(() => {
    getRequest('/group-list', { user_id: userDetails.user_id, page_no: 1 }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        setCenters(res.data);
      }
    });
  }, [userDetails.user_id]);

  const fetchStudents = useCallback((pageNum = 1, shouldAppend = false) => {
    setIsLoading(true);
    const sortOrder = type === 'bottom' ? 'asc' : 'desc';
    
    const payload = {
      user_id: userDetails.user_id,
      page: pageNum,
      limit: 20,
      sort: sortOrder,
      center_id: (selectedGroup === 'All' || selectedGroup === 'Uncategorized') ? "" : selectedGroup,
    };

    const queryString = new URLSearchParams(Object.entries(payload).filter(([_, v]) => v !== "")).toString();

    getRequest(`/student-rank?${queryString}`, {}, (response) => {
      const res = response.data;
      if (res && res.code === 200) {
        const rawData = res.data.ranks || [];
        const mappedStudents = rawData.map(s => ({
          id: s.student_id,
          name: s.student_name,
          label: `Rank ${s.rank} (${s.percentage}%)`,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.student_name)}&background=random`,
        }));
        
        setStudents(prev => shouldAppend ? [...prev, ...mappedStudents] : mappedStudents);
        setTotalPages(res.total_page || 1);
      }
      setIsLoading(false);
    });
  }, [userDetails.user_id, selectedGroup, type]);

  useEffect(() => { fetchCenters(); }, [fetchCenters]);
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

  return (
    <div className="min-h-screen bg-white font-sans pb-[84px]">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white z-20 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="text-[#64748b] font-bold">Back</button>
          <h1 className="text-[18px] font-extrabold text-[#0f172a]">
            {type === 'bottom' ? 'Students Need Follow-up' : 'Students Rank'}
          </h1>
          <div className="w-10"></div> {/* Placeholder for balance */}
        </div>

        <div className="px-6 pb-4 pt-4 flex gap-3 overflow-x-auto hide-scrollbar">
          <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); }} className={`shrink-0 bg-[#f1f5f9] rounded-full px-5 py-2.5 font-bold text-[13px] outline-none border-none ${selectedGroup !== 'All' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
            <option value="All">All Groups</option>
            {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
          </select>
        </div>

        <div className="px-2">
          {students.map((student, idx) => (
            <div key={`${student.id}-${idx}`} className="flex items-center px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <span className="w-8 text-center font-bold text-gray-400">{idx + 1 + (page - 1) * 20}</span>
              <img src={student.avatar} className="w-12 h-12 rounded-full mr-4 border border-gray-100" />
              <div className="flex-1">
                <h3 className="font-bold text-[16px] text-[#0f172a]">{student.name}</h3>
                <p className={`text-[12px] font-medium ${type === 'bottom' ? 'text-red-500' : 'text-blue-500'}`}>{student.label}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: { student } }); }} className="p-2 text-gray-300 hover:text-blue-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
              </div>
            </div>
          ))}
          {isLoading && <div className="text-center py-4 text-gray-500">Loading...</div>}
          <div ref={observerTarget} className="h-10" />
        </div>
      </div>
      <CounsellorBottomNavigation />
    </div>
  );
};

export default StudentRanksList;
