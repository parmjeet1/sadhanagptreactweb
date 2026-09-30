import React from 'react';

const DevelopedByTripa = ({ className = "" }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <a
        href="http://tripa.in/contact-us"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm text-[11px] font-semibold text-slate-600 hover:text-[#1a73e8] hover:border-[#1a73e8]/40 transition-all group active:scale-95 select-none"
        title="Visit tripa.in"
      >
        <span className="text-slate-500 font-medium">Developed by</span>
        <span className="font-extrabold text-[#1a73e8] group-hover:underline tracking-tight">tripa.in</span>
        <svg className="w-3 h-3 text-[#1a73e8] opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
};

export default DevelopedByTripa;
