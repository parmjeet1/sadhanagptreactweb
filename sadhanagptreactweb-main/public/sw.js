self.addEventListener('push', e => {
  let data = { title: 'Notification', body: 'New message received' };
  
  if (e.data) {
    try {
      data = e.data.json();
    } catch (err) {
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
