var CACHE_VERSION = 'cvm-v1';
var STATIC_CACHE = CACHE_VERSION + '-static';

var STATIC_ASSETS = [
  './',
  './index.html',
  './vehicle.html',
  './submit.html',
  './404.html',
  './css/style.css',
  './js/app.js',
  './js/listings.js',
  './data/vehicles.js',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function() {});
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k.indexOf(CACHE_VERSION) !== 0) return caches.delete(k);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        fetch(event.request).then(function(fresh) {
          if (fresh && fresh.ok) {
            caches.open(STATIC_CACHE).then(function(c) { c.put(event.request, fresh); });
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(event.request);
    })
  );
});
