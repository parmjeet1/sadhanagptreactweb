import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';

const generateDummyStudents = () => {
  const groups = ['Karanpur', 'DIT', 'UIT'];
  const labels = ['First year', 'Second year', 'Third year'];
  const avatars = [
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  ];
  const firstNames = ['Arjun', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Karan', 'Neha', 'Rahul', 'Aditi'];
  const lastNames = ['Das', 'Sharma', 'Gupta', 'Singh', 'Malhotra', 'Patel', 'Kumar', 'Verma', 'Joshi', 'Rajput'];
  
  return Array.from({ length: 35 }).map((_, i) => ({
    id: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[(i + 3) % lastNames.length]}`,
    group: groups[i % groups.length],
    label: labels[(i + 1) % labels.length],
    avatar: avatars[i % avatars.length],
    activities: [
      { type: 'wakeup', time: `${Math.floor(Math.random() * 2) + 3}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` },
      { type: 'sleep', time: `${Math.floor(Math.random() * 2) + 21}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` },
      { type: 'chatting', duration_minutes: Math.floor(Math.random() * 8) + 8 },
      { type: 'hearing', duration_minutes: Math.floor(Math.random() * 30) + 30 },
      { type: 'reading', duration_minutes: Math.floor(Math.random() * 40) + 20 }
    ]
  }));
};

const initialDummyStudents = generateDummyStudents();

const CounsellorViewMentees = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState(initialDummyStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedLabel, setSelectedLabel] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  
  // Edit State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editGroup, setEditGroup] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const SELECTION_LIMIT = 5;
  
  const groupLabelMapping = {
    'Karanpur': ['First year', 'Second year', 'Third year'],
    'DIT': ['A-Batch', 'B-Batch'],
    'UIT': ['Morning', 'Evening']
  };

  const currentAvailableLabels = selectedGroup === 'All' 
    ? Array.from(new Set(Object.values(groupLabelMapping).flat())) 
    : (groupLabelMapping[selectedGroup] || []);
  
  const observerTarget = useRef(null);

  // Filter Logic
  const allFilteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || student.group === selectedGroup;
    const matchesLabel = selectedLabel === 'All' || student.label === selectedLabel;
    return matchesSearch && matchesGroup && matchesLabel;
  });

  const filteredStudents = allFilteredStudents.slice(0, visibleCount);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 10, allFilteredStudents.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [allFilteredStudents.length]);

  // Reset pagination on filter or search change
  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, selectedGroup, selectedLabel]);

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      if (prev.includes(id)) {
        return prev.filter(sid => sid !== id);
      } else {
        if (prev.length >= SELECTION_LIMIT) {
          showError(`Only up to ${SELECTION_LIMIT} students can be selected for AI Analysis at a time due to processing limits.`);
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const selectAll = () => {
    if (selectedStudents.length === allFilteredStudents.length || selectedStudents.length === SELECTION_LIMIT) {
      setSelectedStudents([]);
    } else {
      if (allFilteredStudents.length > SELECTION_LIMIT) {
        showError(`Selected first ${SELECTION_LIMIT} students. Only ${SELECTION_LIMIT} are supported at once.`);
        setSelectedStudents(allFilteredStudents.slice(0, SELECTION_LIMIT).map(s => s.id));
      } else {
        setSelectedStudents(allFilteredStudents.map(s => s.id));
      }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-x-hidden">
      {/* Error Toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-4 right-4 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 max-w-sm mx-auto">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              <p className="text-[13px] font-bold leading-tight">{errorMessage}</p>
            </div>
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-4 right-4 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 max-w-sm mx-auto">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              <p className="text-[13px] font-bold leading-tight">{successMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="w-full max-w-md mx-auto transition-all duration-300" 
        style={{ paddingBottom: selectedStudents.length > 0 ? '280px' : '100px' }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white z-20 border-b border-gray-100">
          <button 
            onClick={() => navigate(-1)}
            className="text-[#64748b] font-bold text-[16px] hover:text-[#0f172a] transition-colors"
          >
            Cancel
          </button>
          
          <h1 className="text-[18px] font-extrabold text-[#0f172a] tracking-tight">Select Students</h1>
          
          <button 
            onClick={selectAll}
            className="text-[#1a73e8] font-bold text-[16px] hover:text-[#155fc3] transition-colors"
          >
            {selectedStudents.length === allFilteredStudents.length && allFilteredStudents.length > 0 ? 'None' : 'All'}
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] rounded-full py-3.5 pl-12 pr-6 text-[15px] font-medium text-[#0f172a] placeholder:text-[#94a3b8] outline-none border border-transparent focus:border-blue-100 transition-all"
            />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex gap-3 overflow-x-auto hide-scrollbar">
          {/* Group Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className={`appearance-none bg-[#f1f5f9] font-bold text-[13px] rounded-full py-2.5 pl-5 pr-9 border-none outline-none transition-colors cursor-pointer ${
                selectedGroup !== 'All' ? 'bg-[#1a73e8] text-white' : 'text-[#0f172a] hover:bg-[#e2e8f0]'
              }`}
            >
              <option value="All">All Groups</option>
              <option value="Karanpur">Karanpur</option>
              <option value="DIT">DIT</option>
              <option value="UIT">UIT</option>
            </select>
            <div className={`absolute right-3.5 top-3 pointer-events-none ${selectedGroup !== 'All' ? 'text-white' : 'text-[#64748b]'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Label Filter (Popup Trigger) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsLabelPopupOpen(true)}
              className={`flex items-center gap-2 font-bold text-[13px] rounded-full py-2.5 px-5 border-none outline-none transition-all active:scale-95 ${
                selectedLabel !== 'All' ? 'bg-[#1a73e8] text-white shadow-lg shadow-blue-500/20' : 'bg-[#f1f5f9] text-[#0f172a] hover:bg-[#e2e8f0]'
              }`}
            >
              <span>{selectedLabel === 'All' ? 'All Labels' : selectedLabel}</span>
              <svg className={`w-3.5 h-3.5 ${selectedLabel !== 'All' ? 'text-white' : 'text-[#64748b]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>

        {/* Student List */}
        <div className="px-2">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-medium">No students found.</div>
          ) : (
            filteredStudents.map(student => (
              <div 
                key={student.id} 
                onClick={() => toggleStudent(student.id)}
                className="flex items-center px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img src={student.avatar} alt={student.name} className="w-14 h-14 rounded-full object-cover shadow-sm bg-gray-100" />
                </div>
                
                {/* Details */}
                <div className="ml-4 flex-1 pr-2">
                  <h3 className="font-extrabold text-[16px] text-[#0f172a] leading-tight mb-0.5">{student.name}</h3>
                  <p className="text-[13px] font-medium text-[#64748b]">
                    {student.group} • {student.label}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 shrink-0">
                  <button 
                    className="text-[#94a3b8] hover:text-[#0f172a] transition-colors" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/counsellor/mentee/${student.id}`, { state: { student } });
                    }}
                    title="View Student Report"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button 
                    className="text-[#94a3b8] hover:text-[#0f172a] transition-colors" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingStudent(student);
                      setEditGroup(student.group);
                      setEditLabel(student.label);
                    }}
                    title="Edit Assignment"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  
                  {/* Checkbox */}
                  <div className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedStudents.includes(student.id) 
                      ? 'bg-[#1a73e8] border-[#1a73e8]' 
                      : 'border-[#cbd5e1] hover:border-[#94a3b8]'
                  }`}>
                    {selectedStudents.includes(student.id) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Intersection Observer Target */}
          {filteredStudents.length < allFilteredStudents.length && (
            <div ref={observerTarget} className="py-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

      </div>

      <AnimatePresence>
        {selectedStudents.length > 0 && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-[84px] left-0 right-0 max-w-md mx-auto z-40 px-4"
          >
            <div className="bg-[#1a73e8] rounded-[24px] p-4 shadow-2xl shadow-blue-500/40 w-full relative">
              <div className="flex justify-between items-center mb-3 text-white px-1">
                <span className="font-bold text-[14px]">Selected: {selectedStudents.length} students</span>
                <button 
                  onClick={() => setSelectedStudents([])}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <button 
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  const selectedData = selectedStudents.map(id => {
                    const student = students.find(s => s.id === id);
                    return {
                      student_id: student.id,
                      name: student.name,
                      date: today,
                      activities: student.activities
                    };
                  });
                  navigate('/counsellor/ai-chat', { state: { studentsData: selectedData } });
                }}
                className="w-full bg-white text-[#1a73e8] rounded-full py-2.5 mb-2 font-extrabold text-[14px] flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93M13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07M12 11.5A1.5 1.5 0 0 1 10.5 10A1.5 1.5 0 0 1 12 8.5A1.5 1.5 0 0 1 13.5 10A1.5 1.5 0 0 1 12 11.5M12 15.5A1.5 1.5 0 0 1 10.5 14A1.5 1.5 0 0 1 12 12.5A1.5 1.5 0 0 1 13.5 14A1.5 1.5 0 0 1 12 15.5Z" /></svg>
                AI Analysis
              </button>

              <div className="flex gap-2">
                <button className="flex-1 border-2 border-white/20 text-white rounded-full py-2.5 font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-[0.98] transition-all px-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,9V6H3V9H0V11H3V14H5V11H8V9H5Z" /></svg>
                  <span className="truncate">Add to Group</span>
                </button>
                <button 
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="flex-1 border-2 border-white/20 text-white rounded-full py-2.5 font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-[0.98] transition-all px-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>
                  <span className="truncate">Download</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLabelPopupOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLabelPopupOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] z-[70] shadow-2xl p-6 pb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-[20px] font-extrabold text-[#0f172a]">Select Label</h2>
                  <p className="text-[13px] font-bold text-[#64748b] mt-0.5">Filter mentees by category</p>
                </div>
                <button 
                  onClick={() => setIsLabelPopupOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    setSelectedLabel('All');
                    setIsLabelPopupOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    selectedLabel === 'All' ? 'bg-blue-50 border-2 border-blue-100' : 'bg-[#f8fafc] border-2 border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[15px] font-bold ${selectedLabel === 'All' ? 'text-[#1a73e8]' : 'text-[#0f172a]'}`}>All Labels</span>
                  {selectedLabel === 'All' && (
                    <div className="w-5 h-5 bg-[#1a73e8] rounded-full flex items-center justify-center text-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>

                {currentAvailableLabels.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedLabel(label);
                      setIsLabelPopupOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                      selectedLabel === label ? 'bg-blue-50 border-2 border-blue-100' : 'bg-[#f8fafc] border-2 border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-[15px] font-bold ${selectedLabel === label ? 'text-[#1a73e8]' : 'text-[#0f172a]'}`}>{label}</span>
                    {selectedLabel === label && (
                      <div className="w-5 h-5 bg-[#1a73e8] rounded-full flex items-center justify-center text-white">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Assignment Modal */}
      <AnimatePresence>
        {editingStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingStudent(null)}
              className="fixed inset-0 bg-black/40 z-[80] backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 z-[90] bg-white rounded-t-[32px] p-6 pb-12 max-w-md mx-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-[20px] font-extrabold text-[#0f172a]">Edit Assignment</h3>
                  <p className="text-[13px] font-bold text-[#64748b] mt-0.5">{editingStudent.name}</p>
                </div>
                <button 
                  onClick={() => setEditingStudent(null)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-transform"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">Group</label>
                  <div className="relative">
                    <select
                      value={editGroup}
                      onChange={(e) => {
                        setEditGroup(e.target.value);
                        // Reset label if mapping doesn't have the current label
                        const newLabels = groupLabelMapping[e.target.value] || [];
                        if (newLabels.length > 0 && !newLabels.includes(editLabel)) {
                          setEditLabel(newLabels[0]);
                        } else if (newLabels.length === 0) {
                          setEditLabel('');
                        }
                      }}
                      className="w-full appearance-none bg-[#f8fafc] border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-bold text-[#0f172a] outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select Group</option>
                      {Object.keys(groupLabelMapping).map(grp => (
                        <option key={grp} value={grp}>{grp}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-[18px] pointer-events-none text-[#64748b]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">Label</label>
                  <div className="relative">
                    <select
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      disabled={!editGroup}
                      className="w-full appearance-none bg-[#f8fafc] border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-bold text-[#0f172a] outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>Select Label</option>
                      {(groupLabelMapping[editGroup] || []).map(lbl => (
                        <option key={lbl} value={lbl}>{lbl}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-[18px] pointer-events-none text-[#64748b]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setStudents(prev => prev.map(s => 
                      s.id === editingStudent.id ? { ...s, group: editGroup, label: editLabel } : s
                    ));
                    setEditingStudent(null);
                    setSuccessMessage('Student assignment updated successfully!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }}
                  disabled={!editGroup || !editLabel}
                  className="w-full bg-[#1a73e8] text-white font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#155fc3] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Assignment
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Download Options Modal */}
      <AnimatePresence>
        {isDownloadModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDownloadModalOpen(false)}
              className="fixed inset-0 bg-black/40 z-[80] backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 z-[90] bg-white rounded-t-[32px] p-6 pb-12 max-w-md mx-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-[20px] font-extrabold text-[#0f172a]">Download Format</h3>
                  <p className="text-[13px] font-bold text-[#64748b] mt-0.5">Export {selectedStudents.length} selected students</p>
                </div>
                <button 
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-transform"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Excel (.xls)', type: 'excel', icon: 'bg-green-100 text-green-600' },
                  { label: 'CSV (.csv)', type: 'csv', icon: 'bg-orange-100 text-orange-600' },
                  { label: 'Print / Save PDF', type: 'pdf', icon: 'bg-red-100 text-red-600' }
                ].map((format) => {
                  return (
                    <button 
                      key={format.type}
                      onClick={() => {
                        const selectedData = selectedStudents.map(id => students.find(s => s.id === id));
                        
                        if (format.type === 'pdf') {
                          // Native Print for PDF
                          const printWindow = window.open('', '_blank');
                          const content = `
                            <html>
                              <head>
                                <title>Mentee Report - ${new Date().toLocaleDateString()}</title>
                                <style>
                                  body { font-family: sans-serif; padding: 40px; }
                                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                  th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                  th { background-color: #f8fafc; font-weight: bold; }
                                  h1 { color: #0f172a; margin-bottom: 5px; }
                                </style>
                              </head>
                              <body>
                                <h1>Mentee Status Report</h1>
                                <p>Generated on: ${new Date().toLocaleString()}</p>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Name</th>
                                      <th>Group</th>
                                      <th>Label</th>
                                      <th>Wakeup</th>
                                      <th>Chanting (min)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${selectedData.map(s => `
                                      <tr>
                                        <td>${s.name}</td>
                                        <td>${s.group}</td>
                                        <td>${s.label}</td>
                                        <td>${s.activities.find(a => a.type === 'wakeup')?.time || 'N/A'}</td>
                                        <td>${s.activities.find(a => a.type === 'chatting')?.duration_minutes || '0'}</td>
                                      </tr>
                                    `).join('')}
                                  </tbody>
                                </table>
                              </body>
                            </html>
                          `;
                          printWindow.document.write(content);
                          printWindow.document.close();
                          printWindow.print();
                        } else {
                          // Excel / CSV
                          let fileContent = "";
                          let mimeType = "text/csv";
                          let extension = "csv";

                          if (format.type === 'csv') {
                            const headers = "Name,Group,Label,Wakeup Time,Chanting Minutes\n";
                            const rows = selectedData.map(s => {
                              const wakeup = s.activities.find(a => a.type === 'wakeup')?.time || 'N/A';
                              const chanting = s.activities.find(a => a.type === 'chatting')?.duration_minutes || '0';
                              return `"${s.name}","${s.group}","${s.label}","${wakeup}","${chanting}"`;
                            }).join("\n");
                            fileContent = headers + rows;
                          } else {
                            // Excel as HTML Table (compatible with Excel)
                            mimeType = "application/vnd.ms-excel";
                            extension = "xls";
                            fileContent = `
                              <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                              <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Mentees</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
                              <body>
                                <table>
                                  <tr><th>Name</th><th>Group</th><th>Label</th><th>Wakeup</th><th>Chanting</th></tr>
                                  ${selectedData.map(s => `
                                    <tr>
                                      <td>${s.name}</td>
                                      <td>${s.group}</td>
                                      <td>${s.label}</td>
                                      <td>${s.activities.find(a => a.type === 'wakeup')?.time || ''}</td>
                                      <td>${s.activities.find(a => a.type === 'chatting')?.duration_minutes || ''}</td>
                                    </tr>
                                  `).join('')}
                                </table>
                              </body>
                              </html>
                            `;
                          }
                          
                          const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
                          const link = document.createElement("a");
                          const url = URL.createObjectURL(blob);
                          
                          link.setAttribute("href", url);
                          link.setAttribute("download", `mentees_export.${extension}`);
                          link.style.visibility = 'hidden';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                        
                        setIsDownloadModalOpen(false);
                        setSuccessMessage(`Exported successfully as ${format.label}!`);
                        setTimeout(() => setSuccessMessage(''), 3000);
                      }}
                      className="w-full bg-[#f8fafc] border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-[#0f172a] font-bold py-4 px-5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3 space-x-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${format.icon}`}>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9V3.5L18.5,9H13Z" /></svg>
                        </div>
                        <span className="text-[15px]">{format.label}</span>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorViewMentees;
