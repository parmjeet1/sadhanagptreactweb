import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest } from '../../services/api';
import { getDateRangeForPreset } from '../../utils/chatGptUtils';
import {
  exportBulkReportsToExcel,
  exportBulkReportsToPDF,
  exportBulkReportsToCSV
} from '../../utils/exportUtils';

const StudentExportModal = ({
  isOpen,
  onClose,
  userDetails,
  onSuccess
}) => {
  const [preset, setPreset] = useState('LAST_7_DAYS');
  const [format, setFormat] = useState('EXCEL'); // EXCEL, PDF, CSV

  // Custom date defaults
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [customFrom, setCustomFrom] = useState(sevenDaysAgoStr);
  const [customTo, setCustomTo] = useState(todayStr);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setStatusMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const presetOptions = [
    { id: 'LAST_7_DAYS', label: '7 Days' },
    { id: 'MONTHLY', label: '30 Days' },
    { id: 'CUSTOM', label: 'Custom' }
  ];

  const fetchStudentReportRows = async () => {
    const { startDate, endDate, apiFilter } = getDateRangeForPreset(preset, customFrom, customTo);

    return new Promise((resolve, reject) => {
      const params = {
        user_id: userDetails?.user_id,
        filter: apiFilter,
        start_date: startDate,
        end_date: endDate
      };

      getRequest('/student-activities-analytics', params, (response) => {
        const res = response?.data;
        const dataObj = res?.data || res;
        let payloadArray = [];

        if (Array.isArray(dataObj)) payloadArray = dataObj;
        else if (dataObj && Array.isArray(dataObj.activities_analytics)) payloadArray = dataObj.activities_analytics;
        else if (dataObj && Array.isArray(dataObj.data)) payloadArray = dataObj.data;

        const studentName = userDetails?.name || 'Student';
        const rows = [];

        if (Array.isArray(payloadArray) && payloadArray.length > 0) {
          payloadArray.forEach(act => {
            const actName = act.name || act.activity_name || 'Activity';
            if (Array.isArray(act.daily_data) && act.daily_data.length > 0) {
              act.daily_data.forEach(d => {
                rows.push({
                  student_id: userDetails?.user_id || 'student',
                  student_name: studentName,
                  center_name: 'Personal Sadhana',
                  label_name: 'My Sadhana',
                  activity_date: d.activity_date || d.date || '-',
                  activity_name: actName,
                  activity_value: d.count ?? d.value ?? '-',
                  activity_marks: d.marks ?? 0
                });
              });
            } else {
              rows.push({
                student_id: userDetails?.user_id || 'student',
                student_name: studentName,
                center_name: 'Personal Sadhana',
                label_name: 'My Sadhana',
                activity_date: 'No Logged Activity',
                activity_name: actName,
                activity_value: act.value ?? act.count ?? '-',
                activity_marks: act.marks ?? 0
              });
            }
          });
        }

        resolve({ rows, startDate, endDate });
      }, (err) => {
        reject(err);
      });
    });
  };

  const handleDownload = async () => {
    if (preset === 'CUSTOM' && (!customFrom || !customTo)) {
      alert("Please select both start and end dates for custom date range.");
      return;
    }

    if (preset === 'CUSTOM' && customFrom > customTo) {
      alert("Start date cannot be after end date.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Generating report file...');

    try {
      const { rows, startDate, endDate } = await fetchStudentReportRows();

      if (!rows || rows.length === 0) {
        alert("No sadhana logs found for the selected date range.");
        setIsProcessing(false);
        return;
      }

      const cleanStudentName = (userDetails?.name || 'Student').replace(/\s+/g, '_');
      const baseFilename = `sadhana_report_${cleanStudentName}_${startDate}_to_${endDate}`;

      if (format === 'EXCEL') {
        await exportBulkReportsToExcel(rows, `${baseFilename}.xlsx`, startDate, endDate);
      } else if (format === 'PDF') {
        await exportBulkReportsToPDF(rows, `${startDate} to ${endDate}`, `${baseFilename}.pdf`, startDate, endDate);
      } else if (format === 'CSV') {
        exportBulkReportsToCSV(rows, `${baseFilename}.csv`, startDate, endDate);
      }

      setStatusMessage('Report downloaded successfully!');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error("Student export error:", err);
      setIsProcessing(false);
      alert("Failed to generate report. Please try again.");
    }
  };

  const handleShare = async () => {
    if (preset === 'CUSTOM' && (!customFrom || !customTo)) {
      alert("Please select both start and end dates for custom date range.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Preparing report for sharing...');

    try {
      const { rows, startDate, endDate } = await fetchStudentReportRows();

      if (!rows || rows.length === 0) {
        alert("No sadhana logs found for the selected date range to share.");
        setIsProcessing(false);
        return;
      }

      const cleanStudentName = (userDetails?.name || 'Student').replace(/\s+/g, '_');
      const baseFilename = `sadhana_report_${cleanStudentName}_${startDate}_to_${endDate}`;
      const ext = format === 'PDF' ? 'pdf' : (format === 'CSV' ? 'csv' : 'xlsx');
      const mimeType = format === 'PDF'
        ? 'application/pdf'
        : (format === 'CSV' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      // Generate file buffer for Web Share API
      let fileBlob = null;

      if (format === 'EXCEL') {
        await exportBulkReportsToExcel(rows, `${baseFilename}.xlsx`, startDate, endDate);
      } else if (format === 'PDF') {
        await exportBulkReportsToPDF(rows, `${startDate} to ${endDate}`, `${baseFilename}.pdf`, startDate, endDate);
      } else if (format === 'CSV') {
        exportBulkReportsToCSV(rows, `${baseFilename}.csv`, startDate, endDate);
      }

      // Check if Web Share API file sharing is supported on user's device/browser
      const shareText = `Hari Bol! Here is my Sadhana Report for ${startDate} to ${endDate}.`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Sadhana Report - ${userDetails?.name || 'Student'}`,
            text: shareText
          });
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
            window.open(waUrl, '_blank');
          }
        }
      } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, '_blank');
      }

      setIsProcessing(false);
    } catch (err) {
      console.error("Share error:", err);
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0">
        {/* Dark Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isProcessing ? null : onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[98]"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md mx-auto bg-white rounded-t-[32px] sm:rounded-t-[32px] shadow-2xl z-[99] flex flex-col overflow-hidden max-h-[85vh]"
        >
          {/* Top Drag Handle */}
          <div
            className="w-full pt-4 pb-2 flex justify-center sticky top-0 bg-white rounded-t-[32px] z-10 cursor-pointer"
            onClick={isProcessing ? null : onClose}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
          </div>

          <div className="px-6 pb-8 pt-2 max-h-[85vh] overflow-y-auto hide-scrollbar space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[20px] font-extrabold text-[#0f172a] tracking-tight leading-snug">
                    Export Students
                  </h2>
                  <p className="text-[12px] font-medium text-gray-500 leading-tight mt-0.5">
                    Choose file format and date range to export selected student data.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center shrink-0 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Select Date Range Section */}
            <div className="space-y-2">
              <label className="text-[15px] font-extrabold text-[#0f172a] block">
                Select Date Range
              </label>

              {/* Preset Selector Buttons */}
              <div className="flex items-center gap-2">
                {presetOptions.map((opt) => {
                  const isSelected = preset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPreset(opt.id)}
                      disabled={isProcessing}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-[13px] font-bold transition-all ${isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Range Picker */}
              <AnimatePresence>
                {preset === 'CUSTOM' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-2"
                  >
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From Date</label>
                        <input
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          disabled={isProcessing}
                          className="w-full bg-white text-[#0f172a] font-bold text-[13px] rounded-xl p-2.5 outline-none border border-gray-200 focus:border-blue-600 transition-all cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To Date</label>
                        <input
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          disabled={isProcessing}
                          className="w-full bg-white text-[#0f172a] font-bold text-[13px] rounded-xl p-2.5 outline-none border border-gray-200 focus:border-blue-600 transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-[12px] font-medium text-gray-400">
                Select the date range for student records.
              </p>
            </div>

            {/* Choose File Format Section */}
            <div className="space-y-2">
              <label className="text-[15px] font-extrabold text-[#0f172a] block">
                Choose File Format
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Excel Option */}
                <button
                  type="button"
                  onClick={() => setFormat('EXCEL')}
                  disabled={isProcessing}
                  className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 text-left transition-all ${format === 'EXCEL'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-start justify-between w-full mb-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                      X
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${format === 'EXCEL' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                      {format === 'EXCEL' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[14px] text-[#0f172a]">Excel (.xlsx)</h4>
                    <p className="text-[11px] text-gray-400 font-medium leading-tight mt-1">
                      Best for data analysis and further processing.
                    </p>
                  </div>
                </button>

                {/* PDF Option */}
                <button
                  type="button"
                  onClick={() => setFormat('PDF')}
                  disabled={isProcessing}
                  className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 text-left transition-all ${format === 'PDF'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-start justify-between w-full mb-3">
                    <div className="w-11 h-11 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      PDF
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${format === 'PDF' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                      {format === 'PDF' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[14px] text-[#0f172a]">PDF (.pdf)</h4>
                    <p className="text-[11px] text-gray-400 font-medium leading-tight mt-1">
                      Best for printing and sharing.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Status Indicator */}
            {isProcessing && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>{statusMessage || 'Processing report...'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-[15px] rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={isProcessing}
                className="py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[15px] rounded-2xl transition-all active:scale-[0.98] shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="Share Report"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isProcessing}
                className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[15px] rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudentExportModal;
