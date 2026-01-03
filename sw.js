// Shogun NoBackend Service Worker
const CACHE_NAME = 'shogun-nobackend-v2';

// Files to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/storage.js',
  '/manifest.json',
  '/logo.svg',
  // Apps
  '/alarm.html',
  '/amp.html',
  '/battle.html',
  '/breathe.html',
  '/calc.html',
  '/calendar.html',
  '/chat.html',
  '/chess.html',
  '/clock.html',
  '/collect.html',
  '/contacts.html',
  '/dino.html',
  '/drive.html',
  '/habit.html',
  '/kanban.html',
  '/list.html',
  '/money.html',
  '/moon.html',
  '/news.html',
  '/notes.html',
  '/pad.html',
  '/pass.html',
  '/pic.html',
  '/poll.html',
  '/qr.html',
  '/secret.html',
  '/snippet.html',
  '/split.html',
  '/stocks.html',
  '/timer.html',
  '/water.html',
  '/weather.html',
  '/wheel.html',
  '/where.html'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip external requests (Gun relay, APIs)
  if (!url.origin.includes(self.location.origin)) return;
  
  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          // Return cached, but update in background
          fetch(event.request).then(response => {
            if (response.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {});
          return cached;
        }
        
        // Not cached, fetch from network
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Offline fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      })
  );
});

// Push notification support (for future use)
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Shogun NoBackend', {
      body: data.body || 'You have a notification',
      icon: '/logo.svg',
      badge: '/logo.svg'
    })
  );
});
