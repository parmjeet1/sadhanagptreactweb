import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postRequest, getRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';
import { exportBulkReportsToExcel, exportBulkReportsToPDF } from '../../utils/exportUtils';

const ReportSettingsModal = ({ isOpen, onClose, userDetails, showToast }) => {
  const [autoReportStatus, setAutoReportStatus] = useState(1);
  const [reportFrequencyDays, setReportFrequencyDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  // New States for Activity Reminders
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);

  // Export Students Panel States
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedSubgroup, setSelectedSubgroup] = useState('all');
  const [datePreset, setDatePreset] = useState('LAST_30_DAYS');
  const [exportFormat, setExportFormat] = useState('EXCEL');
  const [isExporting, setIsExporting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Fetch groups on modal open
  useEffect(() => {
    if (isOpen && userDetails?.user_id) {
      getRequest('/group-list', { user_id: userDetails.user_id }, (res) => {
        const data = res?.data?.data || res?.data;
        if (Array.isArray(data)) {
          setGroups(data);
        }
      });
    }
  }, [isOpen, userDetails]);

  // Fetch subgroups when selectedGroup changes
  useEffect(() => {
    if (isOpen && userDetails?.user_id && selectedGroup && selectedGroup !== 'all') {
      getRequest('/lable-list', { user_id: userDetails.user_id, center_id: selectedGroup }, (res) => {
        const data = res?.data?.data || res?.data;
        if (Array.isArray(data)) {
          setSubgroups(data.map(l => ({ id: l.label_id || l.id, name: l.label_name || l.name })));
        } else {
          setSubgroups([]);
        }
      });
    } else {
      setSubgroups([]);
      setSelectedSubgroup('all');
    }
  }, [isOpen, userDetails, selectedGroup]);

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    setEndDate(todayFormatted);

    if (preset === 'TODAY') {
      setStartDate(todayFormatted);
    } else if (preset === 'LAST_7_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'LAST_30_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      setStartDate(d.toISOString().split('T')[0]);
    }
  };

  const handleExportStudents = async () => {
    if (!userDetails?.user_id) {
      if (showToast) showToast("User details not loaded.", "error");
      return;
    }
    setIsExporting(true);
    try {
      const payload = {
        user_id: userDetails.user_id,
        center_id: selectedGroup === 'all' ? "" : selectedGroup,
        label_id: selectedSubgroup === 'all' ? "" : selectedSubgroup,
        filter: datePreset === 'CUSTOM' ? 'custom' : (datePreset === 'LAST_7_DAYS' ? '7days' : (datePreset === 'TODAY' ? 'today' : '30days')),
        start_date: startDate,
        end_date: endDate
      };

      const res = await postRequest('/export-bulk-student-reports', payload);
      const data = res?.data;
      if (data?.status === 1 && Array.isArray(data.data) && data.data.length > 0) {
        const exportData = data.data;
        const durationLabel = `${startDate} to ${endDate}`;
        const groupLabel = selectedGroup === 'all' ? 'all_groups' : 'group';
        const filename = `students_export_${groupLabel}_${startDate}_to_${endDate}`;

        if (exportFormat === 'EXCEL') {
          await exportBulkReportsToExcel(exportData, `${filename}.xlsx`, startDate, endDate);
        } else {
          await exportBulkReportsToPDF(exportData, durationLabel, `${filename}.pdf`, startDate, endDate);
        }
        if (showToast) showToast("Report exported successfully!", "success");
      } else {
        const errMsg = data?.message?.[0] || data?.message || "No data available to export for selected filters.";
        if (showToast) showToast(errMsg, "error");
      }
    } catch (err) {
      console.error("Export error:", err);
      if (showToast) showToast("Export failed: Unable to generate report", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch the latest parameters from the Profile API whenever the Gear Icon is clicked
  useEffect(() => {
    if (isOpen && userDetails?.user_id) {
      getRequest('/counslor-user-profile', { user_id: userDetails.user_id }, (response) => {
        const res = response?.data;
        if (res?.code === 200 || res?.status === 1 || res?.success) {
          const profile = res.data?.user || {};
          setAutoReportStatus(profile.auto_report_status === 1);
          setReportFrequencyDays(profile.report_frequency_days || 7);
          setReminderEnabled(
            profile.reminder_enabled === 1 || profile.reminder_enabled === true ||
            profile.reminder_status === 1 || profile.reminder_status === true
          );
          setReminderDays(profile.reminder_days || 3);
        }
      });
    }
  }, [isOpen, userDetails]);

  // Push Notification Subscription Check
  useEffect(() => {
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsPushEnabled(true); // hide if not supported
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const browserSubscription = registration ? await registration.pushManager.getSubscription() : null;

        if (userDetails?.user_id) {
          getRequest('/check-push-status', { user_id: userDetails.user_id }, async (response) => {
            const backendHasSub = response.data?.isSubscribed;

            if (browserSubscription && !backendHasSub) {
              await browserSubscription.unsubscribe();
              setIsPushEnabled(false);
            } else if (browserSubscription && backendHasSub) {
              setIsPushEnabled(true);
            } else {
              setIsPushEnabled(false);
            }
          });
        } else {
          setIsPushEnabled(!!browserSubscription);
        }
      } catch (e) {
        setIsPushEnabled(false);
      }
    };

    if (userDetails?.user_id && isOpen) {
      checkSubscription();
    }
  }, [userDetails?.user_id, isOpen]);

  const handleToggleActivityReminders = async () => {
    const turningOn = !reminderEnabled;
    if (turningOn) {
      setReminderEnabled(true);
      postRequest('/update-reminder-preferences', {
        user_id: userDetails.user_id,
        reminder_enabled: true,
        reminder_days: reminderDays || 3
      }, (res) => {
        if (res.data?.status !== 1 && !res.data?.success && res.data?.code !== 200) {
          showToast('Failed to update reminder settings.', 'error');
          setReminderEnabled(false);
        }
      });
    } else {
      setReminderEnabled(false);
      postRequest('/update-reminder-preferences', {
        user_id: userDetails.user_id,
        reminder_enabled: false,
        reminder_days: reminderDays || 3
      }, (res) => {
        if (res.data?.status !== 1 && !res.data?.success && res.data?.code !== 200) {
          showToast('Failed to update reminder settings.', 'error');
          setReminderEnabled(true); // Revert on failure
        }
      });
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showToast('Push notifications are not supported by your browser.', 'error');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Permission for notifications was denied', 'error');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!publicVapidKey) {
        showToast('VAPID Public Key is missing in .env', 'error');
        return;
      }

      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      // Send to backend
      postRequest('/notifications-subscribe', {
        user_id: userDetails.user_id,
        subscription: subscription
      }, (response) => {
        const { message, type } = processResponse(response.data);
        if (type === 'success' || response.data?.status === 1) {
          showToast('Push notifications enabled!', 'success');
          setIsPushEnabled(true);
          setReminderEnabled(true); // Sync the toggle visually
        } else {
          showToast(message || 'Failed to save subscription.', 'error');
        }
      });

    } catch (error) {
      console.error(error);
      showToast('Error enabling push notifications', 'error');
    }
  };

  const handleSave = () => {
    setIsSubmitting(true);

    const emailPayload = {
      user_id: userDetails.user_id,
      auto_report_status: autoReportStatus ? 1 : 0,
      report_frequency_days: Number(reportFrequencyDays)
    };

    const reminderPayload = {
      user_id: userDetails.user_id,
      reminder_enabled: reminderEnabled ? 1 : 0,
      reminder_days: reminderDays
    };

    Promise.all([
      new Promise(resolve => postRequest('/toggle-email-report', emailPayload, resolve)),
      new Promise(resolve => postRequest('/update-reminder-preferences', reminderPayload, resolve))
    ]).then(([emailRes, reminderRes]) => {
      setIsSubmitting(false);
      showToast("Settings updated successfully!", "success");
      onClose();
    }).catch(() => {
      setIsSubmitting(false);
      showToast("Failed to update settings.", "error");
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[2px]"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 w-full max-w-md mx-auto bg-white rounded-t-[32px] shadow-2xl z-[90] flex flex-col"
          style={{
            left: 'auto',
            right: 'max(0px, calc(50% - 224px))'
          }}
        >
          {/* Drag Handle Area */}
          <div className="w-full pt-4 pb-2 flex justify-center sticky top-0 bg-white rounded-t-[32px] z-10">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
          </div>
          
          <div className="absolute top-4 right-4 z-20">
            <button onClick={onClose} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 active:scale-95 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="px-6 pb-8 pt-2 max-h-[85vh] overflow-y-auto hide-scrollbar space-y-6">
            <h2 className="text-[24px] font-extrabold text-[#0f172a]">Report Settings</h2>

            {/* Export Students Panel */}
            <div className="bg-gradient-to-b from-blue-50/60 to-slate-50/60 border border-blue-100 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#0f172a] leading-snug">Export Students</h3>
                  <p className="text-[12px] text-gray-500 font-medium">Select group, date range and file format to export student data.</p>
                </div>
              </div>

              {/* Date Range Selector */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Date Range</label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handlePresetChange('TODAY')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${datePreset === 'TODAY' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange('LAST_7_DAYS')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${datePreset === 'LAST_7_DAYS' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange('LAST_30_DAYS')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${datePreset === 'LAST_30_DAYS' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange('CUSTOM')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${datePreset === 'CUSTOM' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {datePreset === 'CUSTOM' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-1"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex flex-col focus-within:border-blue-500">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">From</span>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-[13px] font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer"
                          />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex flex-col focus-within:border-blue-500">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">To</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-[13px] font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Group Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Group</label>
                <div className="relative bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2.5 focus-within:border-blue-500">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full text-[13px] font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer pr-4"
                  >
                    <option value="all">All Groups</option>
                    {groups.map((g) => (
                      <option key={g.id || g.center_id} value={g.id || g.center_id}>
                        {g.name || g.group_name || `Group ${g.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subgroup Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Subgroup</label>
                <div className="relative bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2.5 focus-within:border-blue-500">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <select
                    value={selectedSubgroup}
                    onChange={(e) => setSelectedSubgroup(e.target.value)}
                    disabled={selectedGroup === 'all' || subgroups.length === 0}
                    className="w-full text-[13px] font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer pr-4 disabled:opacity-50"
                  >
                    <option value="all">All Subgroups</option>
                    {subgroups.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Format Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">File Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('EXCEL')}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${exportFormat === 'EXCEL' ? 'bg-blue-50/80 border-blue-600 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-emerald-700 font-black text-[12px]">X</span>
                      </div>
                      <span className="text-[13px] font-bold text-[#0f172a]">Excel (.xlsx)</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${exportFormat === 'EXCEL' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                      {exportFormat === 'EXCEL' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('PDF')}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${exportFormat === 'PDF' ? 'bg-blue-50/80 border-blue-600 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                        <span className="text-rose-600 font-black text-[12px]">PDF</span>
                      </div>
                      <span className="text-[13px] font-bold text-[#0f172a]">PDF (.pdf)</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${exportFormat === 'PDF' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                      {exportFormat === 'PDF' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportStudents}
                disabled={isExporting}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[14px] rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating Export...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download {exportFormat === 'EXCEL' ? 'Excel' : 'PDF'} Report</span>
                  </>
                )}
              </button>
            </div>

            <div className="h-px w-full bg-gray-100 my-2"></div>

            {/* Push Notifications Enable Banner */}
            {!isPushEnabled && (
              <div className="bg-gradient-to-r from-[#1a73e8] to-[#2563eb] rounded-2xl p-4 shadow-md text-white mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[15px] mb-0.5">Enable Reminders</h3>
                    <p className="text-blue-100 text-[12px] leading-tight">Get push notifications for mentee updates.</p>
                  </div>
                  <button
                    onClick={handleEnablePushNotifications}
                    className="bg-white text-[#1a73e8] font-bold px-4 py-2 rounded-xl text-[12px] shadow-sm active:scale-95 transition-all whitespace-nowrap"
                  >
                    Allow
                  </button>
                </div>
              </div>
            )}

            {/* Activity Reminders Area */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[#0f172a] font-bold">Activity Reminders</h3>
                  <p className="text-sm text-gray-500">Get notified if you miss Sadhana</p>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${reminderEnabled ? 'bg-[#f97316]' : 'bg-gray-200'}`}
                  onClick={handleToggleActivityReminders}
                >
                  <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${reminderEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Reminder Days Selector Area */}
              <AnimatePresence>
                {reminderEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-[#0f172a] font-bold text-[13px]">Remind me after missing</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[#f8fafc] rounded-xl border-2 border-transparent focus-within:border-[#f97316]/20 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => reminderDays > 1 && setReminderDays(reminderDays - 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#f97316] hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={reminderDays}
                            onChange={(e) => setReminderDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-10 text-center font-bold text-[#0f172a] text-sm bg-transparent outline-none focus:ring-0 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => reminderDays < 30 && setReminderDays(reminderDays + 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#f97316] hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                        <span className="text-[13px] font-bold text-gray-400">days</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="h-px w-full bg-gray-100 my-4"></div>
            </div>

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

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 pb-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4 text-[15px] font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-[#1a73e8] hover:bg-[#155fc3] text-white text-[15px] font-bold rounded-full transition-all active:scale-[0.98] shadow-lg shadow-[#1a73e8]/30 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportSettingsModal;
