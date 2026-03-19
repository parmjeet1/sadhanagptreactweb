import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';

// Helper to generate 30 days of dummy timeseries data
const generateTimeseriesData = () => {
  const data = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      chanting: Math.floor(Math.random() * 8) + 8, // 8-16 rounds
      reading: Math.floor(Math.random() * 40) + 20, // 20-60 mins
      hearing: Math.floor(Math.random() * 30) + 30, // 30-60 mins
      wakeupTimeHour: Math.floor(Math.random() * 2) + 4, // 4-5 AM
      wakeupTimeMinute: Math.floor(Math.random() * 60)
    });
  }
  return data;
};

const dummyTimeseriesData = generateTimeseriesData();

// Interactive SVG Line Chart
const InteractiveLineChart = ({ data, dataKey, color, label }) => {
  const [activeIdx, setActiveIdx] = useState(null);
  const width = 100;
  const height = 40;
  
  if (!data || data.length === 0) return null;
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);
  
  const pathData = values.map((val, i) => {
    const x = i * step;
    const y = height - ((val - min) / range) * height;
    if (i === 0) return `M ${x} ${y}`;
    const prevX = (i - 1) * step;
    const prevY = height - ((values[i - 1] - min) / range) * height;
    const cpX1 = prevX + (x - prevX) / 2;
    const cpX2 = prevX + (x - prevX) / 2;
    return `C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
  }).join(' ');

  return (
    <div className="relative w-full h-16 flex items-end mt-2">
      <svg viewBox={`-2 -2 ${width + 4} ${height + 4}`} className={`w-full h-full preserve-aspect-ratio-none overflow-visible ${color}`} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Box */}
        <rect x="0" y="0" width={width} height={height} stroke="currentColor" />
        
        {/* Vertical Grid Lines */}
        {values.map((val, i) => {
          if (i === 0 || i === values.length - 1) return null;
          const x = i * step;
          return <line key={`gl-${i}`} x1={x} y1="0" x2={x} y2={height} stroke="currentColor" />;
        })}

        {/* Data Path */}
        <path d={pathData} stroke="currentColor" />

        {/* Start Dot */}
        {values.length > 0 && (
          <circle cx="0" cy={height - ((values[0] - min) / range) * height} r="2" fill="currentColor" stroke="none" />
        )}

        {/* Interaction Hit Areas */}
        {values.map((val, i) => {
          const x = i * step;
          const y = height - ((val - min) / range) * height;
          return (
            <g key={`hit-${i}`} onMouseEnter={() => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(null)} onClick={() => setActiveIdx(i)} onTouchStart={() => setActiveIdx(i)}>
              <rect x={x - step/2} y={-5} width={step} height={height + 10} fill="transparent" className="cursor-pointer" style={{ pointerEvents: 'all' }} stroke="none" />
              <AnimatePresence>
                {activeIdx === i && (
                  <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} cx={x} cy={y} r="3.5" fill="currentColor" stroke="white" strokeWidth="1.5" />
                )}
              </AnimatePresence>
            </g>
          );
        })}
      </svg>
      {/* Tooltip */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full mb-1 bg-gray-900 text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap pointer-events-none z-10 flex flex-col items-center"
            style={{ left: `${(activeIdx / (values.length - 1 || 1)) * 100}%`, transform: 'translateX(-50%)' }}
          >
            <span className="text-gray-300 font-medium text-[10px] uppercase tracking-wider mb-0.5">{new Date(data[activeIdx].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{values[activeIdx]} {label}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const formatTime = (hour, minute) => {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${hour}:${pad(minute)} AM`;
};

const CounsellorStudentReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const studentData = location.state?.student || {
    id: id,
    name: 'Keshav Shukla',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    group: 'DIT',
    label: 'A-Batch',
  };

  const [activeTab, setActiveTab] = useState('7 Days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationHeading, setNotificationHeading] = useState('');
  const [notificationDesc, setNotificationDesc] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSendNotification = () => {
    if (!notificationHeading.trim() || !notificationDesc.trim()) {
      showToast('Please fill in both fields');
      return;
    }
    // Logic to send notification
    setIsNotificationModalOpen(false);
    showToast('Notification sent successfully!');
    setNotificationHeading('');
    setNotificationDesc('');
  };

  const handleAiAnalysis = () => {
    const today = new Date().toISOString().split('T')[0];
    const dataForAi = [{
      student_id: studentData.id,
      name: studentData.name,
      date: today,
      activities: [] // could pass the summary here
    }];
    navigate('/counsellor/ai-chat', { state: { studentsData: dataForAi } });
  };

  // Filter Data
  const filteredData = useMemo(() => {
    let data = dummyTimeseriesData;
    if (activeTab === '7 Days') {
      data = dummyTimeseriesData.slice(-7);
    } else if (activeTab === 'Month') {
      data = dummyTimeseriesData; // Already 30 days
    } else if (activeTab === 'Custom' && customStartDate && customEndDate) {
      data = dummyTimeseriesData.filter(d => d.date >= customStartDate && d.date <= customEndDate);
    }
    
    // Fallback if empty
    if (data.length === 0) data = dummyTimeseriesData.slice(-7);
    return data;
  }, [activeTab, customStartDate, customEndDate]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const len = filteredData.length || 1;
    const avgChant = Math.round(filteredData.reduce((acc, d) => acc + d.chanting, 0) / len);
    const avgRead = Math.round(filteredData.reduce((acc, d) => acc + d.reading, 0) / len);
    const avgHear = Math.round(filteredData.reduce((acc, d) => acc + d.hearing, 0) / len);
    const avgHour = Math.round(filteredData.reduce((acc, d) => acc + d.wakeupTimeHour, 0) / len);
    const avgMin = Math.round(filteredData.reduce((acc, d) => acc + d.wakeupTimeMinute, 0) / len);

    return {
      chanting: filteredData.map(d => d.chanting),
      reading: filteredData.map(d => d.reading),
      hearing: filteredData.map(d => d.hearing),
      avgText: {
        chanting: `${avgChant} rounds`,
        reading: `${avgRead} mins`,
        hearing: `${avgHear} mins`,
        wakeup: formatTime(avgHour, avgMin)
      },
      // simple progress bar score where 4:00 AM is 100% and 8:00 AM is 0%
      wakeupScore: Math.max(0, 100 - ((avgHour - 4) * 60 + avgMin) / 4) 
    };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-white font-sans relative pb-28">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-4 right-4 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-gray-800 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 max-w-sm mx-auto">
              <p className="text-[13px] font-bold leading-tight">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white z-20 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-[18px] font-extrabold text-[#0f172a] tracking-tight">Student Report</h1>
        <button className="p-2 -mr-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </div>

      <div className="px-6 py-6 pb-20 max-w-md mx-auto">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-100 to-blue-50">
              <img src={studentData.avatar} alt={studentData.name} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <h2 className="text-[24px] font-extrabold text-[#0f172a] tracking-tight">{studentData.name}</h2>
          <p className="text-[14px] text-gray-500 font-medium mt-1 mb-3">Batch 2025 • Advanced Level</p>
          <div className="flex items-center gap-3">
            <span className="bg-blue-50 text-blue-500 text-[11px] font-bold px-3 py-1 rounded-full tracking-wider uppercase">Active</span>
            <span className="text-[12px] text-gray-400 font-medium">Joined Oct 12, 2025</span>
          </div>
        </div>

        {/* Time Filter Tabs */}
        <div className="flex p-1 bg-[#f8fafc] rounded-full mb-4">
          {['7 Days', 'Month', 'Custom'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[13px] font-bold rounded-full transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Custom Date Fields */}
        <AnimatePresence>
          {activeTab === 'Custom' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex gap-4 mb-6 overflow-hidden"
            >
              <div className="flex-1">
                <label className="block text-[12px] font-bold text-gray-500 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-[#f8fafc] border-none rounded-2xl py-2.5 px-4 text-[13px] font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[12px] font-bold text-gray-500 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-[#f8fafc] border-none rounded-2xl py-2.5 px-4 text-[13px] font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity Performance */}
        <div className={activeTab !== 'Custom' ? "mt-4" : ""}>
          <h3 className="text-[12px] font-extrabold text-gray-800 tracking-wider uppercase mb-4">Activity Performance</h3>
          
          <div className="space-y-4">
            {/* Chanting */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[15px] text-gray-800">Chanting</span>
                <span className="text-gray-400 text-[12px] font-medium">Avg: {metrics.avgText.chanting}</span>
              </div>
              <InteractiveLineChart data={filteredData} dataKey="chanting" color="stroke-blue-500 text-blue-500" label="Rounds" />
            </div>

            {/* Reading */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[15px] text-gray-800">Reading</span>
                <span className="text-gray-400 text-[12px] font-medium">Avg: {metrics.avgText.reading}</span>
              </div>
              <InteractiveLineChart data={filteredData} dataKey="reading" color="stroke-orange-400 text-orange-400" label="Mins" />
            </div>

            {/* Morning Program */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[15px] text-gray-800">Morning Program</span>
                <span className="text-gray-400 text-[12px] font-medium">Avg: {metrics.avgText.wakeup}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mt-6 mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.wakeupScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-emerald-400 rounded-full"
                ></motion.div>
              </div>
            </div>

            {/* Hearing */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[15px] text-gray-800">Hearing</span>
                <span className="text-gray-400 text-[12px] font-medium">Avg: {metrics.avgText.hearing}</span>
              </div>
              <InteractiveLineChart data={filteredData} dataKey="hearing" color="stroke-purple-400 text-purple-400" label="Mins" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-[80px] left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 px-6 z-30">
        <div className="max-w-md mx-auto flex gap-3">
          <button 
            onClick={() => setIsNotificationModalOpen(true)}
            className="flex-1 bg-blue-50 text-blue-600 font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all hover:bg-blue-100 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="text-[14px]">Send Notification</span>
          </button>
          <button 
            onClick={handleAiAnalysis}
            className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93M13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07M12 11.5A1.5 1.5 0 0 1 10.5 10A1.5 1.5 0 0 1 12 8.5A1.5 1.5 0 0 1 13.5 10A1.5 1.5 0 0 1 12 11.5M12 15.5A1.5 1.5 0 0 1 10.5 14A1.5 1.5 0 0 1 12 12.5A1.5 1.5 0 0 1 13.5 14A1.5 1.5 0 0 1 12 15.5Z" /></svg>
            <span className="text-[14px]">AI Analysis</span>
          </button>
        </div>
      </div>

      {/* Notification Modal */}
      <AnimatePresence>
        {isNotificationModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationModalOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[32px] p-6 pb-12 max-w-md mx-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[20px] font-extrabold text-gray-900">Send Notification</h3>
                <button 
                  onClick={() => setIsNotificationModalOpen(false)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-transform"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">Heading</label>
                  <input
                    type="text"
                    value={notificationHeading}
                    onChange={(e) => setNotificationHeading(e.target.value)}
                    placeholder="E.g., Great Chant Today!"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">Description</label>
                  <textarea
                    value={notificationDesc}
                    onChange={(e) => setNotificationDesc(e.target.value)}
                    placeholder="Enter message details here..."
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  ></textarea>
                </div>
                
                <button 
                  onClick={handleSendNotification}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  Send Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorStudentReport;
