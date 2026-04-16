import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import { getRequest, postRequest } from '../../../services/api';
import { processResponse } from '../../../utils/apiUtils';

const MenteesList = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedLabel, setSelectedLabel] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState(null);
  const [editGroup, setEditGroup] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editLabelsList, setEditLabelsList] = useState([]);
  
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkGroup, setBulkGroup] = useState('');
  const [bulkLabel, setBulkLabel] = useState('');
  const [bulkLabelsList, setBulkLabelsList] = useState([]);
  
  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
  const [aiDateFrom, setAiDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [aiDateTo, setAiDateTo] = useState(new Date().toISOString().split('T')[0]);
  
  const SELECTION_LIMIT = 5;
  const observerTarget = useRef(null);

  const fetchCenters = useCallback(() => {
    getRequest('/group-list', { user_id: userDetails.user_id, page_no: 1 }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        setCenters(res.data);
      }
    });
  }, [userDetails.user_id]);

  const fetchLabels = useCallback((centerId, setList, currentVal, setter) => {
    if (!centerId || centerId === 'All') {
      if (setList) setList([]);
      return;
    }
    getRequest('/lable-list', { user_id: userDetails.user_id, center_id: centerId }, (response) => {
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        const list = res.data.map(l => ({ id: l.label_id, name: l.label_name }));
        if (setList) setList(list);
        if (setter && list.length > 0 && !list.find(l => l.id === currentVal)) {
           // setter(list[0].id);
        }
      }
    });
  }, [userDetails.user_id]);

  const fetchStudents = useCallback((pageNum = 1, shouldAppend = false) => {
    setIsLoading(true);
    const payload = {
      user_id: userDetails.user_id,
      page_no: pageNum,
      center_id: selectedGroup === 'All' ? "" : selectedGroup,
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
          group: s.center_name || 'N/A',
          label: s.label_name || 'N/A',
          center_id: s.center_id,
          label_id: s.label_id,
          avatar: s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`,
          activities: s.activities || []
        }));
        setStudents(prev => shouldAppend ? [...prev, ...mappedStudents] : mappedStudents);
        setTotalPages(res.total_page || 1);
      }
      setIsLoading(false);
    });
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

  useEffect(() => { if (editGroup) fetchLabels(editGroup, setEditLabelsList); }, [editGroup, fetchLabels]);
  useEffect(() => { if (bulkGroup) fetchLabels(bulkGroup, setBulkLabelsList); }, [bulkGroup, fetchLabels]);

  const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };
  const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      if (prev.includes(id)) return prev.filter(sid => sid !== id);
      if (prev.length >= SELECTION_LIMIT) { showError(`Max ${SELECTION_LIMIT} students.`); return prev; }
      return [...prev, id];
    });
  };

  const handleBulkAssign = () => {
    if (!bulkGroup || !bulkLabel) return showError("Select both group and label");
    const payload = {
      user_id: userDetails.user_id,
      student_ids: selectedStudents,
      center_id: bulkGroup,
      label_id: bulkLabel
    };
    postRequest('/assign-student-center-label', payload, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess(data.message || 'Students assigned successfully');
        setIsBulkAssignOpen(false);
        setSelectedStudents([]);
        fetchStudents(1, false);
      } else {
        showError(data?.message || 'Failed to assign students');
      }
    });
  };

  const handleSingleAssign = () => {
    if (!editGroup || !editLabel) return showError("Select both group and label");
    const payload = {
      user_id: userDetails.user_id,
      student_ids: [editingStudent.id],
      center_id: editGroup,
      label_id: editLabel
    };
    postRequest('/assign-student-center-label', payload, (res) => {
      const data = res.data;
      if (data?.status === 1) {
        showSuccess(data.message || 'Student updated successfully');
        setEditingStudent(null);
        fetchStudents(1, false);
      } else {
        showError(data?.message || 'Failed to update student');
      }
    });
  };

  const handleAiAnalysis = () => {
    if (selectedStudents.length === 0) return showError("Select at least one student");
    if (!aiDateFrom || !aiDateTo) return showError("Select date range");

    const payload = {
      user_id: userDetails.user_id,
      student_ids: JSON.stringify(selectedStudents),
      date_from: aiDateFrom,
      date_to: aiDateTo
    };

    setIsAiAnalysisModalOpen(false);
    postRequest('/bulk-ai-report', payload, (response) => {
      if (response.data?.status === 1) {
        navigate('/counsellor/ai-chat', { state: { reports: response.data.data, fromReport: true } });
      } else {
        showError(response.data?.message || "Failed to generate AI report");
      }
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-[100px]">
      <AnimatePresence>
        {errorMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-red-100">{errorMessage}</div></motion.div>)}
        {successMessage && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed top-24 left-0 right-0 z-[100] flex justify-center"><div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl shadow-lg font-bold text-sm border border-green-100">{successMessage}</div></motion.div>)}
      </AnimatePresence>

      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white z-20 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="text-[#64748b] font-bold">Back</button>
          <h1 className="text-[18px] font-extrabold text-[#0f172a]">All Mentees</h1>
          <button onClick={() => selectedStudents.length > 0 ? setSelectedStudents([]) : setSelectedStudents(students.slice(0, SELECTION_LIMIT).map(s=>s.id))} className="text-[#1a73e8] font-bold">{selectedStudents.length > 0 ? 'Clear' : 'Select'}</button>
        </div>

        <div className="px-6 py-4">
          <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#f8fafc] rounded-full py-3.5 px-6 text-[15px] outline-none" />
        </div>

        <div className="px-6 pb-4 flex gap-3 overflow-x-auto hide-scrollbar">
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className={`bg-[#f1f5f9] rounded-full px-5 py-2.5 font-bold text-[13px] outline-none ${selectedGroup !== 'All' ? 'bg-blue-600 text-white' : ''}`}>
            <option value="All">All Groups</option>
            {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
          </select>
          <button onClick={() => setIsLabelPopupOpen(true)} className={`bg-[#f1f5f9] rounded-full px-5 py-2.5 font-bold text-[13px] hover:bg-gray-200 transition-colors ${selectedLabel !== 'All' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : ''}`}>
            {selectedLabel === 'All' ? 'All Labels' : labels.find(l => l.id === selectedLabel)?.name || 'Label'}
          </button>
        </div>

        <div className="px-2">
          {students.map(student => (
            <div key={student.id} onClick={() => toggleStudent(student.id)} className="flex items-center px-4 py-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors">
              <img src={student.avatar} className="w-12 h-12 rounded-full mr-4 border border-gray-100" />
              <div className="flex-1">
                <h3 className="font-bold text-[16px] text-[#0f172a]">{student.name}</h3>
                <p className="text-[12px] text-gray-400 font-medium">{student.group} • {student.label}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/counsellor/mentee/${student.id}`, { state: { student } }); }} className="p-2 text-gray-300 hover:text-blue-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                <button onClick={(e) => { e.stopPropagation(); setEditingStudent(student); setEditGroup(student.center_id); setEditLabel(student.label_id); }} className="p-2 text-gray-300 hover:text-gray-900 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedStudents.includes(student.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
                  {selectedStudents.includes(student.id) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            </div>
          ))}
          <div ref={observerTarget} className="h-10" />
        </div>
      </div>

      {/* Premium Bottom Bar */}
      <AnimatePresence>
        {selectedStudents.length > 0 && (
          <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-[84px] left-0 right-0 max-w-md mx-auto z-40 px-4">
            <div className="bg-[#1a73e8] rounded-[32px] p-5 shadow-2xl shadow-blue-500/40 w-full relative">
              <div className="flex justify-between items-center mb-4 text-white px-2">
                <span className="font-extrabold text-[15px]">Selected: {selectedStudents.length} Students</span>
                <button onClick={() => setSelectedStudents([])} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <button onClick={() => setIsAiAnalysisModalOpen(true)} className="w-full bg-white text-[#1a73e8] rounded-2xl py-3.5 mb-3 font-black text-[15px] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93M13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07M12 11.5A1.5 1.5 0 0 1 10.5 10A1.5 1.5 0 0 1 12 8.5A1.5 1.5 0 0 1 13.5 10A1.5 1.5 0 0 1 12 11.5M12 15.5A1.5 1.5 0 0 1 10.5 14A1.5 1.5 0 0 1 12 12.5A1.5 1.5 0 0 1 13.5 14A1.5 1.5 0 0 1 12 15.5Z" /></svg>AI Analysis</button>
              <div className="flex gap-3">
                <button onClick={() => setIsBulkAssignOpen(true)} className="flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,9V6H3V9H0V11H3V14H5V11H8V9H5Z" /></svg>Assign</button>
                <button onClick={() => setIsDownloadModalOpen(true)} className="flex-1 bg-white/10 text-white rounded-2xl py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-white/20 active:scale-[0.98] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>Export</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals Bundle */}
      <AnimatePresence>
        {isLabelPopupOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsLabelPopupOpen(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center">
             <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px] shadow-2xl">
                <h2 className="text-2xl font-black mb-6">Select Label</h2>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                   <button onClick={()=>{setSelectedLabel('All'); setIsLabelPopupOpen(false)}} className={`w-full p-4 rounded-2xl text-left font-bold ${selectedLabel === 'All' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50'}`}>All Mentees</button>
                   {labels.map(l => <button key={l.id} onClick={()=>{setSelectedLabel(l.id); setIsLabelPopupOpen(false)}} className={`w-full p-4 rounded-2xl text-left font-bold ${selectedLabel === l.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-50'}`}>{l.name}</button>)}
                </div>
             </motion.div>
          </motion.div>
        )}

        {isAiAnalysisModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center">
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="bg-white w-full max-w-md p-10 rounded-t-[48px]">
               <h2 className="text-2xl font-black mb-2">AI Analysis Setup</h2>
               <p className="text-gray-400 font-bold mb-6">Analyzing {selectedStudents.length} students</p>
               
               <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
                  {students.filter(s => selectedStudents.includes(s.id)).map(s => (
                    <div key={s.id} className="flex flex-col items-center min-w-[60px]">
                      <img src={s.avatar} className="w-10 h-10 rounded-full border border-gray-100" />
                      <span className="text-[10px] font-bold mt-1 text-gray-400 truncate w-full text-center">{s.name.split(' ')[0]}</span>
                    </div>
                  ))}
               </div>

               <div className="space-y-6">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Date From</label><input type="date" value={aiDateFrom} onChange={e=>setAiDateFrom(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" /></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Date To</label><input type="date" value={aiDateTo} onChange={e=>setAiDateTo(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" /></div>
                  <button onClick={handleAiAnalysis} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Generate AI Insights</button>
                  <button onClick={()=>setIsAiAnalysisModalOpen(false)} className="w-full py-4 text-gray-400 font-bold">Close</button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {isBulkAssignOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setIsBulkAssignOpen(false)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-10 rounded-t-[48px]">
               <h2 className="text-2xl font-black mb-8">Bulk Assignment</h2>
               <div className="space-y-6">
                  <select value={bulkGroup} onChange={e=>setBulkGroup(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border-none">
                    <option value="">Select Group</option>
                    {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
                  </select>
                  <select value={bulkLabel} onChange={e=>setBulkLabel(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border-none" disabled={!bulkGroup}>
                    <option value="">Select Label</option>
                    {bulkLabelsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <button onClick={handleBulkAssign} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl">Update {selectedStudents.length} Students</button>
                  <button onClick={()=>setIsBulkAssignOpen(false)} className="w-full py-4 text-gray-400 font-bold">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
        )}

        {editingStudent && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={()=>setEditingStudent(null)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md p-10 rounded-t-[48px]">
               <h2 className="text-2xl font-black mb-2">{editingStudent.name}</h2>
               <p className="text-gray-400 font-bold mb-8">Edit Student Assignment</p>
               <div className="space-y-6">
                  <select value={editGroup} onChange={e=>setEditGroup(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none">
                    <option value="">Select Group</option>
                    {centers.map(c => <option key={c.center_id} value={c.center_id}>{c.name}</option>)}
                  </select>
                  <select value={editLabel} onChange={e=>setEditLabel(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold border-none outline-none" disabled={!editGroup}>
                    <option value="">Select Label</option>
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
                <h2 className="text-2xl font-black mb-8">Export Students</h2>
                <div className="space-y-3">
                   {['Excel (.xls)', 'CSV (.csv)', 'Print PDF'].map(f => (
                     <button key={f} className="w-full p-5 bg-gray-50 rounded-2xl font-bold flex items-center justify-between group hover:bg-blue-50 transition-colors">
                        <span className="group-hover:text-blue-600">{f}</span>
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9V3.5L18.5,9H13Z" /></svg>
                     </button>
                   ))}
                   <button onClick={()=>setIsDownloadModalOpen(false)} className="w-full py-6 text-gray-400 font-bold">Close</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default MenteesList;
