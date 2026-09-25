// ---------------------------------------------------------------------------
// PWA app-shell caching (added for installability — everything below is new;
// the push/notificationclick listeners further down are untouched).
//
// Strategy: network-first, falling back to cache when offline, for same-
// origin GET requests only. API calls (/api/*), non-GET requests, and
// cross-origin requests (e.g. Google Sign-In's script) are never touched by
// this service worker, so authentication, data fetches and existing routing
// all keep working exactly as before, online or off.
// ---------------------------------------------------------------------------
const SHELL_CACHE = 'sadhanagpt-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return; // e.g. accounts.google.com
  if (url.pathname.startsWith('/api/')) return; // never cache/intercept API calls

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('/index.html');
          return undefined;
        })
      )
  );
});

self.addEventListener('push', e => {
  let data = { title: 'Notification', body: 'New message received' };
  
  if (e.data) {
    try {
      data = e.data.json();
    } catch (e) {
      data = { title: 'Notification', body: e.data.text() };
    }
  }

  console.log('Push Received in Service Worker!', data);

  const options = {
    body: data.body,
    icon: '/favicon.svg', 
    vibrate: [200, 100, 200],
    requireInteraction: true 
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // If a window is already open, focus it. Otherwise open a new one.
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
