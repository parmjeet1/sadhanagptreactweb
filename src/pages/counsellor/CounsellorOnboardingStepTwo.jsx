import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postRequest, getRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';
import ThemeToggle from '../../components/shared/ThemeToggle';
import {  AnimatePresence } from 'framer-motion';

const CounsellorOnboardingStepTwo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    templeId: ''

  });

  const [temples, setTemples] = useState([]);
  const [isFetchingTemples, setIsFetchingTemples] = useState(true);

  const [userDetails, setUserDetails] = useState(JSON.parse(localStorage.getItem('user_details') || 'null'));
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    const msg = Array.isArray(message) ? message[0] : message;
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    let initialDetails = userDetails;

    if (initialDetails) {
      setFormData(prev => ({
        ...prev,
        name: initialDetails.name || prev.name,
        email: initialDetails.email || prev.email
      }));
    }

    // Fetch the list of dynamically available temples/centers
    getRequest('/temple-list', { page_no: 1 }, (response) => {
       console.log("Temple API response:", response);
       const res = response.data;
       let templeData = [];
       if (Array.isArray(res)) {
           templeData = res;
       } else if (res && res.data) {
           if (Array.isArray(res.data)) templeData = res.data;
           else if (Array.isArray(res.data.temple_list)) templeData = res.data.temple_list;
           else if (Array.isArray(res.data.temples)) templeData = res.data.temples;
           else if (Array.isArray(res.data.data)) templeData = res.data.data;
       } else if (res && Array.isArray(res.temple_list)) {
           templeData = res.temple_list;
       } else if (res && Array.isArray(res.temples)) {
           templeData = res.temples;
       }
       
       if (Array.isArray(templeData) && templeData.length > 0) {
           setTemples(templeData);
       } else {
           console.warn("Could not find a valid temple array in response:", response);
       }
       setIsFetchingTemples(false);
    });

  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleContinue = async () => {
    const userRole = userDetails?.userRole || 'counsellor';
    
    const finalData = {
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      temple_id: formData.templeId,
      birthday: formData.birthday || null,
      user_type: userRole,
      device_name: "Web Browser",
      added_from: "Web App",
      google_id: userDetails?.google_id || userDetails?.id,
      profile: userDetails?.picture || null
      
    };

   
    postRequest('/on-boarding', finalData, (response) => {
      const { message, type } = processResponse(response);
      const res = response.data;

      if (type === 'success') {
        if (res?.data) {
          const existingDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
          const updatedDetails = {
            ...existingDetails,
            ...(res.data || res) 
          };
          localStorage.setItem('user_details', JSON.stringify(updatedDetails));
          setUserDetails(res.data);
        }
       navigate('/counsellor/dashboard'); 
        // showToast(message || "Onboarding completed successfully!", "success");
        // setTimeout(() => navigate('/counsellor/dashboard'), 1500);
      } else {
        showToast(message || "Failed to complete onboarding", "error");
        console.error("Failed to complete onboarding:", message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1220] transition-colors duration-300 text-[#0f172a] dark:text-[#F8FAFC] flex justify-center font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#0B1220] flex flex-col relative">

        <div className="pt-6 pb-2 px-6 flex flex-col gap-4 sticky top-0 bg-white dark:bg-[#0B1220] z-10 w-full transition-colors duration-300">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-[#0f172a] dark:text-[#F8FAFC] hover:bg-gray-100 dark:hover:bg-[#1D2B40] rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-[#34465F]" />
              <div className="w-8 h-2 rounded-full bg-blue-600 dark:bg-[#3B82F6]" />
            </div>
            <ThemeToggle />
          </div>
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f172a] dark:text-[#F8FAFC] tracking-tight leading-tight"> Almost there </h1>
            <p className="text-[15px] font-medium text-[#64748b] dark:text-[#B6C5DC] mt-1.5 leading-relaxed"> Complete your Counsellor profile </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-28 hide-scrollbar">
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[13px] font-bold text-[#475569] dark:text-[#B6C5DC] uppercase tracking-wider mb-2 ml-1"> Full Name </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full bg-[#f8fafc] dark:bg-[#1D2B40] text-[#0f172a] dark:text-[#F8FAFC] border-2 border-transparent dark:border-[#34465F] focus:border-blue-500 dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#1D2B40] text-[15px] font-semibold px-4 py-3.5 rounded-xl outline-none transition-all placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-[#9AAAC0]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#475569] dark:text-[#B6C5DC] uppercase tracking-wider mb-2 ml-1"> Email Address </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full bg-[#f8fafc] dark:bg-[#1D2B40] text-[#0f172a] dark:text-[#F8FAFC] border-2 border-transparent dark:border-[#34465F] focus:border-blue-500 dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#1D2B40] text-[15px] font-semibold px-4 py-3.5 rounded-xl outline-none transition-all placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-[#9AAAC0]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#475569] dark:text-[#B6C5DC] uppercase tracking-wider mb-2 ml-1"> Mobile Number </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter your mobile number"
                className="w-full bg-[#f8fafc] dark:bg-[#1D2B40] text-[#0f172a] dark:text-[#F8FAFC] border-2 border-transparent dark:border-[#34465F] focus:border-blue-500 dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#1D2B40] text-[15px] font-semibold px-4 py-3.5 rounded-xl outline-none transition-all placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-[#9AAAC0]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#475569] dark:text-[#B6C5DC] uppercase tracking-wider mb-2 ml-1">Birthday </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday || ''}
                onChange={handleChange}
                placeholder="Enter your Birth Date"
                className="w-full bg-[#f8fafc] dark:bg-[#1D2B40] text-[#0f172a] dark:text-[#F8FAFC] border-2 border-transparent dark:border-[#34465F] focus:border-blue-500 dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#1D2B40] text-[15px] font-semibold px-4 py-3.5 rounded-xl outline-none transition-all placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-[#9AAAC0] dark:[color-scheme:dark]"
              />
            </div>
            <div className="relative">
              <label className="block text-[13px] font-bold text-[#475569] dark:text-[#B6C5DC] uppercase tracking-wider mb-2 ml-1"> Temple / Center Name </label>
              <div className="relative">
                  <select
                    name="templeId"
                    value={formData.templeId}
                    onChange={handleChange}
                    disabled={isFetchingTemples || temples.length === 0}
                    className="w-full appearance-none bg-[#f8fafc] dark:bg-[#1D2B40] text-[#0f172a] dark:text-[#F8FAFC] border-2 border-transparent dark:border-[#34465F] focus:border-blue-500 dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#1D2B40] text-[15px] font-semibold px-4 py-3.5 pr-10 rounded-xl outline-none transition-all disabled:opacity-60"
                  >
                    <option value="" disabled className="text-gray-400 dark:text-[#9AAAC0] dark:bg-[#1D2B40]">
                      {isFetchingTemples ? "Fetching temples..." : "Select your base temple..."}
                    </option>
                    {temples.map(temple => {
                        const id = temple.temple_id || temple.id;
                        const name = temple.temple_name || temple.name;
                        return <option key={id} value={id} className="dark:bg-[#142238] dark:text-[#F8FAFC]">{name}</option>;
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-[#B6C5DC]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed sm:absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-[#0B1220] border-t border-gray-100 dark:border-[#34465F] z-20 transition-colors duration-300">
          <button
            onClick={handleContinue}
            disabled={!formData.name || !formData.email || !formData.mobile || !formData.templeId}
            className="w-full bg-[#1a73e8] dark:bg-[#3B82F6] disabled:bg-gray-300 dark:disabled:bg-[#1D2B40] dark:disabled:text-gray-500 disabled:shadow-none hover:bg-[#155fc3] dark:hover:bg-[#2563EB] text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_rgba(26,115,232,0.3)] transition-all active:scale-[0.98] outline-none"
          >
            Continue to Dashboard
          </button>
        </div>

        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border w-max max-w-[90%] ${
                toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
              }`}
            >
              <div className="font-bold text-[14px]">{toast.message}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CounsellorOnboardingStepTwo;
