import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingStepTwo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    dob: '',
    counselorEmail: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinue = () => {
    // Navigate to next step or handle form submission
    console.log("Form Data:", formData);
    navigate('/student-dashboard'); 
  };

  return (
    <div className="min-h-screen bg-white flex justify-center font-sans">
      <div className="w-full max-w-md bg-white flex flex-col relative">
        
        {/* Header section with back button and steps */}
        <div className="pt-6 pb-2 px-6 flex flex-col gap-4 sticky top-0 bg-white z-10 w-full">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1 -ml-1 text-[#0f172a] hover:bg-gray-50 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <span className="text-[14px] font-semibold text-[#475569] absolute left-1/2 -translate-x-1/2">
              Step 2 of 3
            </span>
          </div>

          {/* Progress Bars */}
          <div className="flex gap-2 w-full mt-2">
            <div className="h-[4px] rounded-full bg-[#1a73e8] w-1/3"></div>
            <div className="h-[4px] rounded-full bg-[#1a73e8] w-1/3"></div>
            <div className="h-[4px] rounded-full bg-[#e2e8f0] w-1/3"></div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
          
          <h1 className="text-[28px] font-bold text-[#0f172a] mb-2 tracking-tight">
            Tell us a bit more
          </h1>
          <p className="text-[15px] text-[#64748b] font-medium mb-8">
            This helps us personalize your journey
          </p>

          <div className="space-y-6">
            
            {/* Name Input */}
            <div>
              <label className="block text-[15px] font-medium text-[#0f172a] mb-2">Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name" 
                className="w-full border border-[#cbd5e1] rounded-2xl px-5 py-3.5 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-[15px] font-medium text-[#0f172a] mb-2">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address" 
                className="w-full border border-[#cbd5e1] rounded-2xl px-5 py-3.5 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
              />
            </div>

            {/* Mobile Number Input */}
            <div>
              <label className="block text-[15px] font-medium text-[#0f172a] mb-2">Mobile Number</label>
              <input 
                type="tel" 
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter your mobile number, no country co" 
                className="w-full border border-[#cbd5e1] rounded-2xl px-5 py-3.5 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
              />
            </div>

            {/* Lock Info Text */}
            <div className="flex items-center gap-2 mt-[-8px]">
              <svg className="w-[14px] h-[14px] text-[#64748b]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-[13px] text-[#64748b] font-medium">We'll only use this for important updates</p>
            </div>

            {/* Date of Birth Input */}
            <div>
              <label className="block text-[15px] font-medium text-[#0f172a] mb-2">Date of Birth</label>
              <input 
                type="text" 
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                placeholder="Select your date of birth" 
                className="w-full border border-[#cbd5e1] rounded-2xl px-5 py-3.5 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => (!e.target.value ? e.target.type = 'text' : null)}
              />
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-[#f1f5f9] my-6"></div>

            {/* Counselor Email Input */}
            <div>
              <label className="block text-[15px] font-medium text-[#0f172a] mb-2">Counselor Email</label>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  name="counselorEmail"
                  value={formData.counselorEmail}
                  onChange={handleChange}
                  placeholder="Search by name or email" 
                  className="w-full border border-[#cbd5e1] rounded-2xl pl-5 pr-12 py-3.5 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                />
                <div className="absolute right-4 text-[#64748b]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 w-full max-w-md bg-white p-6 border-t border-gray-50 z-20">
          <button 
            onClick={handleContinue}
            className="w-full bg-[#1a73e8] hover:bg-[#155fc3] text-white font-bold text-[16px] py-4 rounded-full shadow-lg shadow-[#1a73e8]/30 transition-all active:scale-[0.98] outline-none"
          >
            Continue
          </button>
        </div>

      </div>
    </div>
  );
};

export default OnboardingStepTwo;
