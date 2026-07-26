importScripts('./assets/js/data/swconf.js');

const purge = swconf.purge;
const interceptor = swconf.interceptor;

function verifyUrl(url) {
  const requestUrl = new URL(url);
  const requestPath = requestUrl.pathname;

  if (!requestUrl.protocol.startsWith('http')) {
    return false;
  }

  for (const prefix of interceptor.urlPrefixes) {
    if (requestUrl.href.startsWith(prefix)) {
      return false;
    }
  }

  for (const path of interceptor.paths) {
    if (requestPath.startsWith(path)) {
      return false;
    }
  }
  return true;
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

function cacheResponse(request, response) {
  const url = request.url;

  if (purge || request.method !== 'GET' || !verifyUrl(url)) {
    return response;
  }

  // Keep the latest successful page available for offline use.
  if (response.ok) {
    caches.open(swconf.cacheName).then((cache) => {
      cache.put(request, response.clone());
    });
  }

  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (purge
      ? Promise.resolve()
      : caches.open(swconf.cacheName).then((cache) => cache.addAll(swconf.resources))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (purge) {
              return caches.delete(key);
            } else {
              if (key !== swconf.cacheName) {
                return caches.delete(key);
              }
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.headers.has('range')) {
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => cacheResponse(event.request, response))
        .catch(() => caches.match(event.request).then((response) => response || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => cacheResponse(event.request, response));
    })
  );
});
