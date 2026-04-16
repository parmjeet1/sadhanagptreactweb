import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import AddMentorModal from '../../components/shared/AddMentorModal';
import EditPersonalInfoModal from '../../components/shared/EditPersonalInfoModal';
import { getRequest, postRequest } from '../../services/api';


const CounsellorProfile = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [isAddMentorOpen, setIsAddMentorOpen] = useState(false);
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    const msg = Array.isArray(message) ? message[0] : message;
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    mobile: '',
    email: '',
    profile_image: ''
  });

  const [mentors, setMentors] = useState([]);
console.log("User details in CounsellorProfile:", userDetails);
  const fetchCounsellorProfile = () => {
    if (!userDetails?.user_id) return;
    setIsLoading(true);
    getRequest('/counslor-user-profile', { user_id: userDetails.user_id }, (res) => {
       const resData = res?.data;
       console.log("Counsellor profile response:", resData);

       if (resData && resData.status === 1 && resData.data) {
         const profile = resData.data.user || {};
         setUserInfo({
           name: profile.name || '',
           mobile: profile.mobile || profile.phone || '',
           email: profile.email || '',
           profile_image: profile.profile || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"
         });

         if (Array.isArray(resData.data.mentors)) setMentors(resData.data.mentors);
       }
       
       setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchCounsellorProfile();
  }, [userDetails]);

  const handleAddMentor = (counselorData) => {
    let newMentor;
    if (typeof counselorData === 'object' && counselorData !== null) {
      newMentor = {
        name: counselorData.name || 'Unknown Mentor',
        email: counselorData.email || '',
        temple: 'New Connection',
        avatar: counselorData.profile || `https://ui-avatars.com/api/?name=${encodeURIComponent(counselorData.name || 'Mentor')}&background=f97316&color=fff`
      };
      
      // Hit the API to add counsellor
      const payload = {
        user_id: userDetails.user_id,
        counsller_id: counselorData.user_id
      };
      
      postRequest('/add-counsllor', payload, (res) => {
        console.log("Add Counsellor Response:", res);
        if (res && (res.code === 200 || res.status === "success" || res.status === 1)) {
          showToast(res.message || "Mentor added successfully!");
          fetchCounsellorProfile();
        } else {
          showToast(res.message || "Failed to add mentor", "error");
        }
      });

    } else {
      const query = String(counselorData);
      newMentor = {
        name: query.includes('@') ? query.split('@')[0] : query,
        temple: 'New Connection',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(query)}&background=f97316&color=fff`
      };
    }

    setMentors([...mentors, newMentor]);
    setIsAddMentorOpen(false);
  };

  const handleSaveInfo = (newInfo) => {
    // Update local state right away for snappy UI
    setUserInfo({ ...userInfo, ...newInfo });
    setIsEditInfoOpen(false);

    // Post to backend
    const payload = {
      user_id: userDetails.user_id,
      name: newInfo.name,
      mobile: newInfo.mobile
    };

    postRequest('/edit-profile', payload, (res) => {
      console.log("Edit profile response:", res);
      if (res && (res.code === 200 || res.status === "success" || res.status === 1)) {
        showToast(res.message || "CounsellorProfile updated successfully!");
        fetchCounsellorProfile();
      } else {
        showToast(res.message || "Failed to update profile", "error");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#fdfcf5] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        <header className="px-8 pt-12 pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-black text-[#0f172a] tracking-tight leading-tight">My CounsellorProfile</h1>
            <p className="text-[14px] font-bold text-gray-500/60 mt-0.5">Account Details</p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center pt-32 pb-32 gap-3">
             <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-gray-500 font-medium">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* CounsellorProfile Identity */}
            <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white ring-8 ring-white/50">
              <img 
                src={userInfo.profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"} 
                className="w-full h-full object-cover" 
                alt="CounsellorProfile" 
              />
            </div>
            {/* Avatar edit pencil removed as per request */}
          </div>
          <h2 className="text-[24px] font-black text-[#0f172a] mt-5 tracking-tight">{userInfo.name}</h2>
          
          {/* <button 
            onClick={() => navigate('/student/ai-chat')}
            className="mt-4 px-6 py-2.5 bg-white border-2 border-[#1a73e8]/10 rounded-full flex items-center gap-2.5 text-[#1a73e8] font-black text-[14px] shadow-sm hover:bg-[#1a73e8]/5 hover:border-[#1a73e8]/20 active:scale-95 transition-all"
          >
            <div className="w-5 h-5 bg-[#1a73e8] rounded-md flex items-center justify-center text-white">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.535 4h5.07a1 1 0 01.99 1.145C11.205 14.505 9.715 15.5 8 15.5s-3.205-.995-4.525-2.355A1 1 0 014.465 12z" clipRule="evenodd" /></svg>
            </div>
            Chat with AI
          </button> */}
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

        {/* Logout Section */}
        <section className="px-8 mb-10">
          <button 
            onClick={() => {
              localStorage.clear();
              navigate('/');
            }}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-5 rounded-[32px] border-2 border-red-100/50 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout Account
          </button>
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
                  <img src={mentor.avatar || mentor.profile_image || `https://ui-avatars.com/api/?name=${mentor.name}&background=f97316&color=fff`} className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-gray-100" alt="" />
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
        </>
        )}

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

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'error' 
                ? 'bg-red-50 border-red-100 text-red-700' 
                : 'bg-green-50 border-green-100 text-green-700'
            }`}
          >
            {toast.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="text-[14px] font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CounsellorProfile;
