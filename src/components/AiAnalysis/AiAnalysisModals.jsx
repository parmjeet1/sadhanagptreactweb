import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest, postRequest } from '../../services/api';
import { openChatGPTWithPrompt } from '../../utils/chatGptUtils';

const AiAnalysisModals = ({ isOpen, onClose, students = [], userDetails }) => {
  const targetStudents = students.length > 0 ? students : (userDetails ? [{
    id: userDetails?.user_id,
    name: userDetails?.name || 'My',
    avatar: userDetails?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDetails?.name || 'Me')}&background=random`
  }] : []);

  const getInitialDates = (range) => {
    const today = new Date();
    
    // Set "To" date to yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const toDateStr = yesterday.toISOString().split('T')[0];
    
    let fromDateStr = '';
    
    if (range !== 'CUSTOM') {
      const fromDate = new Date(yesterday);
      if (range === 'LAST_2_DAYS') fromDate.setDate(yesterday.getDate() - 1);
      else if (range === 'LAST_7_DAYS') fromDate.setDate(yesterday.getDate() - 6);
      else if (range === 'LAST_15_DAYS') fromDate.setDate(yesterday.getDate() - 14);
      else if (range === 'LAST_30_DAYS') fromDate.setDate(yesterday.getDate() - 29);
      else if (range === 'LAST_90_DAYS') fromDate.setDate(yesterday.getDate() - 89);
      fromDateStr = fromDate.toISOString().split('T')[0];
    }
    
    return { from: fromDateStr, to: range !== 'CUSTOM' ? toDateStr : '' };
  };

  const initialDates = getInitialDates('LAST_2_DAYS');
  const [aiRangeType, setAiRangeType] = useState('LAST_2_DAYS');
  const [aiDateFrom, setAiDateFrom] = useState(initialDates.from);
  const [aiDateTo, setAiDateTo] = useState(initialDates.to);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const [isPreparingChatGPT, setIsPreparingChatGPT] = useState(false);

  const handleChatGPTRedirect = async () => {
    if (aiRangeType === 'CUSTOM' && (!aiDateFrom || !aiDateTo)) return showToast("Select both dates");
    setIsPreparingChatGPT(true);
    showToast("Collecting student data for ChatGPT...");

    const studentIds = targetStudents.map(s => s.id);
    const filterType = aiRangeType === 'CUSTOM' ? 'custom' : aiRangeType;
    const startDate = aiRangeType === 'CUSTOM' ? aiDateFrom : (aiDateFrom || '2000-01-01');
    const endDate = aiRangeType === 'CUSTOM' ? aiDateTo : (aiDateTo || new Date().toISOString().split('T')[0]);

    const payload = {
      filter: filterType,
      start_date: startDate,
      end_date: endDate,
      student_ids: studentIds
    };

    let reportRows = [];
    try {
      const res = await postRequest('/export-bulk-student-reports', payload);
      const data = res?.data;
      if (data?.status === 1 && Array.isArray(data.data) && data.data.length > 0) {
        reportRows = data.data;
      }
    } catch (err) {
      console.warn("Could not fetch bulk report for ChatGPT prompt, using local student state:", err);
    }

    let studentDataText = "";

    if (reportRows.length > 0) {
      const grouped = {};
      reportRows.forEach(row => {
        const key = row.student_name || 'Unknown Student';
        if (!grouped[key]) {
          grouped[key] = {
            mobile: row.mobile || 'N/A',
            center: row.center_name || 'N/A',
            label: row.label_name || 'Uncategorized',
            activities: []
          };
        }
        grouped[key].activities.push({
          date: row.activity_date || '',
          name: row.activity_name || '',
          value: row.activity_value ?? '',
          marks: row.activity_marks ?? ''
        });
      });

      studentDataText = Object.entries(grouped).map(([name, info], idx) => {
        const actLines = info.activities.map(a => `  - Date: ${a.date} | Activity: ${a.name} | Value: ${a.value} | Marks: ${a.marks}`).join('\n');
        return `Student #${idx + 1}: ${name} (Mobile: ${info.mobile}, Group: ${info.center}, Sub-Group: ${info.label})\nActivities Logged:\n${actLines || '  - No activity logs'}`;
      }).join('\n\n');
    } else {
      studentDataText = targetStudents.map((s, idx) => {
        const acts = Array.isArray(s.activities) && s.activities.length > 0
          ? s.activities.map(a => `  - ${a.name || a.activity_name}: ${a.value ?? a.count ?? 0} (Marks: ${a.marks ?? 0})`).join('\n')
          : '  - No activity details available';
        return `Student #${idx + 1}: ${s.name || 'N/A'} (Mobile: ${s.mobile || 'N/A'}, Sub-Group: ${s.label || 'Uncategorized'})\nActivities:\n${acts}`;
      }).join('\n\n');
    }

    const fullPrompt = `Please analyze the following Sadhana (spiritual practice) performance data for my mentee(s) and provide a comprehensive, actionable counseling analysis:

========================================
MENTEE GROUP & PERFORMANCE DATA
========================================
- Time Range: ${aiRangeType.replace(/_/g, ' ')} (${startDate} to ${endDate})
- Total Mentees: ${targetStudents.length}

MENTEE DETAILS & ACTIVITY LOGS:
${studentDataText}

========================================
ANALYSIS & COUNSELING REQUEST
========================================
Please provide:
1. OVERALL SUMMARY: Executive summary of student Sadhana consistency and performance.
2. STRENGTHS & HIGHLIGHTS: Key areas where students are performing well.
3. LAGGINGS & CONCERNS: Critical gaps (e.g. missed japa rounds, irregular wake-up times, low reading/chanting marks).
4. COUNSELOR RECOMMENDATIONS: Specific, empathetic counseling advice and strategies for the counselor to motivate and guide these mentees effectively.`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullPrompt);
      }
    } catch (clipErr) {
      console.warn("Could not copy to clipboard:", clipErr);
    }

    setIsPreparingChatGPT(false);
    showToast("Prompt copied & redirecting to ChatGPT!");
    await openChatGPTWithPrompt(fullPrompt);
    onClose();
  };

  const handleAiRangeChange = (range) => {
    setAiRangeType(range);
    const dates = getInitialDates(range);
    setAiDateFrom(dates.from);
    setAiDateTo(dates.to);
  };

  const handleAiAnalysis = () => {
    if (aiRangeType === 'CUSTOM' && (!aiDateFrom || !aiDateTo)) return showToast("Select both dates");
    setIsGeneratingAI(true);
    setPreviewData(null);
    setIsPreviewModalOpen(true);
    onClose(); // Close the Setup modal

    postRequest('/ai/student-analysis', {
      user_id: userDetails?.user_id,
      student_ids: targetStudents.map(s => s.id),
      rangeType: aiRangeType,
      dateFrom: aiDateFrom,
      dateTo: aiDateTo
    }, (response) => {
      setIsGeneratingAI(false);
      if (response?.data?.status === 1) {
        setPreviewData(response.data.data);
      } else {
        showToast(response?.data?.message || 'Failed to generate analysis');
      }
    });
  };

  const fetchAiHistory = () => {
    if (targetStudents.length !== 1) return;
    setIsHistoryModalOpen(true);
    setIsFetchingHistory(true);
    onClose(); // Close Setup modal

    getRequest(`/ai/student-analysis/history/${targetStudents[0].id}`, { user_id: userDetails?.user_id }, (response) => {
      setIsFetchingHistory(false);
      if (response?.data?.status === 1) {
        setHistoryList(response.data.data || []);
      } else {
        showToast(response?.data?.message || 'Failed to fetch history');
        setHistoryList([]);
      }
    });
  };

  const fetchSingleAiReport = (reportId) => {
    setIsHistoryModalOpen(false);
    setIsGeneratingAI(true);
    setPreviewData(null);
    setIsPreviewModalOpen(true);
    
    getRequest(`/ai/student-analysis/report/${reportId}`, { user_id: userDetails?.user_id }, (response) => {
      setIsGeneratingAI(false);
      if (response?.data?.status === 1) {
        setPreviewData(response.data.data);
      } else {
        showToast(response?.data?.message || 'Failed to fetch report');
      }
    });
  };

  return (
    <>
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-10 left-1/2 -translate-x-1/2 z-[100]">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm shadow-xl font-bold">
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <h2 className="text-2xl font-black mb-2 text-[#0f172a] dark:text-[#F8FAFC]">AI Analysis Setup</h2>
              <p className="text-gray-400 dark:text-[#94A3B8] font-bold mb-6">Analyzing {targetStudents.length} students</p>

              <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
                {targetStudents.map(s => (
                  <div key={s.id} className="flex flex-col items-center min-w-[60px]">
                    <img src={s.avatar} className="w-10 h-10 rounded-full border border-gray-300 dark:border-[#334155]" />
                    <span className="text-[10px] font-bold mt-1 text-gray-400 dark:text-[#94A3B8] truncate w-full text-center">{s.name?.split(' ')[0]}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { label: '2 Days', value: 'LAST_2_DAYS' },
                  { label: '7 Days', value: 'LAST_7_DAYS' },
                  { label: '15 Days', value: 'LAST_15_DAYS' },
                  { label: '30 Days', value: 'LAST_30_DAYS' },
                  { label: '90 Days', value: 'LAST_90_DAYS' },
                  { label: 'Custom', value: 'CUSTOM' }
                ].map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => handleAiRangeChange(preset.value)}
                    className={`px-4 py-2 rounded-full font-bold text-[12px] transition-colors duration-300 ${aiRangeType === preset.value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-[#1E293B] text-gray-500 dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-[#334155]'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div><label className="text-[10px] font-black uppercase text-gray-400 dark:text-[#64748b] mb-2 block tracking-widest">Date From</label><input type="date" value={aiDateFrom} disabled={aiRangeType !== 'CUSTOM'} onChange={e => setAiDateFrom(e.target.value)} className={`w-full p-4 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none [color-scheme:light] dark:[color-scheme:dark] transition-opacity ${aiRangeType !== 'CUSTOM' ? 'opacity-50 cursor-not-allowed' : ''}`} /></div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 dark:text-[#64748b] mb-2 block tracking-widest">Date To</label><input type="date" value={aiDateTo} disabled={aiRangeType !== 'CUSTOM'} onChange={e => setAiDateTo(e.target.value)} className={`w-full p-4 bg-gray-50 dark:bg-[#1E293B] text-[#0f172a] dark:text-[#F8FAFC] rounded-2xl font-bold border-none outline-none [color-scheme:light] dark:[color-scheme:dark] transition-opacity ${aiRangeType !== 'CUSTOM' ? 'opacity-50 cursor-not-allowed' : ''}`} /></div>
                <div className="space-y-3">
                  <button onClick={handleChatGPTRedirect} disabled={isPreparingChatGPT} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2.5 transition-all disabled:opacity-50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    {isPreparingChatGPT ? 'Collecting Data...' : 'Analyze with ChatGPT'}
                  </button>
                  {/* <button onClick={handleAiAnalysis} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg transition-all">Generate In-App AI Insights</button> */}
                  {targetStudents.length === 1 && (
                    <button onClick={fetchAiHistory} className="w-full bg-gray-100 dark:bg-[#1E293B] text-gray-500 dark:text-[#94A3B8] py-4 rounded-2xl font-black shadow-sm hover:bg-gray-200 dark:hover:bg-[#334155] transition-colors">View AI History</button>
                  )}
                </div>
                <button onClick={onClose} className="w-full py-4 text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] font-bold transition-colors">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isPreviewModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-[2rem] transition-colors duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl p-6 sm:p-8">
              <div className="flex justify-between items-center mb-8 border-b border-gray-300 dark:border-gray-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-[#0f172a] dark:text-[#F8FAFC]">AI Student Analysis</h2>
                  <p className="text-sm font-bold text-gray-400 mt-1">Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setIsPreviewModalOpen(false)} className="text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] p-2 bg-gray-50 dark:bg-[#1E293B] rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {isGeneratingAI ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="font-bold text-gray-500 dark:text-gray-400 animate-pulse">Generating AI Analysis...</p>
                </div>
              ) : (previewData && previewData.kpis && previewData.aiAnalysis) ? (
                <div className="space-y-8">
                  {/* Overall Status */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Overall Status</h3>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {previewData.aiAnalysis.overallStatus || "Analysis Unavailable."}
                    </div>
                  </div>

                  {/* Strengths */}
                  {previewData.aiAnalysis.strengths?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Strengths</h3>
                      <div className="space-y-3">
                        {previewData.aiAnalysis.strengths.map((str, i) => (
                          <div key={i} className="flex gap-3 text-sm text-gray-800 dark:text-gray-200">
                            <span className="text-green-500 font-bold shrink-0">✓</span>
                            <p>{str}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Laggings */}
                  {previewData.aiAnalysis.laggings?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Laggings</h3>
                      <div className="space-y-3">
                        {previewData.aiAnalysis.laggings.map((lag, i) => (
                          <div key={i} className="flex gap-3 text-sm text-gray-800 dark:text-gray-200">
                            <span className="text-orange-500 font-bold shrink-0">⚠</span>
                            <p>{lag}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {previewData.aiAnalysis.recommendations?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Recommendations</h3>
                      <div className="space-y-3">
                        {previewData.aiAnalysis.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-3 text-sm text-gray-800 dark:text-gray-200">
                            <span className="text-yellow-500 font-bold shrink-0">💡</span>
                            <p>{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="text-red-500 font-bold">Failed to load analysis.</div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {isHistoryModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-t-[48px] transition-colors duration-300 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[#0f172a] dark:text-[#F8FAFC]">AI History</h2>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 dark:text-[#94A3B8] hover:text-[#0f172a] dark:hover:text-[#F8FAFC] p-2 bg-gray-50 dark:bg-[#1E293B] rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              {isFetchingHistory ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div></div>
              ) : historyList.length > 0 ? (
                <div className="space-y-3">
                  {historyList.map(h => (
                    <button key={h.id} onClick={() => fetchSingleAiReport(h.id)} className="w-full p-4 bg-gray-50 dark:bg-[#1E293B] rounded-2xl text-left hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-[#0f172a] dark:text-[#F8FAFC] text-sm">{h.range_type?.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] font-bold text-gray-400 bg-white dark:bg-[#0F172A] px-2 py-1 rounded-full">{new Date(h.created_at).toLocaleDateString('en-GB')}</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-[#94A3B8] line-clamp-1">{h.overall_status || 'Analysis Report'}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🤖</div>
                  <h3 className="font-bold text-[#0f172a] dark:text-[#F8FAFC] mb-1">No AI History</h3>
                  <p className="text-xs text-gray-400">Generate an insight to see it here.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiAnalysisModals;
