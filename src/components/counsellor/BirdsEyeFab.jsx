import React from 'react';
import DraggableFloating from '../shared/DraggableFloating';

/**
 * Bird's Eye View floating button (blue bird). Shown on the mentor HOME
 * screen only (/counsellor/dashboard) — deliberately not placed in
 * CounsellorBottomNavigation.jsx, which is shared by every other counsellor
 * page. Same size (68px, 76px on large screens) as the mic launcher and the marks indicator, and
 * draggable like them. Starts stacked above the mic launcher (mic sits at
 * bottom-[188px]; this starts at bottom-[276px]).
 *
 * The glow ring mirrors the mic launcher's animate-sadhna-glow-loop
 * treatment, but in blue via animate-sadhna-glow-loop-blue (index.css).
 */
const BirdsEyeFab = ({ onClick }) => (
  <DraggableFloating storageKey="birds-eye" className="fixed z-40 bottom-[276px] right-6 lg:right-10">
    <span className="absolute inset-0 rounded-full bg-[#1a73e8] animate-ping opacity-40" />
    <button
      type="button"
      onClick={onClick}
      aria-label="Bird's Eye View"
      title="Bird's Eye View"
      className="relative w-[68px] h-[68px] lg:w-[76px] lg:h-[76px] rounded-full bg-gradient-to-tr from-[#1a73e8] to-[#4a9bff] text-white shadow-lg shadow-blue-500/40 flex items-center justify-center active:scale-95 transition-transform animate-sadhna-glow-loop-blue"
    >
      {/* Original flying-bird glyph (wing raised, gentle float). */}
      <svg width="38" height="38" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'birdFloat 2.4s ease-in-out infinite' }}>
        <path d="M27 25C25 17 19 11 11 9c1.6 4 2.4 8 2.8 13z" fill="#bcd6ff"/>
        <path d="M12 27L2.5 28.5 4.6 31.2 2.8 34.4 13 31.5z" fill="#e3edff"/>
        <path d="M10.5 28.5C14 22.5 24 21.5 32 23.4c3.6.9 6.4 2.1 8.6 3.9-2.8.9-5.4 2.6-8.6 4.6-6.6 4-15 3.6-21.5-3.4z" fill="#ffffff"/>
        <circle cx="35.2" cy="24" r="4.3" fill="#ffffff"/>
        <path d="M38.6 23.2L45.5 25l-6.9 2z" fill="#f6a623"/>
        <circle cx="36.4" cy="23.1" r="0.95" fill="#0d1b2a"/>
        <circle cx="36.7" cy="22.8" r="0.3" fill="#fff"/>
        <path d="M31.5 25.5C28.5 15.5 20 8 8.5 4.5c2.6 5 4.2 10.5 5.6 21z" fill="#e3edff" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round"/>
        <path d="M27 23C24 16.5 18.5 11.5 12 8.6M22.5 24.5C21 19.5 17.5 15.5 13.5 13" stroke="#8fb8f5" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    </button>
  </DraggableFloating>
);

export default BirdsEyeFab;
