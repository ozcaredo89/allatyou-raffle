/* eslint-disable */
// Service Worker for Sorteos VIP PWA
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response('Estás desconectado. Revisa tu conexión a internet.', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    })
  );
});
