import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AiDateFilterModal from '../AiAnalysis/AiDateFilterModal';
import { postRequest } from '../../services/api';
import { sendCounsellorNotification, whatsappLine } from '../../services/counsellorNotify';
import { exportBulkReportsToExcel, exportBulkReportsToPDF } from '../../utils/exportUtils';

// Bottom bar + windows for working on SEVERAL mentees at once from a list screen (used by Bird's Eye View).
// It does the same three things as the Mentees / Group Management windows, with the same server calls:
//   AI Analysis -> asks for the date range first (AiDateFilterModal, strategy BULK_MENTEES)
//   Notify      -> send ONE custom message to every selected mentee, like "Send Notification" in a single mentee's
//                  window (POST /cusotm-notification with student_ids: one call for all, plus WhatsApp)
//   Export      -> choose 7 days / 30 days / custom + Excel or PDF (POST /export-bulk-student-reports)
//
// props: selected = [{ id, name }], userId, onClear()

const dayString = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dayString(d); };

const DURATIONS = [
  { id: '7', label: '7 Days' },
  { id: '30', label: '30 Days' },
  { id: 'custom', label: 'Custom' },
];


const BulkMenteeActions = ({ selected, userId, onClear }) => {
  const [aiOpen, setAiOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [duration, setDuration] = useState('7');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [format, setFormat] = useState('EXCEL');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null); // { type: 'ok' | 'error', text }

  const ids = selected.map((s) => s.id);
  const say = (type, text) => { setNote({ type, text }); setTimeout(() => setNote(null), 4000); };

  const sendNotification = async () => {
    const text = message.trim();
    if (!text) return say('error', 'Please enter a message...');
    if (busy) return;
    setBusy(true);
    let result;
    try {
      // One call for all selected mentees: in-app notification + WhatsApp for each.
      result = await sendCounsellorNotification({ userId, studentIds: ids, text });
    } finally {
      setBusy(false);
    }
    if (result.ok) {
      const head = ids.length === 1 ? 'Notification Sent!' : `Notification sent to ${result.sent || ids.length} students!`;
      say('ok', [head, whatsappLine(result, ids.length)].filter(Boolean).join(' '));
      setNotifyOpen(false);
      setMessage('');
      onClear?.();
    } else {
      say('error', result.message || 'Failed to send notification');
    }
  };

  const runExport = async () => {
    let start = fromDate;
    let end = toDate;
    const today = dayString(new Date());
    if (duration === '7') { start = daysAgo(7); end = today; }
    else if (duration === '30') { start = daysAgo(30); end = today; }
    else if (!fromDate || !toDate) return say('error', 'Please select both start and end dates');
    else if (fromDate > toDate) return say('error', 'Start date cannot be after end date');

    const label = duration === 'custom' ? `${start}_to_${end}` : `${duration}_days`;
    setBusy(true);
    say('ok', 'Preparing export file...');
    try {
      const res = await postRequest('/export-bulk-student-reports', {
        user_id: userId, // keeps results to this counsellor's own mentees
        filter: duration === 'custom' ? 'custom' : duration,
        start_date: start,
        end_date: end,
        student_ids: ids,
      });
      const data = res?.data;
      if (!(data?.status === 1 && Array.isArray(data.data))) {
        say('error', data?.message?.[0] || data?.message || 'Export failed: Unable to fetch report data.');
        return;
      }
      if (data.data.length === 0) { say('error', 'No data available to export for the selected mentees.'); return; }
      const filename = `students_export_${label}_${Date.now()}`;
      if (format === 'EXCEL') await exportBulkReportsToExcel(data.data, `${filename}.xlsx`, start, end);
      else await exportBulkReportsToPDF(data.data, label, `${filename}.pdf`, start, end);
      say('ok', 'Export file generated successfully!');
      setExportOpen(false);
    } catch (err) {
      console.error('Bulk export failed:', err);
      say('error', 'Export failed: Unable to fetch data from server.');
    } finally {
      setBusy(false);
    }
  };

  const sheet = (onClose, children) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-6 pb-8 rounded-t-[32px] max-h-[90vh] overflow-y-auto">
        {children}
      </motion.div>
    </motion.div>
  );

  const barBtn = 'touch-auto bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl py-3.5 px-2 font-extrabold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all';

  return (
    <>
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-[84px] left-0 right-0 max-w-md mx-auto z-40 px-4"
          >
            <div className="bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e1b4b] rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/15 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500" />
              <div className="px-5 pb-5 pt-5">
                <div className="flex justify-between items-center mb-3 text-white px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-black text-[15px] tracking-tight">Selected: {selected.length} {selected.length === 1 ? 'Student' : 'Students'}</span>
                  </div>
                  <button onClick={onClear} title="Deselect All" aria-label="Deselect all" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center active:scale-90">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <button onClick={() => setAiOpen(true)} className="touch-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/40 rounded-2xl py-3.5 px-2 font-extrabold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-lg shadow-purple-900/40">
                    <svg className="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>AI Analysis</span>
                  </button>
                  <button onClick={() => setNotifyOpen(true)} className={barBtn}>
                    <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    <span>Notify on WhatsApp</span>
                  </button>
                  <button onClick={() => setExportOpen(true)} className={barBtn}>
                    <svg className="w-4 h-4 text-sky-300" fill="currentColor" viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {note && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[90] px-4 py-3 rounded-2xl text-[13px] font-bold shadow-xl max-w-[90vw] ${note.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#1e293b] text-white'}`}>
          {note.text}
        </div>
      )}

      <AnimatePresence>
        {notifyOpen && sheet(() => setNotifyOpen(false), (
          <>
            <h2 className="text-xl font-black mb-1 text-[#0f172a] dark:text-[#F8FAFC]">Send Notification</h2>
            <p className="text-gray-400 dark:text-[#94A3B8] font-bold text-[13px] mb-4">
              To {selected.length} selected {selected.length === 1 ? 'student' : 'students'}
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message..."
              rows={4}
              className="w-full p-4 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-xl mb-5 outline-none border border-transparent focus:border-blue-100"
            />
            <button disabled={busy} onClick={sendNotification} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-600/20 disabled:opacity-60">{busy ? 'Sending...' : 'Send Now'}</button>
            <button disabled={busy} onClick={() => setNotifyOpen(false)} className="w-full py-4 text-gray-400 font-bold">Cancel</button>
          </>
        ))}

        {exportOpen && sheet(() => setExportOpen(false), (
          <div className="space-y-6">
            <div>
              <h2 className="text-[20px] font-extrabold text-[#0f172a] dark:text-white">Export Students</h2>
              <p className="text-[12px] font-medium text-gray-500 dark:text-slate-400 mt-0.5">Choose file format and date range to export {selected.length} selected student{selected.length === 1 ? '' : 's'}.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[15px] font-extrabold text-[#0f172a] dark:text-white block">Select Date Range</label>
              <div className="flex items-center gap-2">
                {DURATIONS.map((o) => (
                  <button key={o.id} type="button" onClick={() => setDuration(o.id)} className={`flex-1 py-2.5 px-3 rounded-xl text-[13px] font-bold transition-all ${duration === o.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300'}`}>{o.label}</button>
                ))}
              </div>
              {duration === 'custom' && (
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From Date</label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white font-bold text-[13px] rounded-xl p-2.5 outline-none border border-gray-200 dark:border-slate-700 dark:[color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To Date</label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white font-bold text-[13px] rounded-xl p-2.5 outline-none border border-gray-200 dark:border-slate-700 dark:[color-scheme:dark]" />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[15px] font-extrabold text-[#0f172a] dark:text-white block">Choose File Format</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ id: 'EXCEL', title: 'Excel (.xlsx)', mark: 'X', color: 'bg-emerald-600', help: 'Best for data analysis.' }, { id: 'PDF', title: 'PDF (.pdf)', mark: 'PDF', color: 'bg-rose-600', help: 'Best for printing and sharing.' }].map((f) => (
                  <button key={f.id} type="button" onClick={() => setFormat(f.id)} className={`flex flex-col p-4 rounded-2xl border-2 text-left transition-all ${format === f.id ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                    <div className={`w-11 h-11 rounded-xl ${f.color} text-white font-black text-xs flex items-center justify-center mb-3`}>{f.mark}</div>
                    <h4 className="font-extrabold text-[14px] text-[#0f172a] dark:text-white">{f.title}</h4>
                    <p className="text-[11px] text-gray-400 font-medium leading-tight mt-1">{f.help}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={() => setExportOpen(false)} className="flex-1 py-3.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-extrabold text-[15px] rounded-2xl active:scale-[0.98]">Cancel</button>
              <button type="button" disabled={busy} onClick={runExport} className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[15px] rounded-2xl active:scale-[0.98] shadow-lg shadow-blue-500/25 disabled:opacity-60">{busy ? 'Exporting...' : 'Export'}</button>
            </div>
          </div>
        ))}
      </AnimatePresence>

      <AiDateFilterModal
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        title="AI Mentee Analysis"
        subtitle={`Analyzing ${selected.length} selected mentees`}
        strategy="BULK_MENTEES"
        entityParams={{
          studentIds: ids,
          fallbackStudents: selected,
          userId,
        }}
      />
    </>
  );
};

export default BulkMenteeActions;
