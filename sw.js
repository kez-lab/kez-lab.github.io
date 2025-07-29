---
---
// Service Worker for KEZ Lab Blog
const CACHE_NAME = 'kez-lab-v1';
const urlsToCache = [
  '/',
  '/assets/main.css',
  '/assets/js/code-copy.js',
  '/assets/js/lazy-loading.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});