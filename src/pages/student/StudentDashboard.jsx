import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ActivityCard from '../../components/shared/ActivityCard';
import NotificationsPanel from '../../components/shared/NotificationsPanel';
import BottomNavigation from '../../components/student/BottomNavigation';
import NewActivityModal from '../../components/shared/NewActivityModal';
import EditActivityModal from '../../components/shared/EditActivityModal';

// Dummy data for notifications (Shared temporarily until context/API is built)
const dummyNotifications = [
  { id: 1, title: 'Reminder: Chanting', message: 'You have not completed your rounds yet.', time: '10m ago', read: false },
  { id: 2, title: 'Goal Achieved!', message: 'You completed 60m of Reading yesterday.', time: '1d ago', read: true },
  { id: 3, title: 'New Activity', message: 'Mangal Aarti has been added to your list.', time: '2d ago', read: true },
];

const initialActivities = [
  {
    id: 1,
    title: 'Chanting',
    type: 'COUNT',
    progress: '12 / 16',
    hint: 'SWIPE RIGHT TO ADD',
    status: 'Pending',
    iconBgColor: '#eff6ff', // light blue
    iconColor: '#3b82f6', // blue
    barColor: '#1a73e8',
    iconSvg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
  },
  {
    id: 2,
    title: 'Reading',
    type: 'DURATION',
    progress: '30m / 60m',
    hint: 'SWIPE TO ADD 5M',
    status: 'Pending',
    iconBgColor: '#faf5ff', // light purple
    iconColor: '#9333ea', // purple
    barColor: '#a855f7',
    iconSvg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  },
  {
    id: 3,
    title: 'Meditation',
    type: 'TIME',
    progress: '10 / 10',
    hint: '',
    status: 'Completed',
    iconBgColor: '#f0fdfa', // light teal
    iconColor: '#0f766e', // teal
    barColor: '#20c997',
    iconSvg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  {
    id: 4,
    title: 'Hydration',
    type: 'COUNT',
    progress: '2 / 8',
    hint: 'SWIPE TO ADD',
    status: 'Pending',
    iconBgColor: '#fff7ed', // light orange
    iconColor: '#ea580c', // orange
    barColor: '#f97316',
    iconSvg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
  },
  {
    id: 5,
    title: 'Mangal Aarti',
    type: 'YES/NO',
    progress: '',
    hint: '',
    status: 'Completed',
    iconBgColor: '#fff7ed', // light orange
    iconColor: '#ea580c', // orange
    barColor: '#20c997',
    iconSvg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  }
];

const StudentDashboard = () => {
  const [activities, setActivities] = useState(initialActivities);
  const [dates, setDates] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [isEditActivityOpen, setIsEditActivityOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const dateContainerRef = useRef(null);
  const hasScrolledRef = useRef(false);

  // Generate the last 30 days starting with 30 days ago, ending at Today
  useEffect(() => {
    const generatedDates = [];
    const today = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Ascend from -29 to 0 so the array is chronological (Today is last)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      generatedDates.push({
        id: `date-${i}`,
        day: days[d.getDay()],
        date: d.getDate().toString(),
        month: months[d.getMonth()],
        fullDate: d,
        active: i === 0 // Today is active by default
      });
    }
    setDates(generatedDates);
  }, []);

  // Auto-scroll to the right so "Today" is visible on mount
  useEffect(() => {
    if (dates.length > 0 && !hasScrolledRef.current && dateContainerRef.current) {
      dateContainerRef.current.scrollLeft = dateContainerRef.current.scrollWidth;
      hasScrolledRef.current = true;
    }
  }, [dates]);

  const handleProgressUpdate = (id, newProps) => {
    setActivities(prev => prev.map(act => act.id === id ? { ...act, ...newProps } : act));
  };

  const handleDateSelect = (id) => {
    setDates(prev => prev.map(d => ({ ...d, active: d.id === id })));
  };

  const handleEditClick = (activity) => {
    setActivityToEdit(activity);
    setIsEditActivityOpen(true);
  };

  const handleSaveActivity = (updatedActivity) => {
    setActivities(prev => prev.map(act => act.id === updatedActivity.id ? updatedActivity : act));
    setIsEditActivityOpen(false);
  };

  const handleDeleteActivity = (id) => {
    setActivities(prev => prev.filter(act => act.id !== id));
    setIsEditActivityOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f1f5f9] via-[#f8fafc] to-[#eef2f6] font-sans pb-28 relative overflow-x-hidden">

      {/* Container holding the mobile width cleanly if opened on desktop */}
      <div className="w-full max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-6">
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">Activities</h1>
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0f172a] hover:bg-gray-50 active:scale-95 transition-all"
          >
            {/* Bell Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {/* Notification Badge */}
            {dummyNotifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">
                {dummyNotifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Date Selector (Native Smooth Swiping) */}
        <div
          ref={dateContainerRef}
          className="flex gap-4 px-6 overflow-x-auto pb-4 hide-scrollbar scroll-smooth"
        >
          {dates.map((item) => (
            <button
              key={item.id}
              onClick={() => handleDateSelect(item.id)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[90px] rounded-[20px] transition-all shadow-sm select-none ${item.active
                ? 'bg-[#1a73e8] text-white shadow-[#1a73e8]/30 shadow-md'
                : 'bg-white text-[#94a3b8] hover:bg-gray-50'
                }`}
            >
              <span className={`text-[24px] font-extrabold leading-none mb-1 ${item.active ? 'text-white' : 'text-[#0f172a]'}`}>{item.date}</span>
              <span className={`text-[12px] font-bold uppercase tracking-wider ${item.active ? 'text-white/90' : 'text-[#94a3b8]'}`}>{item.month}</span>
            </button>
          ))}
        </div>

        {/* Activities List */}
        <div className="px-6 mt-4">
          {activities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              onProgressUpdate={handleProgressUpdate}
              onEdit={handleEditClick}
            />
          ))}
        </div>

      </div>

      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      <NewActivityModal
        isOpen={isNewActivityOpen}
        onClose={() => setIsNewActivityOpen(false)}
        onSave={(activityData) => {
          const newId = activities.length + 1;
          const newActivity = {
            id: newId,
            ...activityData,
            status: 'Pending',
            iconBgColor: '#eff6ff',
            iconColor: '#3b82f6',
            barColor: '#1a73e8',
            progress: activityData.type === 'YES/NO' ? '' : `0 / ${activityData.target || 10}`,
            iconSvg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          };
          setActivities(prev => [...prev, newActivity]);
          setIsNewActivityOpen(false);
        }}
      />

      <EditActivityModal
        isOpen={isEditActivityOpen}
        onClose={() => setIsEditActivityOpen(false)}
        activityToEdit={activityToEdit}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
      />

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsNewActivityOpen(true)}
        className="fixed bottom-[100px] right-[calc(50%-180px)] lg:right-10 w-[64px] h-[64px] bg-[#1a73e8] hover:bg-[#155fc3] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#1a73e8]/30 transition-transform active:scale-90 z-40 lg:ml-auto"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>

      {/* Reusable Bottom Navigation */}
      <BottomNavigation />

    </div>
  );
};

export default StudentDashboard;
