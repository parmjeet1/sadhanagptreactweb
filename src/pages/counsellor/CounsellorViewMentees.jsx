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
  }));
};

const dummyStudents = generateDummyStudents();

const CounsellorViewMentees = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedLabel, setSelectedLabel] = useState('All');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  
  const observerTarget = useRef(null);

  // Filter Logic
  const allFilteredStudents = dummyStudents.filter(student => {
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

  const toggleStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedStudents.length === allFilteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(allFilteredStudents.map(s => s.id));
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-x-hidden">
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

          {/* Label Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className={`appearance-none bg-[#f1f5f9] font-bold text-[13px] rounded-full py-2.5 pl-5 pr-9 border-none outline-none transition-colors cursor-pointer ${
                selectedLabel !== 'All' ? 'bg-[#1a73e8] text-white' : 'text-[#0f172a] hover:bg-[#e2e8f0]'
              }`}
            >
              <option value="All">All Labels</option>
              <option value="First year">First year</option>
              <option value="Second year">Second year</option>
              <option value="Third year">Third year</option>
            </select>
            <div className={`absolute right-3.5 top-3 pointer-events-none ${selectedLabel !== 'All' ? 'text-white' : 'text-[#64748b]'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
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
                  <button className="text-[#94a3b8] hover:text-[#0f172a] transition-colors" onClick={(e) => e.stopPropagation()}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </button>
                  <button className="text-[#94a3b8] hover:text-[#0f172a] transition-colors" onClick={(e) => e.stopPropagation()}>
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

              <button className="w-full bg-white text-[#1a73e8] rounded-full py-2.5 mb-2 font-extrabold text-[14px] flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93M13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07M12 11.5A1.5 1.5 0 0 1 10.5 10A1.5 1.5 0 0 1 12 8.5A1.5 1.5 0 0 1 13.5 10A1.5 1.5 0 0 1 12 11.5M12 15.5A1.5 1.5 0 0 1 10.5 14A1.5 1.5 0 0 1 12 12.5A1.5 1.5 0 0 1 13.5 14A1.5 1.5 0 0 1 12 15.5Z" /></svg>
                AI Analysis
              </button>

              <div className="flex gap-2">
                <button className="flex-1 border-2 border-white/20 text-white rounded-full py-2.5 font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-[0.98] transition-all px-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,9V6H3V9H0V11H3V14H5V11H8V9H5Z" /></svg>
                  <span className="truncate">Add to Group</span>
                </button>
                <button className="flex-1 border-2 border-white/20 text-white rounded-full py-2.5 font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-[0.98] transition-all px-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10 4.19 10 4.1 10 4A2 2 0 0 1 12 2A2 2 0 0 1 14 4C14 4.1 14 4.19 14 4.29C16.97 5.17 19 7.9 19 11V17L21 19M14 21A2 2 0 0 1 12 23A2 2 0 0 1 10 21"/></svg>
                  <span className="truncate">Notifications</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorViewMentees;
