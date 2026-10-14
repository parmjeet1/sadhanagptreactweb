import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MentorAvatar from './MentorAvatar';
import ProfilePhotoViewer from './ProfilePhotoViewer';

/**
 * MentorDetailsModal
 * Displays mentor profile details popup matching the hand-drawn layout:
 * - Centered mentor profile photo / avatar at the top
 * - Name
 * - Date of Birth (DOB)
 * - Email
 * - Phone Number
 * 
 * Shows "Not provided" for any missing fields.
 * Supports Dark Mode and Light Mode.
 */
const MentorDetailsModal = ({ isOpen, onClose, mentor }) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerImageSrc, setViewerImageSrc] = useState('');

  // Reset viewer state when parent modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsViewerOpen(false);
      setViewerImageSrc('');
    }
  }, [isOpen]);

  // Close on Escape key press (only if full-screen photo viewer is NOT currently open)
  useEffect(() => {
    if (!isOpen || isViewerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isViewerOpen, onClose]);

  if (!isOpen || !mentor) return null;

  const displayName = mentor.name || mentor.mentor_name || 'Not provided';
  const displayEmail = mentor.email || mentor.mentor_email || 'Not provided';
  const displayPhone = mentor.mobile || mentor.mentor_mobile || mentor.phone || 'Not provided';

  // Format DOB safely
  let formattedDob = 'Not provided';
  const rawDob = mentor.dob || mentor.mentor_dob || mentor.birthday;
  if (rawDob) {
    try {
      const date = new Date(rawDob);
      if (!isNaN(date.getTime())) {
        formattedDob = date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      } else {
        formattedDob = String(rawDob);
      }
    } catch (e) {
      formattedDob = String(rawDob);
    }
  }

  return (
    <>
      <AnimatePresence>
        <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mentor-details-title"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-[36px] p-6 sm:p-7 shadow-2xl border border-gray-100 dark:border-slate-800 text-[#0f172a] dark:text-white max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Centered Profile Photo */}
          <div className="flex flex-col items-center mt-1 mb-5">
            <div className="relative mb-3">
              <MentorAvatar
                mentor={mentor}
                className="w-28 h-28 rounded-full object-cover shadow-xl border-4 border-white dark:border-[#0f172a] ring-4 ring-orange-500/20 shrink-0 cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform"
                fallbackClassName="w-28 h-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-4xl shadow-xl border-4 border-white dark:border-[#0f172a] ring-4 ring-orange-500/20 shrink-0 select-none"
                onPhotoClick={(src) => {
                  setViewerImageSrc(src);
                  setIsViewerOpen(true);
                }}
              />
            </div>

            <h3
              id="mentor-details-title"
              className="text-[20px] font-black text-[#0f172a] dark:text-white tracking-tight text-center px-4"
            >
              {displayName}
            </h3>
            <span className="mt-1 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 text-[#f97316] dark:text-orange-400 border border-orange-100 dark:border-orange-900/40">
              Mentor
            </span>
          </div>

          {/* Vertical Details List */}
          <div className="space-y-3">
            {/* Name Row */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-0.5">
                  Name
                </p>
                <p className={`text-[14px] font-bold truncate ${displayName === 'Not provided' ? 'text-gray-400 dark:text-gray-500 italic font-medium' : 'text-[#0f172a] dark:text-white'}`}>
                  {displayName}
                </p>
              </div>
            </div>

            {/* Date of Birth Row */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-0.5">
                  Date of Birth
                </p>
                <p className={`text-[14px] font-bold truncate ${formattedDob === 'Not provided' ? 'text-gray-400 dark:text-gray-500 italic font-medium' : 'text-[#0f172a] dark:text-white'}`}>
                  {formattedDob}
                </p>
              </div>
            </div>

            {/* Email Row */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-0.5">
                  Email
                </p>
                <p className={`text-[14px] font-bold break-all ${displayEmail === 'Not provided' ? 'text-gray-400 dark:text-gray-500 italic font-medium' : 'text-[#0f172a] dark:text-white'}`}>
                  {displayEmail}
                </p>
              </div>
            </div>

            {/* Phone Number Row */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-0.5">
                  Phone Number
                </p>
                <p className={`text-[14px] font-bold truncate ${displayPhone === 'Not provided' ? 'text-gray-400 dark:text-gray-500 italic font-medium' : 'text-[#0f172a] dark:text-white'}`}>
                  {displayPhone}
                </p>
              </div>
            </div>
          </div>

          {/* Close action button */}
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full py-3.5 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold text-[14px] transition-all active:scale-98"
          >
            Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>

    {/* Full-Screen Mentor Profile Photo Viewer */}
    <ProfilePhotoViewer
      isOpen={isViewerOpen}
      onClose={() => setIsViewerOpen(false)}
      imageUrl={viewerImageSrc}
      name={displayName !== 'Not provided' ? displayName : ''}
      readOnly={true}
    />
  </>
);
};

export default MentorDetailsModal;
