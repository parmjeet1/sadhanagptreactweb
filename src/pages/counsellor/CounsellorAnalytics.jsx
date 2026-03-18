import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import NotificationsPanel from '../../components/shared/NotificationsPanel';
import AddGroupModal from '../../components/shared/AddGroupModal';

const dummyGroups = [
  { id: 1, name: 'Karanpur Base', members: 24, status: 'Active', image: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&q=80&w=150&h=150', statusIcon: '⚡', iconColor: 'bg-blue-500' },
  { id: 2, name: 'Graphic Era Base', members: 18, status: 'New', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=150&h=150', statusIcon: 'NEW', iconColor: 'bg-green-500' },
  { id: 3, name: 'UIT Base', members: 32, status: 'Stable', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=150&h=150', statusIcon: '✓', iconColor: 'bg-gray-500' },
];

const CounsellorAnalytics = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [groups, setGroups] = useState(dummyGroups);
  const [selectedGroupForLabels, setSelectedGroupForLabels] = useState(dummyGroups[0].name);
  const [groupLabels, setGroupLabels] = useState({
    'Karanpur Base': ['First year', 'Second year', 'Third year'],
    'Graphic Era Base': ['A-Batch', 'B-Batch'],
    'UIT Base': ['Morning', 'Evening']
  });
  const [newLabelName, setNewLabelName] = useState('');

  const handleAddGroup = (newGroup) => {
    const nextId = groups.length ? Math.max(...groups.map(g => g.id)) + 1 : 1;
    setGroups([{
      id: nextId,
      name: newGroup.name,
      members: 0,
      status: 'New',
      image: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(newGroup.name) + '&background=f8fafc&color=0f172a',
      statusIcon: 'NEW',
      iconColor: 'bg-green-500'
    }, ...groups]);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans pb-28 relative overflow-x-hidden text-[#0f172a]">
      {/* Container holding the mobile width cleanly if opened on desktop */}
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6">
          <div>
            <h2 className="text-[#64748b] text-[15px] font-semibold mb-1">Hello,</h2>
            <h1 className="text-[28px] leading-tight font-extrabold text-[#0f172a] tracking-tight">
              Welcome, Manavantar<br />Prabhu Ji!
            </h1>
          </div>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0f172a] hover:bg-gray-50 active:scale-95 transition-all self-start"
          >
            {/* Bell Icon */}
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22A2 2 0 0 0 14 20H10A2 2 0 0 0 12 22M18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
            </svg>
            {/* Notification Badge */}
            <span className="absolute top-3 right-3 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 border-2 border-white"></span>
          </button>
        </div>

        {/* Big Blue Card - View Mentees */}
        <div className="px-6 mb-4">
          <div 
            onClick={() => navigate('/counsellor/mentees')}
            className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-3xl p-6 shadow-lg shadow-blue-500/30 relative overflow-hidden text-white flex flex-col justify-between items-start cursor-pointer active:scale-[0.98] transition-all min-h-[160px]"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[22px] font-bold mb-1">View Mentees</h2>
              <p className="text-white/80 text-[14px]">Manage your students & check progress</p>
            </div>
            
            <div className="absolute top-1/2 -translate-y-1/2 right-6 w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </div>

        {/* Two smaller cards block - Rewards and Labels */}
        <div className="px-6 flex gap-4 mb-8">
          <div 
            onClick={() => navigate('/counsellor/rewards')}
            className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 5H17V3H7V5H5C3.9 5 3 5.9 3 7V8C3 10.76 5.24 13 8 13H9.2C10.05 14.5 11.66 15.5 13.5 15.6V18H11V21H15V18H12.5V15.6C14.34 15.5 15.95 14.5 16.8 13H18C20.76 13 23 10.76 23 8V7C23 5.9 22.1 5 21 5H19M18 10C16.89 10 16 9.1 16 8V7H18V10M8 10C6.89 10 6 9.1 6 8V7H8V10Z" />
              </svg>
            </div>
            <span className="font-bold text-[#0f172a]">Rewards</span>
          </div>
          
          <div 
            onClick={() => setIsLabelsModalOpen(true)}
            className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.41 11.58L12.41 2.58A2 2 0 0 0 11 2H4A2 2 0 0 0 2 4V11A2 2 0 0 0 2.59 12.42L11.59 21.42A2 2 0 0 0 13 22A2 2 0 0 0 14.41 21.41L21.41 14.41A2 2 0 0 0 22 13A2 2 0 0 0 21.41 11.58M13 20L4 11V4H11L20 13M6.5 5A1.5 1.5 0 1 1 5 6.5A1.5 1.5 0 0 1 6.5 5Z" />
              </svg>
            </div>
            <span className="font-bold text-[#0f172a]">Mentee Labels</span>
          </div>
        </div>



        {/* My Groups Header */}
        <div className="px-6 flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-extrabold text-[#0f172a]">My Groups</h2>
          <button 
            onClick={() => setIsAddGroupOpen(true)}
            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        {/* Groups List */}
        <div className="px-6 space-y-4">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-[28px] p-4 shadow-sm border border-gray-100 flex items-center cursor-pointer hover:shadow-md transition-shadow">
              <div className="relative w-16 h-16 mr-4 shrink-0">
                <img src={group.image} alt={group.name} className="w-full h-full rounded-full object-cover shadow-sm bg-gray-100" />
                <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${group.iconColor}`}>
                  {group.statusIcon === 'NEW' ? 'NEW' : (
                    group.statusIcon === '⚡' ? (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11 15H6L13 1V9H18L11 23V15Z"/></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/></svg>
                    )
                  )}
                </div>
              </div>
              <div className="flex-1 mr-2">
                <h3 className="font-bold text-[16px] text-[#0f172a] whitespace-nowrap overflow-hidden text-ellipsis">{group.name}</h3>
                <p className="text-[#64748b] text-[13px] mt-0.5">{group.members} Members • {group.status}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V218Z" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/counsellor/group-mentees', { state: { groupName: group.name } });
                  }}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#475569] hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11M8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11M8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13M16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <AddGroupModal 
        isOpen={isAddGroupOpen}
        onClose={() => setIsAddGroupOpen(false)}
        onSave={handleAddGroup}
      />

      {/* Mentee Labels Modal */}
      <AnimatePresence>
        {isLabelsModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLabelsModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[40px] z-[70] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[22px] font-extrabold text-[#0f172a]">Mentee Labels</h2>
                <button 
                  onClick={() => setIsLabelsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Select Group</label>
                  <div className="relative">
                    <select
                      value={selectedGroupForLabels}
                      onChange={(e) => setSelectedGroupForLabels(e.target.value)}
                      className="w-full bg-[#f8fafc] border-2 border-transparent focus:border-blue-100 rounded-2xl py-4 px-5 text-[15px] font-bold text-[#0f172a] appearance-none outline-none transition-all"
                    >
                      {dummyGroups.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Available Labels</label>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {groupLabels[selectedGroupForLabels]?.map((label, idx) => (
                      <div key={idx} className="bg-blue-50 text-[#1a73e8] px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2">
                        {label}
                        <button className="text-blue-300 hover:text-blue-500">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add custom label..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="flex-1 bg-[#f8fafc] rounded-2xl py-4 px-5 text-[15px] font-bold text-[#0f172a] outline-none border-2 border-transparent focus:border-blue-100 transition-all placeholder:text-gray-300"
                    />
                    <button 
                      onClick={() => {
                        if (newLabelName.trim()) {
                          setGroupLabels({
                            ...groupLabels,
                            [selectedGroupForLabels]: [...(groupLabels[selectedGroupForLabels] || []), newLabelName.trim()]
                          });
                          setNewLabelName('');
                        }
                      }}
                      className="w-14 h-14 bg-[#1a73e8] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-4"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reusable Counsellor Bottom Navigation */}
      <CounsellorBottomNavigation />

    </div>
  );
};

export default CounsellorAnalytics;
