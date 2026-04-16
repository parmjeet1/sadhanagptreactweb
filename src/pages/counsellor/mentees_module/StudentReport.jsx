import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../../components/counsellor/CounsellorBottomNavigation';
import { getRequest, postRequest } from '../../../services/api';

const InteractiveLineChart = ({ data, dataKey, label, activityColor }) => {
  const [activeIdx, setActiveIdx] = useState(null);
  const chartColor = activityColor || '#1a73e8';
  const width = 100;
  const height = 40;
  if (!data || data.length === 0) return (
    <div className="w-full h-16 flex items-center justify-center text-gray-300 text-[12px] border border-dashed border-gray-200 rounded-xl mt-2">No data</div>
  );
  const values = data.map(d => Number(d[dataKey] || 0));
  const max = Math.max(...values, 1), min = Math.min(...values, 0), range = max - min || 1;
  const step = width / (values.length - 1 || 1);
  const points = values.map((val, i) => ({ x: i * step, y: height - ((val - min) / range) * height }));
  const pathData = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2, cpX2 = prev.x + (p.x - prev.x) / 2;
    return `C ${cpX1} ${prev.y}, ${cpX2} ${p.y}, ${p.x} ${p.y}`;
  }).join(' ');
  const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.round(percent * (points.length - 1));
    setActiveIdx(idx);
  };
  return (
    <div className="relative w-full h-24 mt-4 px-1 group touch-none" onMouseMove={handleMouseMove} onMouseLeave={() => setActiveIdx(null)} onTouchStart={handleMouseMove} onTouchMove={handleMouseMove} onTouchEnd={() => setTimeout(() => setActiveIdx(null), 1500)}>
      <svg viewBox={`-2 -5 ${width + 4} ${height + 10}`} className="w-full h-full" style={{ color: chartColor }} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <defs><linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.2" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
        <path d={areaData} fill={`url(#gradient-${dataKey})`} stroke="none" /><path d={pathData} stroke="currentColor" />
        <AnimatePresence>{points.map((p, i) => ((activeIdx === i || (i === points.length - 1 && activeIdx === null)) && (<g key={i}>
          <motion.line initial={{ opacity: 0 }} animate={{ opacity: activeIdx === i ? 0.3 : 0.1 }} x1={p.x} y1="0" x2={p.x} y2={height} stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
          <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} cx={p.x} cy={p.y} r="3" fill="currentColor" stroke="white" strokeWidth="1.5" />
        </g>)))}</AnimatePresence>
      </svg>
      <AnimatePresence>{activeIdx !== null && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-full mb-3 bg-gray-900 text-white text-[11px] font-bold px-4 py-2 rounded-2xl shadow-2xl whitespace-nowrap z-50 flex flex-col items-center" style={{ left: `${(activeIdx / (values.length - 1 || 1)) * 100}%`, transform: 'translateX(-50%)' }}>
          <span className="text-gray-400 text-[9px] uppercase mb-0.5">{new Date(data[activeIdx].activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span className="text-[13px] font-black">{values[activeIdx]} {label}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900"></div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
};

const formatValue = (val) => {
  if (val === null || val === undefined) return '0';
  const strVal = String(val);
  if (strVal.includes(':')) {
    const [h, m, s] = strVal.split(':').map(n => parseInt(n, 10) || 0);
    return `${(h * 60) + m + (s > 30 ? 1 : 0)}`;
  }
  return parseFloat(val).toFixed(1).replace(/\.0$/, '');
};

const formatDateSnippet = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
};

const StudentReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { userDetails } = useOutletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('7 Days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationHeading, setNotificationHeading] = useState('');
  const [notificationDesc, setNotificationDesc] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  const fetchStudentDetails = useCallback(() => {
    setIsLoading(true);
    let filter = activeTab === 'Month' ? "30days" : activeTab === 'Custom' ? "custom" : "7days";
    getRequest('/student-details', { user_id: userDetails.user_id, student_id: id, filter, start_date: customStartDate, end_date: customEndDate }, (response) => {
      if (response.data?.status === 1) setReportData(response.data.data);
      else showToast(response.data?.message || "Failed to load report");
      setIsLoading(false);
    });
  }, [userDetails.user_id, id, activeTab, customStartDate, customEndDate]);

  useEffect(() => { fetchStudentDetails(); }, [fetchStudentDetails]);

  const handleSendNotification = () => {
    if (!notificationHeading.trim() || !notificationDesc.trim()) return showToast('Please fill all fields');
    setIsSending(true);
    postRequest('/cusotm-notification', { user_id: userDetails.user_id, student_id: id, heading: notificationHeading, description: notificationDesc }, (res) => {
      setIsSending(false);
      if (res.data?.status === 1) { setIsNotificationModalOpen(false); showToast('Sent!'); setNotificationHeading(''); setNotificationDesc(''); }
      else showToast(res.data?.message || "Failed");
    });
  };

  /* AI Analysis — commented out for individual report view
  const handleAiAnalysis = () => {
    const dataForAi = [{ student_id: id, name: reportData?.student?.name || 'Student', date: new Date().toISOString().split('T')[0], activities: reportData?.activities_analytics || [] }];
    navigate('/counsellor/ai-chat', { state: { studentsData: dataForAi } });
  };
  */

  const studentInfo = reportData?.student || location.state?.student || { name: 'Loading...' };

  return (
    <div className="min-h-screen bg-white pb-28">
      <AnimatePresence>{toastMessage && (<motion.div initial={{y:-20}} animate={{y:0}} exit={{y:-20}} className="fixed top-24 left-0 right-0 z-50 flex justify-center"><div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm">{toastMessage}</div></motion.div>)}</AnimatePresence>
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-50">
        <button onClick={() => navigate(-1)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
        <h1 className="font-black text-lg">Mentee Report</h1>
        <div className="w-6" />
      </div>
      <div className="px-6 py-8 max-w-md mx-auto">
        <div className="flex flex-col items-center mb-8">
          <img src={studentInfo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentInfo.name)}&background=random&color=fff&bold=true`} className="w-24 h-24 rounded-full border-4 border-blue-50 mb-4 shadow-md" />
          <h2 className="text-2xl font-black text-center">{studentInfo.name}</h2>
          <p className="text-blue-500 font-bold text-sm mt-1 mb-5">{studentInfo.center_name || 'No Group'} • {studentInfo.label_name || 'No Label'}</p>

          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Label</span>
              <span className="text-[13px] font-black text-gray-800 leading-tight">{studentInfo.label_name || '—'}</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Birthday</span>
              <span className="text-[13px] font-black text-gray-800 leading-tight">{formatDateSnippet(studentInfo.birthday)}</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Joined</span>
              <span className="text-[13px] font-black text-gray-800 leading-tight">{formatDateSnippet(studentInfo.created_at)}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-gray-400 font-bold text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
            <span>{studentInfo.email || 'N/A'}</span>
          </div>
        </div>
        <div className="flex p-1 bg-gray-50 rounded-full mb-8">
           {['7 Days', 'Month', 'Custom'].map(t => <button key={t} onClick={()=>setActiveTab(t)} className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>{t}</button>)}
        </div>
        {activeTab === 'Custom' && (
          <div className="flex gap-4 mb-8">
             <input type="date" value={customStartDate} onChange={e=>setCustomStartDate(e.target.value)} className="flex-1 p-3 bg-gray-50 rounded-xl" />
             <input type="date" value={customEndDate} onChange={e=>setCustomEndDate(e.target.value)} className="flex-1 p-3 bg-gray-50 rounded-xl" />
          </div>
        )}
        {isLoading ? <div className="text-center py-20 font-bold text-gray-400">Loading analysis...</div> : (
          <div className="space-y-10">
            {reportData?.activities_analytics?.map(act => (
              <div key={act.activity_id}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black">{act.name}</span>
                  <span className="text-xs font-bold text-gray-400">{act.label}: {formatValue(act.value)}</span>
                </div>
                <InteractiveLineChart data={act.daily_data} dataKey="count" color={act.color ? `text-[${act.color}]` : 'text-blue-500'} label={act.label} activityColor={act.color} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fixed bottom-[80px] left-0 right-0 px-6 py-4 max-w-md mx-auto bg-white/80 backdrop-blur-md">
        <button onClick={()=>setIsNotificationModalOpen(true)} className="w-full py-4 bg-blue-600 rounded-2xl font-black text-sm text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6.5C21 8.98 18.76 11 16 11s-5-2.02-5-4.5S13.24 2 16 2s5 2.02 5 4.5zM16 3c-2.21 0-4 1.12-4 2.5S13.79 8 16 8s4-1.12 4-2.5S18.21 3 16 3zm-1 13H4a2 2 0 0 1-2-2v-1c0-2.66 5.33-4 8-4 .92 0 2.06.17 3.18.47A7.5 7.5 0 0 0 13 11.1C12.12 10.96 11.08 10.9 10 10.9 7.33 10.9 2 12.13 2 14v1h13v-1c0-.34.04-.67.1-1l.9.1zm-5-5C7.24 11 5 8.98 5 6.5S7.24 2 10 2c1.26 0 2.41.44 3.27 1.15A6.58 6.58 0 0 0 11 6.5c0 1.56.62 2.98 1.63 4.03A5.33 5.33 0 0 1 10 11z"/></svg>
          Send Notification
        </button>
      </div>
       <AnimatePresence>
        {isNotificationModalOpen && (
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} className="fixed inset-0 z-50 flex items-end justify-center">
             <div className="bg-white w-full max-w-md p-8 rounded-t-3xl shadow-2xl">
                <h2 className="text-xl font-black mb-6">Send Notification</h2>
                <input value={notificationHeading} onChange={e=>setNotificationHeading(e.target.value)} placeholder="Title" className="w-full p-4 bg-gray-50 rounded-2xl mb-4" />
                <textarea value={notificationDesc} onChange={e=>setNotificationDesc(e.target.value)} placeholder="Message..." rows={4} className="w-full p-4 bg-gray-50 rounded-2xl mb-6" />
                <button onClick={handleSendNotification} disabled={isSending} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">{isSending ? 'Sending...' : 'Send Now'}</button>
                <button onClick={()=>setIsNotificationModalOpen(false)} className="w-full py-4 text-gray-400 font-bold">Cancel</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CounsellorBottomNavigation />
    </div>
  );
};

export default StudentReport;
