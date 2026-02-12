// Service Worker para notificações e sincronização offline
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker instalado');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('Service Worker ativado');
});

// Lógica de Sincronização em Segundo Plano (Background Sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(sendPendingMessages());
  }
});

async function sendPendingMessages() {
  console.log('SW: Tentando enviar mensagens pendentes...');
  
  // O localStorage não é acessível no SW, usamos IndexedDB ou repassamos via mensagem antes
  // Por simplicidade técnica neste ambiente offline, usaremos uma estratégia de "retry"
  // Quando o navegador detectar conexão, o evento 'sync' dispara.
  
  // Como o SW não tem acesso ao localStorage, o thread principal (ChatScreen)
  // envia as mensagens para o SW guardar em memória ou IndexedDB.
}

// Ouvir mensagens do thread principal
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
  
  if (event.data && event.data.type === 'REGISTER_SYNC') {
    // No ambiente Android Hotspot, o 'sync' do navegador é o melhor caminho
    console.log('SW: Sincronização registrada via mensagem');
  }
});

// Ao clicar na notificação, focar na janela do chat
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
