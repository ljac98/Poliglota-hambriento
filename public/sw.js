const CACHE_NAME = 'hungry-poly-pwa-v4';
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

function shouldCacheResponse(request, response) {
  if (!response || !response.ok) return false;
  const contentType = response.headers.get('content-type') || '';

  if (request.mode === 'navigate' || request.destination === 'document') {
    return contentType.includes('text/html');
  }
  if (request.destination === 'script') {
    return contentType.includes('javascript') || contentType.includes('ecmascript');
  }
  if (request.destination === 'style') {
    return contentType.includes('text/css');
  }
  if (request.destination === 'image') {
    return contentType.startsWith('image/');
  }

  return !contentType.includes('text/html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (shouldCacheResponse(event.request, response)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || caches.match('/');
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      if (cachedResponse) {
        event.waitUntil(
          fetch(event.request)
            .then(async (response) => {
              if (shouldCacheResponse(event.request, response)) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, response.clone());
              }
            })
            .catch(() => {}),
        );
        return cachedResponse;
      }

      return fetch(event.request)
        .then(async (response) => {
          if (shouldCacheResponse(event.request, response)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          if (event.request.mode === 'navigate' || event.request.destination === 'document') {
            return (await caches.match(event.request)) || caches.match('/');
          }
          return Response.error();
        });
    }),
  );
});
