import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postRequest, getRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';

const ReportSettingsModal = ({ isOpen, onClose, userDetails, showToast }) => {
  const [autoReportStatus, setAutoReportStatus] = useState(1);
  const [reportFrequencyDays, setReportFrequencyDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the latest parameters from the Profile API whenever the Gear Icon is clicked
  useEffect(() => {
    if (isOpen && userDetails?.user_id) {
      getRequest('/counslor-user-profile', { user_id: userDetails.user_id }, (response) => {
        const res = response?.data;
        // Check standard success patterns from your backend
        if (res?.code === 200 || res?.status === 1 || res?.success) {
          const profile = res.data?.user || {};
          setAutoReportStatus(profile.auto_report_status === 1);
          setReportFrequencyDays(profile.report_frequency_days || 7);
        }
      });
    }
  }, [isOpen, userDetails]);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSubmitting(true);

    const payload = {
      user_id: userDetails.user_id,
      auto_report_status: autoReportStatus ? 1 : 0,
      report_frequency_days: Number(reportFrequencyDays)
    };

    postRequest('/toggle-email-report', payload, (response) => {
      setIsSubmitting(false);

      // Use existing processResponse wrapper to check for standardized responses
      const res = response?.data;
      if (res?.success === true || res?.status === 1 || res?.code === 200) {
        showToast(res.message || "Email Report Settings updated!", "success");
        onClose();
      } else {
        showToast(res?.message || "Failed to update settings.", "error");
      }
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-0">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a73e8] to-[#2563eb] px-6 py-5 flex items-center justify-between shadow-md z-10">
            <h2 className="text-xl font-bold text-white tracking-tight">Report Settings</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {/* Toggle Switch Area */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[#0f172a] font-bold">Email Reports</h3>
                <p className="text-sm text-gray-500">Receive automated CSV mentee logs</p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoReportStatus ? 'bg-[#1a73e8]' : 'bg-gray-200'}`}
                onClick={() => setAutoReportStatus(prev => !prev)}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoReportStatus ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Frequency Selector Area */}
            <div className={`transition-opacity duration-300 ${!autoReportStatus ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[#0f172a] font-bold">Report Frequency</label>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Active: {reportFrequencyDays} Days
                </span>
              </div>
              <select
                value={reportFrequencyDays}
                onChange={(e) => setReportFrequencyDays(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#1a73e8] focus:border-[#1a73e8] block p-3 font-medium outline-none"
              >
                <option value={3}>Every 3 Days</option>
                <option value={7}>Weekly (Every 7 Days)</option>
                <option value={14}>Bi-Weekly (Every 14 Days)</option>
                <option value={30}>Monthly (Every 30 Days)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                This determines how many days backwards the PDF looks.
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#1a73e8] hover:bg-[#155fc3] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#1a73e8]/30 transition-all active:scale-[0.98] disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Settings...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportSettingsModal;
