import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import BottomNavigation from '../../components/student/BottomNavigation';
import AddMentorModal from '../../components/shared/AddMentorModal';
import EditPersonalInfoModal from '../../components/shared/EditPersonalInfoModal';
import DevelopedByTripa from '../../components/shared/DevelopedByTripa';
import { getRequest, postRequest, postRequestWithFile } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';
import { compressImage } from '../../utils/imageCompressor';


const Profile = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();
  const [isAddMentorOpen, setIsAddMentorOpen] = useState(false);
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [topRankerBadge, setTopRankerBadge] = useState(null); // { hasBadge, from, to }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message: message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const [userInfo, setUserInfo] = useState({
    name: '',
    mobile: '',
    email: '',
    dob: '',
    profile_image: '',
    reminder_enabled: false,
    reminder_days: 3
  });

  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);

      // 1. Compress image client-side before sending
      const compressedFile = await compressImage(file, 800, 0.75);

      // 2. Build FormData
      const formData = new FormData();
      formData.append('user_id', userDetails.user_id);
      formData.append('profile', compressedFile);

      // 3. Post to upload API with Multipart Header
      postRequestWithFile('/upload-profile-image', formData, (response) => {
        setIsUploadingImage(false);
        const { message, type } = processResponse(response.data);
        const newImage = response.data?.data?.profile_image;

        if (type === 'success' || response.data?.status === 1) {
          if (newImage) {
            setUserInfo(prev => ({ ...prev, profile_image: newImage }));
          }
          showToast("Profile picture updated!", "success");
          fetchProfile();
        } else {
          showToast(message || "Failed to update profile picture", "error");
        }
      });
    } catch (err) {
      console.error("Profile image upload error:", err);
      setIsUploadingImage(false);
      showToast("Failed to upload image", "error");
    }
  };

  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const handleSavePreferences = (enabled, days) => {
    setUserInfo(prev => ({ ...prev, reminder_enabled: enabled, reminder_days: days }));
    setIsSavingPreferences(true);

    const payload = {
      user_id: userDetails.user_id,
      reminder_enabled: enabled,
      reminder_days: days
    };

    postRequest('/update-reminder-preferences', payload, (response) => {
      setIsSavingPreferences(false);
      const { message, type } = processResponse(response.data);
      if (type === 'success' || response.data?.status === 1) {
        showToast("Preferences saved!", "success");
      } else {
        showToast(message || "Failed to save preferences", "error");
      }
    });
  };

  const [mentors, setMentors] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsPushEnabled(true);
        return;
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const browserSubscription = registration ? await registration.pushManager.getSubscription() : null;

        if (userDetails?.user_id) {
          getRequest('/check-push-status', { user_id: userDetails.user_id }, async (response) => {
            const backendHasSub = response.data?.isSubscribed;
            if (browserSubscription && !backendHasSub) {
              await browserSubscription.unsubscribe();
              setIsPushEnabled(false);
            } else if (browserSubscription && backendHasSub) {
              setIsPushEnabled(true);
            } else {
              setIsPushEnabled(false);
            }
          });
        } else {
          setIsPushEnabled(!!browserSubscription);
        }
      } catch (e) {
        setIsPushEnabled(false);
      }
    };

    if (userDetails?.user_id) {
      checkSubscription();
    }
  }, [userDetails?.user_id]);

  // Fetch top ranker badge
  useEffect(() => {
    if (!userDetails?.user_id) return;
    getRequest('/top-ranker-badge', { user_id: userDetails.user_id }, (res) => {
      const d = res?.data?.data;
      if (d?.hasBadge) setTopRankerBadge(d);
    });
  }, [userDetails?.user_id]);

  const handlePostFeedback = () => {
    if (!feedbackText.trim() || !userDetails?.user_id) return;
    setIsSubmittingFeedback(true);

    const payload = {
      user_id: userDetails.user_id,
      name: userInfo.name, // adding the name field
      message: feedbackText
    };

    postRequest('/app-feedback', payload, (response) => {
      setIsSubmittingFeedback(false);
      const { message, type } = processResponse(response.data);
      if (type === 'success' || response.data?.status === 1) {
        showToast("Feedback submitted successfully!", "success");
        setFeedbackText('');
      } else {
        showToast(message || "Failed to submit feedback", "error");
      }
    });
  };

  console.log("User details in Profile:", userDetails);
  const fetchProfile = () => {
    if (!userDetails?.user_id) return;
    setIsLoading(true);
    getRequest('/user-profile', { user_id: userDetails.user_id }, (response) => {
      const res = response.data;
      const dataObj = res?.data || res;

      if (dataObj.user) {
        setUserInfo({
          name: dataObj.user.name || '',
          mobile: dataObj.user.mobile || dataObj.user.phone || '',
          email: dataObj.user.email || '',
          dob: dataObj.user.dob || dataObj.user.birthday || '',
          profile_image: dataObj.user.profile || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
          reminder_enabled: dataObj.user.reminder_enabled === 1 || dataObj.user.reminder_enabled === true || dataObj.user.reminder_status === 1 || dataObj.user.reminder_status === true,
          reminder_days: dataObj.user.report_frequency_days || dataObj.user.reminder_days || 3
        });
      }

      if (Array.isArray(dataObj.mentors)) setMentors(dataObj.mentors);
      else if (dataObj.mentor && Array.isArray(dataObj.mentor)) setMentors(dataObj.mentor);

      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchProfile();
    if (userDetails?.user_id) {
      getRequest('/get-top-ranker-badge', { user_id: userDetails.user_id }, (res) => {
        if (res?.data?.data?.hasBadge) {
          setTopRankerBadge(res.data.data);
        }
      });
    }
  }, [userDetails?.user_id]);

  const [mentorToRemove, setMentorToRemove] = useState(null);

  const confirmRemoveMentor = () => {
    if (!mentorToRemove?.id) return;

    const payload = {
      user_id: userDetails.user_id,
      counsller_id: mentorToRemove.id
    };

    postRequest('/remove-counsellor', payload, (response) => {
      setMentorToRemove(null);
      const { message, type } = processResponse(response.data);
      if (type === 'success' || response.data?.status === 1) {
        showToast("Mentor removed successfully!", "success");
        fetchProfile();
      } else {
        showToast(message || "Failed to remove mentor", "error");
      }
    });
  };

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

      postRequest('/add-counsllor', payload, (response) => {
        const { message, type } = processResponse(response.data);
        console.log("Add Counsellor Response:", response);

        if (type === 'success') {
          showToast(message);
          fetchProfile();
        } else {
          showToast(message, type);
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
      mobile: newInfo.mobile,
      dob: newInfo.dob
    };

    postRequest('/edit-profile', payload, (response) => {
      const { message, type } = processResponse(response.data);
      const res = response.data;
      if (type === 'success' && res.data) {
        showToast(message);
        fetchProfile();
      } else {
        showToast(message, type);
      }
    });
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
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center pt-32 pb-32 gap-3">
            <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Identity */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white ring-8 ring-white/50 relative">
                  <img
                    src={userInfo.profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-xs">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] font-bold mt-1">Uploading...</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-lg border-2 border-white hover:bg-blue-600 active:scale-90 transition-all disabled:opacity-50"
                  title="Change Profile Photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />
              </div>
              <h2 className="text-[24px] font-black text-[#0f172a] mt-5 tracking-tight">{userInfo.name}</h2>

              {/* Top Ranker Badge */}
              {(topRankerBadge?.hasBadge || userInfo?.top_ranker_from) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 0.3 }}
                  className="mt-3 relative overflow-hidden"
                >
                  <div
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,215,0,0.18) 0%, rgba(167,139,250,0.14) 100%)',
                      border: '1.5px solid rgba(255,215,0,0.45)',
                      boxShadow: '0 4px 20px rgba(255,215,0,0.15)',
                    }}
                  >
                    <span style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 6px rgba(255,180,0,0.6))' }}>👑</span>
                    <div>
                      <p className="text-[12px] font-black text-[#b45309] leading-tight">Top Ranker #1</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 mt-1">
                        <span><strong className="text-gray-700">From:</strong> {new Date(topRankerBadge?.from || userInfo?.top_ranker_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>•</span>
                        <span><strong className="text-gray-700">To:</strong> {(topRankerBadge?.to || userInfo?.top_ranker_to) ? new Date(topRankerBadge?.to || userInfo?.top_ranker_to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Present'}</span>
                      </div>
                    </div>
                  </div>
                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)' }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3 }}
                  />
                </motion.div>
              )}

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

                <div className="w-full h-px bg-gray-50"></div>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#fcf8ed] flex items-center justify-center text-[#94a3b8]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest mb-1">Birthday</p>
                    <p className="text-[16px] font-bold text-[#1e293b]">
                      {userInfo.dob ? (new Date(userInfo.dob).toString() !== 'Invalid Date' ? new Date(userInfo.dob).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : userInfo.dob) : 'Not set'}
                    </p>
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
                      <img src={mentor.avatar || mentor.profile_image || `https://ui-avatars.com/api/?name=${mentor.name}&background=f97316&color=fff`} className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-gray-100" alt="" />
                      <div>
                        <h4 className="text-[16px] font-black text-[#1e293b]">{mentor.name}</h4>
                        {mentor.email && (
                          <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                            <svg className="w-3.5 h-3.5 text-[#f97316]" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                            <span className="text-[12px] font-bold tracking-tight text-gray-500">{mentor.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                          {/* <svg className="w-3.5 h-3.5 text-[#f97316]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg> */}
                          {/* <span className="text-[12px] font-bold tracking-tight">{mentor.temple || 'Mentor Connection'}</span> */}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMentorToRemove({
                            id: mentor.mentor_id || mentor.counsller_id || mentor.user_id,
                            name: mentor.name
                          });
                        }}
                        className="p-2.5 rounded-full text-rose-500 hover:bg-rose-50 active:scale-90 transition-all"
                        title="Remove Mentor"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
            {/* Notification Preferences */}
            <section className="px-8 mb-10">
              <div className="bg-white rounded-[40px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[16px] font-black text-[#1e293b]">Activity Reminders</h4>
                    <p className="text-[13px] font-bold text-gray-400 mt-1">Get notified if you miss your Sadhana activities</p>
                  </div>
                  <button
                    onClick={() => {
                      const newEnabled = !userInfo.reminder_enabled;
                      handleSavePreferences(newEnabled, userInfo.reminder_days || 3);
                    }}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${userInfo.reminder_enabled ? 'bg-[#f97316]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${userInfo.reminder_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {userInfo.reminder_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="h-px bg-gray-50 w-full mb-6"></div>
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-bold text-[#1e293b]">Remind me after missing</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#f8fafc] rounded-xl border-2 border-transparent focus-within:border-[#f97316]/20 overflow-hidden">
                            <button
                              onClick={() => userInfo.reminder_days > 1 && handleSavePreferences(userInfo.reminder_enabled, userInfo.reminder_days - 1)}
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#f97316] hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={userInfo.reminder_days}
                              onChange={(e) => {
                                if (e.target.value === '') {
                                  setUserInfo(prev => ({ ...prev, reminder_days: '' }));
                                  return;
                                }
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0 && val <= 10) handleSavePreferences(!!userInfo.reminder_enabled, val);
                              }}
                              onBlur={() => {
                                if (userInfo.reminder_days === '' || userInfo.reminder_days < 1) {
                                  handleSavePreferences(!!userInfo.reminder_enabled, 3);
                                }
                              }}
                              className="w-12 text-center bg-transparent text-[#1e293b] font-black text-[14px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => userInfo.reminder_days < 10 && handleSavePreferences(userInfo.reminder_enabled, userInfo.reminder_days + 1)}
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#f97316] hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            </button>
                          </div>
                          <span className="text-[14px] font-bold text-gray-400">days</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* App Feedback Section */}
            <section className="px-8 mb-10">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">App Feedback</h3>
              </div>
              <div className="bg-white rounded-[40px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col items-center">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us how we can improve this app..."
                  className="w-full bg-[#f8fafc] text-[#1e293b] font-medium text-[14px] rounded-3xl p-5 outline-none border-2 border-transparent focus:border-[#f97316]/20 transition-all resize-none h-28 shadow-inner"
                />
                <button
                  onClick={handlePostFeedback}
                  disabled={isSubmittingFeedback || !feedbackText.trim()}
                  className="mt-4 w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-black py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  {isSubmittingFeedback ? 'Posting...' : 'Post Feedback'}
                </button>
              </div>
            </section>




            {/* Logout Section */}
            <section className="px-8 pb-10">
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/');
                }}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-5 rounded-[32px] border-2 border-red-100/50 flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout Account
              </button>
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

      {/* Developed by tripa.in */}
      <DevelopedByTripa className="mt-8 mb-4 pb-20" />

      <BottomNavigation />

      {/* Remove Mentor Confirmation Modal */}
      <AnimatePresence>
        {mentorToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-[18px] font-black text-[#0f172a] mb-2">Remove Mentor?</h3>
              <p className="text-[14px] text-gray-500 font-semibold mb-6">
                Are you sure you want to remove <strong className="text-gray-800">{mentorToRemove.name}</strong> from your mentors list?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMentorToRemove(null)}
                  className="flex-1 py-3.5 rounded-full bg-gray-100 text-gray-700 font-bold text-[14px] hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveMentor}
                  className="flex-1 py-3.5 rounded-full bg-rose-500 text-white font-bold text-[14px] shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-all active:scale-95"
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'error'
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

export default Profile;
