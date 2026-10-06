import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import DraggableFloating from './DraggableFloating';
import MarksWindow from './MarksWindow';

// Tap the circle: a window with today's score (arrow = marks of each activity); tap the circle in it for the
// marking scheme (Default Scheme / Make Custom Scheme). `activityDate` is the day being shown (YYYY-MM-DD),
// `onSchemeChanged` lets the page ask the server for the score again after the scheme was switched or edited.
const DailyScoreIndicator = ({ scoreData, isLoading, activityDate, onSchemeChanged }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  // The card normally opens above the icon, aligned to its right edge. Because
  // the icon can be dragged anywhere, flip it to the left edge / below the icon
  // when it would otherwise run off the screen.
  const [placement, setPlacement] = useState({ alignLeft: false, below: false, lift: 0 });

  // `lift` pushes the card up past any other floating icons (bird's-eye,
  // chatbot) stacked above the marks icon, so the card opens above the whole
  // stack instead of covering them.
  const computePlacement = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    let topEdge = rect.top;
    document.querySelectorAll('[data-floating-fab]').forEach((el) => {
      if (el.contains(containerRef.current)) return;
      const r = el.getBoundingClientRect();
      const overlapsColumn = r.left < rect.right && r.right > rect.left;
      if (overlapsColumn && r.top < rect.top) topEdge = Math.min(topEdge, r.top);
    });
    const below = topEdge < 230;
    const lift = below ? 0 : Math.round(rect.top - topEdge);
    const next = { alignLeft: rect.right < 240, below, lift };
    setPlacement((prev) => (prev.alignLeft === next.alignLeft && prev.below === next.below && prev.lift === next.lift ? prev : next));
  };

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

  return (
    <DraggableFloating
      storageKey="marks"
      containerRef={containerRef}
      className={`fixed bottom-[100px] right-6 lg:right-10 ${isOpen ? 'z-[55]' : 'z-40'} hover:z-[55] group cursor-pointer`}
    >
      <div onMouseEnter={computePlacement} className="relative">
      {/* The window (score, per-activity marks, marking scheme) */}
      {isOpen && (
        <MarksWindow
          scoreData={scoreData}
          activityDate={activityDate}
          onClose={() => setIsOpen(false)}
          onChanged={onSchemeChanged}
        />
      )}

      {/* Hover Preview Tooltip (Shown when NOT clicked open) */}
      {!isOpen && (
        <div className={`absolute ${placement.below ? 'top-full mt-3' : 'bottom-full mb-3'} ${placement.alignLeft ? 'left-0' : 'right-0'} w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none`}>
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
          <div className={`w-3 h-3 bg-[#0f172a] rotate-45 absolute ${placement.alignLeft ? 'left-7' : 'right-7'} ${placement.below ? '-top-1.5 border-l border-t' : '-bottom-1.5 border-r border-b'} border-gray-700`}></div>
        </div>
      )}

      {/* Circular Indicator Button */}
      <div
        onClick={() => { computePlacement(); setIsOpen(true); }}
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
    </DraggableFloating>
  );
};

export default DailyScoreIndicator;
