import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const CounsellorGroupMentees = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupName } = location.state || { groupName: 'All' };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(groupName.replace(' Base', ''));
  const [selectedLabel, setSelectedLabel] = useState('All');
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);
  
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
        className="w-full max-w-md mx-auto transition-all duration-300 pb-[100px]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white z-20 border-b border-gray-100">
          <button 
            onClick={() => navigate(-1)}
            className="text-[#64748b] font-bold text-[16px] hover:text-[#0f172a] transition-colors"
          >
            Back
          </button>
          
          <h1 className="text-[18px] font-extrabold text-[#0f172a] tracking-tight">{selectedGroup === 'All' ? 'All Mentees' : `${selectedGroup} Mentees`}</h1>
          
          <div className="w-10"></div> {/* Spacer for center alignment */}
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
                className="flex items-center px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
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
                <div className="flex items-center shrink-0">
                  {/* View Details Icon */}
                  <button 
                    onClick={() => console.log('View details for', student.name)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-[#1a73e8] hover:bg-blue-50 active:scale-95 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
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

      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorGroupMentees;
