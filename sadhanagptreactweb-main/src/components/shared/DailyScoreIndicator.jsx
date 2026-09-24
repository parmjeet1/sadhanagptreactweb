import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const DailyScoreIndicator = ({ scoreData, isLoading }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const percentage = scoreData?.percentage || 0;
  const earned = scoreData?.earnedMarks || 0;
  const max = scoreData?.maxMarks || 0;

  // Determine color based on rules
  let colorClass = 'text-red-500';
  let strokeColor = '#ef4444'; // Red

  if (percentage >= 90) {
    colorClass = 'text-green-500';
    strokeColor = '#22c55e'; // Green
  } else if (percentage >= 70) {
    colorClass = 'text-teal-500';
    strokeColor = '#14b8a6'; // Teal
  } else if (percentage >= 50) {
    colorClass = 'text-orange-500';
    strokeColor = '#f97316'; // Orange
  }

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Close card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenMarkingScheme = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    navigate('/student/applied-marking-scheme');
  };

  return (
    <div ref={containerRef} className="fixed bottom-[100px] right-6 lg:right-10 z-40 group cursor-pointer">
      {/* Click / Hover Card */}
      <AnimatePresence>
        {(isOpen) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-3 w-56 z-50 pointer-events-auto"
          >
            <div className="bg-[#0f172a] text-white rounded-2xl p-4 shadow-2xl border border-gray-700/80 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <p className="font-bold text-xs uppercase tracking-wider text-gray-300">Sadhana Score</p>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-800 ${colorClass}`}>
                  {percentage}%
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Earned Marks</span>
                  <span className="font-bold text-white text-sm">{earned}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Possible Marks</span>
                  <span className="font-bold text-white text-sm">{max}</span>
                </div>
              </div>

              {/* Action Button: View Applied Marking Scheme */}
              <button
                onClick={handleOpenMarkingScheme}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-[12px] flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Applied Marking Scheme
              </button>
            </div>
            {/* Arrow */}
            <div className="w-3 h-3 bg-[#0f172a] rotate-45 absolute -bottom-1.5 right-7 border-r border-b border-gray-700"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Preview Tooltip (Shown when NOT clicked open) */}
      {!isOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none">
          <div className="bg-[#0f172a] text-white text-xs rounded-xl p-3 shadow-xl border border-gray-700">
            <p className="font-bold text-center mb-2 text-sm text-gray-200">Today's Sadhana Score</p>
            <div className="flex justify-between items-center py-1 border-b border-gray-700">
              <span className="text-gray-400 font-medium">Earned Marks</span>
              <span className="font-bold text-white text-sm">{earned}</span>
            </div>
            <div className="flex justify-between items-center py-1 pt-2">
              <span className="text-gray-400 font-medium">Possible Marks</span>
              <span className="font-bold text-white text-sm">{max}</span>
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="w-3 h-3 bg-[#0f172a] rotate-45 absolute -bottom-1.5 right-7 border-r border-b border-gray-700"></div>
        </div>
      )}

      {/* Circular Indicator Button */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-[68px] h-[68px] lg:w-[76px] lg:h-[76px] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center bg-white dark:bg-[#1E293B] border border-gray-300 dark:border-[#334155] relative overflow-hidden active:scale-95 transition-transform`}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        ) : (
          <>
            {/* Background Circle SVG */}
            <svg className="w-full h-full -rotate-90 absolute top-0 left-0" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                className="stroke-gray-100 dark:stroke-[#334155]"
                strokeWidth="5"
              />
              <motion.circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth="5"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>

            {/* Percentage Text */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <span className={`text-[16px] lg:text-[18px] font-black leading-none ${colorClass}`}>
                {percentage}<span className="text-[10px]">%</span>
              </span>
              <span className="text-[8px] lg:text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                Marks
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyScoreIndicator;
