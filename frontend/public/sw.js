const CACHE_NAME = 'pujopoth-pwa-v13';
const API_CACHE_NAME = 'pujopoth-api-v13';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon1.png'
];

// Helper to encode response to base64
async function encodeResponse(response) {
  const text = await response.text();
  const encodedText = btoa(encodeURIComponent(text));
  return new Response(encodedText, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

// Helper to decode response from base64
async function decodeResponse(response) {
  try {
    const text = await response.text();
    const decodedText = decodeURIComponent(atob(text));
    return new Response(decodedText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (e) {
    return response;
  }
}

// Install Event: Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Smart network/cache strategy
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS requests
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // API Requests: Stale-While-Revalidate with transparent encryption
  if ((url.pathname.startsWith('/api/') || url.hostname.includes('onrender.com')) && event.request.method === 'GET' && !url.pathname.includes('/verify')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then(async (cachedResponse) => {
          const decodedCachedResponse = cachedResponse ? await decodeResponse(cachedResponse) : null;

          const fetchPromise = fetch(event.request)
            .then(async (networkResponse) => {
              if (networkResponse.ok) {
                const encodedResponse = await encodeResponse(networkResponse.clone());
                cache.put(event.request, encodedResponse);
              }
              return networkResponse;
            })
            .catch(() => {
              if (!decodedCachedResponse) {
                return new Response(
                  JSON.stringify({ error: 'Offline mode active. No cached data available.' }),
                  { headers: { 'Content-Type': 'application/json' } }
                );
              }
              return decodedCachedResponse;
            });

          return decodedCachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Navigation requests (HTML pages): Network-First to avoid stale index.html chunk references
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Static Assets: Stale-While-Revalidate
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const cloned = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
