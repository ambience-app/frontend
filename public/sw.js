const CACHE_NAME = 'ambience-chat-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/_next/static/css/',
  '/_next/static/chunks/pages/',
  '/images/logo.png',
  '/manifest.json',
  '/favicon.ico',
  OFFLINE_URL
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external URLs
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // For API requests, try network first, then cache, then offline page
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other requests, try cache first, then network, then offline page
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, try the network
        return fetch(event.request)
          .then((response) => {
            // If we got a valid response, cache it
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch(() => {
            // If both cache and network fail, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return new Response('', { status: 500, statusText: 'Offline' });
          });
      })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_MESSAGES') {
    // Handle message sync when back online
    event.waitUntil(handleSync(event.data.messages));
  }
});

// Handle sync when back online
async function handleSync(messages) {
  // This would be implemented to sync messages when back online
  // For now, it's a placeholder for the sync logic
  const registration = await self.registration;
  registration.showNotification('Messages synced', {
    body: 'Your messages have been synced with the server.',
    icon: '/images/logo.png',
    badge: '/images/logo.png'
  });
}
