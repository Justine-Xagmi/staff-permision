// Service Worker for Staff Permission System PWA
const CACHE_NAME = 'sps-cache-v1';

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pages/staff-dashboard.html',
  '/pages/hod-dashboard.html',
  '/pages/hoc-dashboard.html',
  '/css/style.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/staff.js',
  '/js/hod.js',
  '/js/hoc.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ===== INSTALL EVENT =====
// Runs when service worker is first installed
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.log('[SW] Cache failed:', err);
    })
  );
  self.skipWaiting();
});

// ===== ACTIVATE EVENT =====
// Cleans up old caches when new SW activates
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ===== FETCH EVENT =====
// Intercepts network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For API calls — always go to network (never cache API data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // If network fails for API, return a JSON error
        return new Response(
          JSON.stringify({ message: 'You are offline. Please check your connection.' }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        );
      })
    );
    return;
  }

  // For static files — try cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // Not in cache, fetch from network
      return fetch(request).then((networkResponse) => {
        // Cache the new response for next time
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If both cache and network fail, show offline page
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ===== PUSH NOTIFICATIONS (future use) =====
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Permission System';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
