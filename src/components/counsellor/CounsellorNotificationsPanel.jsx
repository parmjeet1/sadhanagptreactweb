import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Dummy data for notifications (should eventually come from a backend or context)
const dummyNotifications = [
  { id: 1, title: 'Reminder: Chanting', message: 'You have not completed your rounds yet.', time: '10m ago', read: false },
  { id: 2, title: 'Goal Achieved!', message: 'You completed 60m of Reading yesterday.', time: '1d ago', read: true },
  { id: 3, title: 'New Activity', message: 'Mangal Aarti has been added to your list.', time: '2d ago', read: true },
];

const NotificationsPanel = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] max-w-md mx-auto"
          />
          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[320px] bg-white shadow-2xl z-[70] flex flex-col"
            style={{
              /* center in max-w-md container visually */
              left: 'auto',
              right: 'max(0px, calc(50% - 224px))' // 448px(max-w-md)/2 = 224px
            }}
          >
            {/* Panel Header */}
            <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-[20px] font-extrabold text-[#0f172a]">Notifications</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                aria-label="Close notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f8fafc]">
              {dummyNotifications.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium text-sm">
                  No new notifications
                </div>
              ) : (
                dummyNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 rounded-2xl bg-white shadow-sm border ${notif.read ? 'border-transparent' : 'border-blue-100'} flex gap-4 transition-all`}
                  >
                    <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${notif.read ? 'bg-transparent' : 'bg-blue-500'}`} />
                    <div>
                      <h3 className={`text-[14px] ${notif.read ? 'font-semibold text-gray-800' : 'font-bold text-[#0f172a]'}`}>{notif.title}</h3>
                      <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                      <span className="text-[11px] font-bold text-gray-400 mt-3 block">{notif.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
