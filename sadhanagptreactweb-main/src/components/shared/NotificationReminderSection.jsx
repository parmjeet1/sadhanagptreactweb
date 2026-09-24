import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postRequest } from '../../services/api';

const NotificationReminderSection = ({
  isPushEnabled,
  setIsPushEnabled,
  userDetails,
  toast
}) => {
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to handle enabling notifications
  const handleEnableNotifications = async () => {
    setIsSubmitting(true);
    // Synchronously update UI and local storage
    setIsPushEnabled(true);
    if (userDetails?.user_id) {
      localStorage.setItem(`push_enabled_${userDetails.user_id}`, 'true');
    }
    setShowEnableModal(false);

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast?.success?.('Reminders enabled!') || toast?.('Reminders enabled!');
        setIsSubmitting(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast?.success?.('Reminders enabled!') || toast?.('Reminders enabled!');
        setIsSubmitting(false);
        return;
      }

      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        toast?.success?.('Reminders enabled!') || toast?.('Reminders enabled!');
        setIsSubmitting(false);
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

      if (userDetails?.user_id) {
        postRequest('/notifications-subscribe', {
          user_id: userDetails.user_id,
          subscription: subscription
        }, (response) => {
          toast?.success?.('Push notifications enabled!') || toast?.('Push notifications enabled!');
          setIsSubmitting(false);
        });
      } else {
        toast?.success?.('Push notifications enabled!') || toast?.('Push notifications enabled!');
        setIsSubmitting(false);
      }

    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast?.success?.('Reminders enabled!') || toast?.('Reminders enabled!');
      setIsSubmitting(false);
    }
  };

  // Helper to handle disabling notifications
  const handleDisableNotifications = async () => {
    setIsSubmitting(true);
    // Synchronously update UI and local storage
    setIsPushEnabled(false);
    if (userDetails?.user_id) {
      localStorage.setItem(`push_enabled_${userDetails.user_id}`, 'false');
    }
    setShowDisableModal(false);

    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }
      toast?.success?.('Push notifications disabled!') || toast?.('Push notifications disabled!');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast?.success?.('Push notifications disabled!') || toast?.('Push notifications disabled!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Persistent Reminder Status Card */}
      <div className="px-6 mt-2 mb-4">
        {isPushEnabled ? (
          /* ENABLED STATE (GREEN CARD) */
          <div className="bg-[#ecfdf5] dark:bg-[#064e3b]/30 border border-[#bbf7d0] dark:border-[#047857] shadow-sm rounded-[20px] p-4 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#d1fae5] dark:bg-[#065f46]/50 flex items-center justify-center text-[#15803d] dark:text-[#34d399] flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-[#15803d] dark:text-[#6ee7b7] font-extrabold text-[15px] leading-snug">
                  Reminders Enabled
                </h3>
                <p className="text-[#16a34a] dark:text-[#34d399] text-xs font-medium mt-0.5">
                  You will receive weekly push notifications
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDisableModal(true)}
              className="px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-md shadow-[#2563eb]/20 active:scale-95 flex-shrink-0"
            >
              Disable
            </button>
          </div>
        ) : (
          /* DISABLED STATE (DEFAULT CARD) */
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-700 shadow-sm rounded-[20px] p-4 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#eff6ff] dark:bg-slate-800 flex items-center justify-center text-[#1a73e8] dark:text-[#60a5fa] flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-[#0f172a] dark:text-white font-extrabold text-[15px] leading-snug">
                  Enable Reminders
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                  Stay updated with weekly sadhana reminders
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEnableModal(true)}
              className="px-5 py-2 bg-[#1a73e8] hover:bg-[#155fc3] text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-md shadow-[#1a73e8]/20 active:scale-95 flex-shrink-0"
            >
              Enable
            </button>
          </div>
        )}
      </div>

      {/* 1. ENABLE REMINDERS MODAL (IMAGE 1) */}
      <AnimatePresence>
        {showEnableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#1e293b] rounded-[28px] p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800 relative text-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowEnableModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Bell Icon Badge */}
              <div className="w-16 h-16 rounded-full bg-[#eff6ff] dark:bg-slate-800 flex items-center justify-center text-[#1a73e8] dark:text-[#60a5fa] mx-auto mb-4 mt-2 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>

              {/* Title & Subtext */}
              <h2 className="text-xl font-extrabold text-[#0f172a] dark:text-white tracking-tight mb-2">
                Enable Reminders
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed px-2 mb-6">
                Stay updated with weekly sadhana reminders so you never miss a day.
              </p>

              {/* Enable Button */}
              <button
                disabled={isSubmitting}
                onClick={handleEnableNotifications}
                className="w-full py-3.5 bg-[#1a73e8] hover:bg-[#155fc3] text-white text-base font-bold rounded-2xl shadow-lg shadow-[#1a73e8]/25 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Enable'
                )}
              </button>

              {/* Checkbox: Don't show again */}
              <label className="inline-flex items-center gap-2.5 mt-5 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1a73e8] focus:ring-[#1a73e8] cursor-pointer"
                />
                <span>Don't show again</span>
              </label>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. DISABLE NOTIFICATIONS MODAL (IMAGE 3) */}
      <AnimatePresence>
        {showDisableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#1e293b] rounded-[28px] p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800 relative text-left"
            >
              {/* Title */}
              <h2 className="text-xl font-extrabold text-[#0f172a] dark:text-white tracking-tight mb-2">
                Disable notifications?
              </h2>

              {/* Subtext */}
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">
                You will no longer receive weekly push notifications from SadhnaGPT.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  disabled={isSubmitting}
                  onClick={() => setShowDisableModal(false)}
                  className="flex-1 py-3 bg-[#f1f5f9] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0f172a] dark:text-slate-200 font-bold rounded-2xl transition-all active:scale-[0.98] text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleDisableNotifications}
                  className="flex-1 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Disable'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationReminderSection;
