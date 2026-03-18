import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import AddMentorModal from '../../components/shared/AddMentorModal';
import EditPersonalInfoModal from '../../components/shared/EditPersonalInfoModal';

const CounsellorProfile = () => {
  const navigate = useNavigate();
  const [isAddMentorOpen, setIsAddMentorOpen] = useState(false);
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  
  const [userInfo, setUserInfo] = useState({
    name: 'Ram',
    mobile: '+1 (555) 108-1008',
    email: 'arjuna.das@email.com'
  });

  const [mentors, setMentors] = useState([
    {
      name: 'Govinda Das',
      temple: 'Seattle Temple',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop'
    },
    {
      name: 'Radha Devi',
      temple: 'Downtown Temple',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop'
    }
  ]);

  const handleAddMentor = (query) => {
    const newMentor = {
      name: query.includes('@') ? query.split('@')[0] : query,
      temple: 'New Connection',
      avatar: `https://ui-avatars.com/api/?name=${query}&background=f97316&color=fff`
    };
    setMentors([...mentors, newMentor]);
    setIsAddMentorOpen(false);
  };

  const handleSaveInfo = (newInfo) => {
    setUserInfo({ ...userInfo, ...newInfo });
    setIsEditInfoOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#fdfcf5] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        <header className="px-8 pt-12 pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-black text-[#0f172a] tracking-tight leading-tight">My Profile</h1>
            <p className="text-[14px] font-bold text-gray-500/60 mt-0.5">Account Details</p>
          </div>
          {/* Settings icon removed as per request */}
        </header>

        {/* Profile Identity */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white ring-8 ring-white/50">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop" 
                className="w-full h-full object-cover" 
                alt="Profile" 
              />
            </div>
            {/* Avatar edit pencil removed as per request */}
          </div>
          <h2 className="text-[24px] font-black text-[#0f172a] mt-5 tracking-tight">{userInfo.name}</h2>
          
          <button 
            onClick={() => navigate('/counsellor/ai-chat')}
            className="mt-4 px-6 py-2.5 bg-white border-2 border-[#1a73e8]/10 rounded-full flex items-center gap-2.5 text-[#1a73e8] font-black text-[14px] shadow-sm hover:bg-[#1a73e8]/5 hover:border-[#1a73e8]/20 active:scale-95 transition-all"
          >
            <div className="w-5 h-5 bg-[#1a73e8] rounded-md flex items-center justify-center text-white">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.535 4h5.07a1 1 0 01.99 1.145C11.205 14.505 9.715 15.5 8 15.5s-3.205-.995-4.525-2.355A1 1 0 014.465 12z" clipRule="evenodd" /></svg>
            </div>
            Chat with AI
          </button>
        </div>

        {/* Personal Info */}
        <section className="px-8 mb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Personal Info</h3>
            <button 
              onClick={() => setIsEditInfoOpen(true)}
              className="text-[13px] font-black text-[#f97316]"
            >
              Edit
            </button>
          </div>
          <div className="bg-white rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-gray-50 space-y-8">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#fcf8ed] flex items-center justify-center text-[#94a3b8]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest mb-1">Email</p>
                <p className="text-[16px] font-bold text-[#1e293b]">{userInfo.email}</p>
              </div>
            </div>
            
            <div className="w-full h-px bg-gray-50"></div>

            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#fcf8ed] flex items-center justify-center text-[#94a3b8]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest mb-1">Phone</p>
                <p className="text-[16px] font-bold text-[#1e293b]">{userInfo.mobile}</p>
              </div>
            </div>
          </div>
        </section>

        {/* My Mentors */}
        <section className="px-8 pb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">My Mentors</h3>
            <button 
              onClick={() => setIsAddMentorOpen(true)}
              className="w-8 h-8 rounded-full bg-[#fef3c7]/60 flex items-center justify-center text-[#f97316] font-black text-[20px] transition-all hover:bg-[#fef3c7]"
            >
              +
            </button>
          </div>
          <div className="space-y-4">
            {mentors.map((mentor, idx) => (
              <motion.div 
                key={mentor.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[40px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <img src={mentor.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt="" />
                  <div>
                    <h4 className="text-[16px] font-black text-[#1e293b]">{mentor.name}</h4>
                    <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                      <svg className="w-3.5 h-3.5 text-[#f97316]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                      <span className="text-[12px] font-bold tracking-tight">{mentor.temple}</span>
                    </div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      <AddMentorModal 
        isOpen={isAddMentorOpen} 
        onClose={() => setIsAddMentorOpen(false)} 
        onAdd={handleAddMentor} 
      />

      <EditPersonalInfoModal 
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        userInfo={userInfo}
        onSave={handleSaveInfo}
      />

      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorProfile;
