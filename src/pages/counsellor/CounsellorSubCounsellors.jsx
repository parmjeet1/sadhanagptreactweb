import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';

const generateSubCounsellors = () => [
  'All Sub-Counsellors', 'Ramesh Sharma', 'Suresh Verma', 'Amit Singh', 'Neha Gupta', 'Pooja Kumar'
];

const generateDummyGroups = () => {
  const baseNames = ['Karanpur', 'DIT', 'UIT', 'Graphic Era', 'Devbhoomi', 'Doon', 'Law College', 'Selaqui'];
  const subCounsellors = ['Ramesh Sharma', 'Suresh Verma', 'Amit Singh', 'Neha Gupta', 'Pooja Kumar'];
  
  return Array.from({ length: 30 }).map((_, i) => ({
    id: i + 1,
    name: `${baseNames[i % baseNames.length]} Base ${Math.floor(i/baseNames.length) + 1}`,
    subCounsellor: subCounsellors[i % subCounsellors.length],
    members: Math.floor(Math.random() * 20) + 10,
    avgWakeup: `${Math.floor(Math.random() * 2) + 4}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM`,
    chantingScore: Math.floor(Math.random() * 50) + 50, // percentage
    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(baseNames[i % baseNames.length])}&background=f8fafc&color=1a73e8`,
  }));
};

const initialGroups = generateDummyGroups();
const subCounsellorList = generateSubCounsellors();

const CounsellorSubCounsellors = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState(initialGroups);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCounsellor, setSelectedSubCounsellor] = useState('All Sub-Counsellors');
  const [visibleCount, setVisibleCount] = useState(10);
  
  const observerTarget = useRef(null);

  // Filter Logic
  const allFiltered = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSC = selectedSubCounsellor === 'All Sub-Counsellors' || g.subCounsellor === selectedSubCounsellor;
    return matchesSearch && matchesSC;
  });

  const filteredVisible = allFiltered.slice(0, visibleCount);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 10, allFiltered.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [allFiltered.length]);

  // Reset pagination on filter or search change
  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, selectedSubCounsellor]);

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto pb-[100px]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sticky top-0 bg-white z-20 border-b border-gray-100">
          <button 
            onClick={() => navigate(-1)}
            className="text-[#64748b] font-bold text-[16px] hover:text-[#0f172a] transition-colors"
          >
            Back
          </button>
          
          <h1 className="text-[18px] font-extrabold text-[#0f172a] tracking-tight">Sub Counsellors</h1>
          
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by group name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] rounded-full py-3.5 pl-12 pr-6 text-[15px] font-medium text-[#0f172a] placeholder:text-[#94a3b8] outline-none border border-transparent focus:border-blue-100 transition-all"
            />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Sub Counsellor Filter Box */}
        <div className="px-6 pb-2">
          <div className="relative">
            <select
              value={selectedSubCounsellor}
              onChange={(e) => setSelectedSubCounsellor(e.target.value)}
              className={`w-full appearance-none font-bold text-[14px] rounded-2xl py-3.5 pl-5 pr-9 border-2 outline-none transition-colors cursor-pointer ${
                selectedSubCounsellor !== 'All Sub-Counsellors' ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-lg shadow-blue-500/20' : 'bg-[#f1f5f9] border-transparent text-[#0f172a] focus:bg-white focus:border-blue-100'
              }`}
            >
              {subCounsellorList.map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
            <div className={`absolute right-4 top-[18px] pointer-events-none ${selectedSubCounsellor !== 'All Sub-Counsellors' ? 'text-white' : 'text-[#64748b]'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="px-2 mt-2">
          {filteredVisible.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-medium">No groups found.</div>
          ) : (
            filteredVisible.map(g => (
              <div 
                key={g.id} 
                className="flex items-center px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img src={g.image} alt={g.name} className="w-14 h-14 rounded-full object-cover shadow-sm bg-gray-100" />
                </div>
                
                {/* Details */}
                <div className="ml-4 flex-1 pr-2">
                  <h3 className="font-extrabold text-[16px] text-[#0f172a] leading-tight mb-1">{g.name}</h3>
                  <div className="flex gap-3 text-[12px] font-bold text-[#64748b]">
                    <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                      {g.members}
                    </span>
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-600 px-2 py-1 rounded-lg">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z" /></svg>
                      {g.avgWakeup} avg
                    </span>
                  </div>
                  <div className="text-[12px] font-bold text-gray-500 mt-1.5">
                    Sub-Counsellor: <span className="text-[#0f172a]">{g.subCounsellor}</span>
                  </div>
                </div>

                {/* Performance Ring / Arrow */}
                <div className="flex flex-col items-center shrink-0 ml-2">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-100"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#1a73e8]"
                        strokeWidth="3"
                        strokeDasharray={`${g.chantingScore}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex items-center justify-center text-[10px] font-extrabold text-[#1a73e8]">
                      {g.chantingScore}%
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Metrics</span>
                </div>
              </div>
            ))
          )}
          
          {/* Intersection Observer Target */}
          {filteredVisible.length < allFiltered.length && (
            <div ref={observerTarget} className="py-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
      
      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorSubCounsellors;
