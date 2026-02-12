// Service Worker para notificações offline
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker instalado');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('Service Worker ativado');
});

// Ouvir mensagens do thread principal (via socket.io no App)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon } = event.data.payload;
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: icon || '/vite.svg',
        badge: '/vite.svg',
        vibrate: [200, 100, 200],
        tag: 'chat-message',
        renotify: true
      })
    );
  }
});

// Ao clicar na notificação, focar na janela do chat
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
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
