import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NotificationsPanel from '../../components/shared/NotificationsPanel';
import BottomNavigation from '../../components/student/BottomNavigation';

// Helper for smooth Bezier curves
const getCurvedPathData = (data, width, height, padding) => {
  if (!data || data.length === 0) return "";
  const xStep = (width - padding * 2) / (data.length - 1);
  const max = Math.max(...data, 1);
  const yFactor = (height - padding * 2) / max;

  const points = data.map((val, i) => ({
    x: padding + i * xStep,
    y: height - padding - val * yFactor
  }));

  if (points.length < 2) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const mx = (curr.x + next.x) / 2;
    d += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
};

// Tooltip Component
const DailyTooltip = ({ day, value, label, position }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: 10 }}
    className="absolute z-50 pointer-events-none"
    style={{ left: position.x, top: position.y - 80 }}
  >
    <div className="bg-[#0f172a] text-white px-4 py-2 rounded-xl shadow-2xl relative">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Oct {18 + day}</div>
      <div className="text-[16px] font-black whitespace-nowrap">{value} <span className="text-[12px] font-medium text-gray-400">{label}</span></div>
      {/* Arrow */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] rotate-45"></div>
    </div>
  </motion.div>
);

const MiniChart = ({ data, color, label }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const width = 300;
  const height = 100;
  const padding = 10;
  
  const linePath = getCurvedPathData(data, width, height, padding);
  const areaPath = `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  const handleInteraction = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xStep = (rect.width - (padding * 2 * (rect.width/width))) / (data.length - 1);
    const index = Math.round((x - (padding * (rect.width/width))) / xStep);
    
    if (index >= 0 && index < data.length) {
      setHoverIndex(index);
      // Calculate tooltip position relative to the SVG container
      const xPos = padding + index * ((width - padding * 2) / (data.length - 1));
      setTooltipPos({ x: (xPos / width) * rect.width, y: 0 });
    }
  };

  const gradientId = `grad-${color.replace('#', '')}`;
  const areaGradId = `area-${color.replace('#', '')}`;

  return (
    <div className="relative w-full h-24 mt-6 overflow-visible" onPointerMove={handleInteraction} onPointerLeave={() => setHoverIndex(null)}>
      <AnimatePresence>
        {hoverIndex !== null && (
          <DailyTooltip 
            day={hoverIndex} 
            value={data[hoverIndex]} 
            label={label}
            position={tooltipPos}
          />
        )}
      </AnimatePresence>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area Fill */}
        <motion.path
          d={areaPath}
          fill={`url(#${areaGradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Main Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Scrubber Line */}
        <AnimatePresence>
          {hoverIndex !== null && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <line 
                x1={padding + hoverIndex * ((width - padding * 2) / (data.length - 1))} 
                y1={0} 
                x2={padding + hoverIndex * ((width - padding * 2) / (data.length - 1))} 
                y2={height - padding} 
                stroke="#e2e8f0" 
                strokeWidth="1" 
                strokeDasharray="4 2"
              />
              <circle 
                cx={padding + hoverIndex * ((width - padding * 2) / (data.length - 1))} 
                cy={height - padding - (data[hoverIndex] * ((height - padding * 2) / Math.max(...data, 1)))} 
                r="6" 
                fill="white" 
                stroke={color} 
                strokeWidth="3"
                className="drop-shadow-sm"
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
};

const Analytics = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('Weekly');
  const [fromDate, setFromDate] = useState('2026-03-10');
  const [toDate, setToDate] = useState('2026-03-17');

  const tabs = ['Weekly', '15 Days', 'Custom'];
  
  const activitiesData = [
    { name: 'CHANTING', value: 86, label: 'Total Counts', trend: '+12%', data: [40, 55, 48, 65, 58, 62, 70], color: '#1a73e8' },
    { name: 'READING', value: 42, label: 'Pages', trend: '+5%', data: [30, 32, 38, 45, 42, 48, 55], color: '#a855f7' },
    { name: 'MEDITATION', value: 120, label: 'Minutes', trend: 'Stable', trendColor: '#93c5fd', data: [118, 122, 120, 119, 121, 120, 120], color: '#20c997' }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-28 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6">
          <button 
            onClick={() => navigate('/student-dashboard')}
            className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0f172a] active:scale-95 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <h1 className="text-[20px] font-extrabold text-[#0f172a] tracking-tight">Activity Analytics</h1>
          
          <button 
            onClick={() => setShowNotifications(true)}
            className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0f172a] active:scale-95 transition-all relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>

        {/* Tabs / Segmented Control */}
        <div className="px-6 mb-6">
          <div className="bg-white p-1.5 rounded-[24px] shadow-sm flex items-center justify-between">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-[20px] text-[15px] font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-[#1a73e8] text-white shadow-md shadow-blue-500/20' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Picker Section */}
        <AnimatePresence>
          {activeTab === 'Custom' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 mb-8 overflow-hidden"
            >
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">From</label>
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-[#f8fafc] text-[#0f172a] font-bold text-[14px] rounded-2xl py-3 px-4 outline-none border border-transparent focus:border-blue-100 transition-all cursor-pointer"
                  />
                </div>
                <div className="text-gray-300 pt-5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">To</label>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-[#f8fafc] text-[#0f172a] font-bold text-[14px] rounded-2xl py-3 px-4 outline-none border border-transparent focus:border-blue-100 transition-all cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date Range Label (Shown when not in custom mode or as header) */}
        {activeTab !== 'Custom' && (
          <div className="text-center mb-8">
            <span className="text-[16px] font-bold text-gray-400">Oct 18 - Oct 24</span>
          </div>
        )}

        {/* Cards List */}
        <div className="px-6 space-y-8">
          {activitiesData.map((activity, idx) => (
            <motion.div
              key={activity.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col relative overflow-visible group"
            >
              {/* Badge */}
              <div className="absolute top-8 right-8">
                <span className={`px-4 py-1.5 rounded-full text-[12px] font-extrabold flex items-center gap-1.5 ${
                  activity.trend === 'Stable' 
                    ? 'bg-[#f0f7ff] text-[#1a73e8]' 
                    : 'bg-[#f0fdf4] text-[#16a34a]'
                }`}>
                  {activity.trend !== 'Stable' && (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                  )}
                  {activity.trend}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-[12px] font-black text-gray-300 uppercase tracking-[0.14em]">{activity.name}</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[48px] font-black text-[#0f172a] leading-none tracking-tight">{activity.value}</span>
                  <span className="text-[17px] font-bold text-gray-400">{activity.label}</span>
                </div>
              </div>

              {/* Interative Premium Chart */}
              <MiniChart 
                data={activity.data} 
                color={activity.color} 
                label={activity.label === 'Total Counts' ? 'Counts' : (activity.label === 'Pages' ? 'Pages' : 'Mins')}
              />
            </motion.div>
          ))}
        </div>

      </div>

      {/* Overlays */}
      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      
      <BottomNavigation />
    </div>
  );
};

export default Analytics;
