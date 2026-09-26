import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collectAndRedirectToChatGPT } from '../../services/aiDataCollectorService';

const AiDateFilterModal = ({
  isOpen,
  onClose,
  title = "Analyze with ChatGPT",
  subtitle = "Select date window to collect Sadhana metrics & launch ChatGPT",
  strategy = "BULK_MENTEES",
  entityParams = {},
  onSuccess
}) => {
  const [preset, setPreset] = useState('LAST_7_DAYS');
  
  // Custom date defaults
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [customFrom, setCustomFrom] = useState(sevenDaysAgoStr);
  const [customTo, setCustomTo] = useState(todayStr);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (preset === 'CUSTOM' && (!customFrom || !customTo)) {
      alert("Please select both start and end dates for custom date range.");
      return;
    }

    if (preset === 'CUSTOM' && customFrom > customTo) {
      alert("Start date cannot be after end date.");
      return;
    }

    // Pre-allocate window BEFORE async work to bypass pop-up blockers
    const newWin = window.open('about:blank', '_blank');

    setIsSubmitting(true);
    setStatusMessage('Collecting sadhana metrics...');

    try {
      await collectAndRedirectToChatGPT({
        strategy,
        preset,
        customFrom,
        customTo,
        entityParams,
        newWindowHandle: newWin,
        onStatusUpdate: (msg) => setStatusMessage(msg)
      });

      if (onSuccess) onSuccess();
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error("AI Modal collection error:", err);
      setIsSubmitting(false);
      setStatusMessage('Error launching ChatGPT redirect');
      if (newWin && !newWin.closed) newWin.close();
    }
  };

  const presetOptions = [
    { id: 'TODAY', label: 'Today', desc: 'Single day performance', icon: '📅' },
    { id: 'LAST_7_DAYS', label: '7 Days', desc: 'Past week trend', icon: '🗓️' },
    { id: 'MONTHLY', label: 'Monthly', desc: 'Current month / 30 days', icon: '📆' },
    { id: 'CUSTOM', label: 'Custom Range', desc: 'Select start & end date', icon: '⚙️' }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isSubmitting ? null : onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[98]"
        />

        {/* Bottom Sheet Modal (New Activity Theme) */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 w-full max-w-md mx-auto bg-white rounded-t-[32px] shadow-2xl z-[99] flex flex-col overflow-hidden"
          style={{
            left: 'auto',
            right: 'max(0px, calc(50% - 224px))'
          }}
        >
          {/* Top Drag Handle Bar */}
          <div 
            className="w-full pt-4 pb-2 flex justify-center sticky top-0 bg-white rounded-t-[32px] z-10 cursor-pointer"
            onClick={isSubmitting ? null : onClose}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
          </div>

          <div className="px-6 pb-8 pt-2 max-h-[85vh] overflow-y-auto hide-scrollbar space-y-6">
            {/* Header Title */}
            <div>
              <h2 className="text-[24px] font-extrabold text-[#0f172a] tracking-tight">{title}</h2>
              <p className="text-[13px] font-medium text-gray-500 mt-1">{subtitle}</p>
            </div>

            {/* Date Window Presets Grid */}
            <div className="space-y-3">
              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block">
                Select Date Window
              </label>

              <div className="grid grid-cols-2 gap-3">
                {presetOptions.map((opt) => {
                  const isSelected = preset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPreset(opt.id)}
                      disabled={isSubmitting}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                        isSelected 
                          ? 'border-[#1a73e8] bg-[#f0f7ff]' 
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-[#1a73e8]">
                          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}

                      <span className="text-2xl mb-1">{opt.icon}</span>
                      <span className={`text-[15px] font-bold ${isSelected ? 'text-[#0f172a]' : 'text-gray-700'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 text-center mt-0.5">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Date Range Picker */}
            {preset === 'CUSTOM' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-[#f8fafc] border border-gray-100 space-y-3"
              >
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block">
                  Custom Date Range
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">From Date</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-white text-[#0f172a] font-bold text-[14px] rounded-xl p-3 outline-none border border-gray-200 focus:border-[#1a73e8] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">To Date</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-white text-[#0f172a] font-bold text-[14px] rounded-xl p-3 outline-none border border-gray-200 focus:border-[#1a73e8] transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Status updates during collection */}
            {isSubmitting && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f0f7ff] border border-blue-100 text-[#1a73e8] text-xs font-bold">
                <div className="w-4 h-4 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
                <span>{statusMessage || 'Collecting metrics & launching ChatGPT...'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-4 text-[15px] font-bold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-[#1a73e8] hover:bg-[#155fc3] text-white text-[15px] font-bold rounded-full transition-all active:scale-[0.98] shadow-lg shadow-[#1a73e8]/30 flex items-center justify-center gap-2 h-[56px] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-[2px] border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Analyze with ChatGPT</span>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AiDateFilterModal;
