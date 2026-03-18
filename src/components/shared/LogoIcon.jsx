import React from 'react';

const LogoIcon = () => {
  return (
    <div className="w-[88px] h-[88px] bg-[#1a73e8] rounded-[30px] shadow-lg shadow-[#1a73e8]/20 flex items-center justify-center mb-8">
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
        <svg 
          className="w-6 h-6 text-[#1a73e8]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={3.5} 
            d="M5 13l4 4L19 7" 
          />
        </svg>
      </div>
    </div>
  );
};

export default LogoIcon;
