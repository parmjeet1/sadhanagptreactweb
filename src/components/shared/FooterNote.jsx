import React from 'react';

const FooterNote = () => {
  return (
    <div className="flex items-center gap-2 mt-8 text-[13px] text-[#94a3b8] font-medium">
      <svg 
        className="w-3.5 h-3.5" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" 
          clipRule="evenodd" 
        />
      </svg>
      We never post without permission
    </div>
  );
};

export default FooterNote;
