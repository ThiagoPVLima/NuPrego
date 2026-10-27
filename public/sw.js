const CACHE = 'nuprego-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response.ok) {
          caches.open(CACHE).then((c) => c.put(event.request, response.clone()));
        }
        return response;
      });
      return cached || network;
    })
  );
});

self.addEventListener('push', (event) => {
  const dados = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(dados.title || 'NuPrego', {
      body: dados.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: dados.url || '/tarefas' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((abertas) => {
      for (const c of abertas) {
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
