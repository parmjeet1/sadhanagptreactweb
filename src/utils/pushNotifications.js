import { postRequest } from '../services/api';

// Shared enable/disable for push reminders (used by the Profile screen).
// Mirrors what the home-screen "Enable Reminders" dialog does.

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePushNotifications(userDetails) {
  const uid = userDetails?.user_id;
  if (uid) {
    localStorage.setItem(`push_enabled_${uid}`, 'true');
    postRequest('/update-reminder-preferences', { user_id: uid, reminder_enabled: true, reminder_status: 1 }, () => {});
  }
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return true;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return true;
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) registration = await navigator.serviceWorker.register('/sw.js');
    const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!key) return true;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });
    if (uid) postRequest('/notifications-subscribe', { user_id: uid, subscription }, () => {});
  } catch (e) {
    console.error('Error enabling notifications:', e);
  }
  return true;
}

export async function disablePushNotifications(userDetails) {
  const uid = userDetails?.user_id;
  if (uid) {
    localStorage.setItem(`push_enabled_${uid}`, 'false');
    postRequest('/update-reminder-preferences', { user_id: uid, reminder_enabled: false, reminder_status: 0 }, () => {});
    postRequest('/notifications-unsubscribe', { user_id: uid }, () => {});
  }
  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = registration ? await registration.pushManager.getSubscription() : null;
      if (sub) await sub.unsubscribe();
    }
  } catch (e) {
    console.error('Error disabling notifications:', e);
  }
  return true;
}
