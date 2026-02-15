var CACHE_VERSION = 'clm-v2';
var STATIC_CACHE = CACHE_VERSION + '-static';
var PAGES_CACHE = CACHE_VERSION + '-pages';

var STATIC_ASSETS = [
  'css/style.css?v=2',
  'js/app.js',
  'js/listings.js',
  'js/analytics.js',
  'js/submit.js',
  'data/listings.js',
  'favicon.png',
  'images/icon-192.png',
  'images/icon-512.png',
  'images/og-image.jpg',
  'images/dti-badge.svg',
  'images/gcash-qr.jpg',
  'manifest.json'
];

var PAGES_TO_CACHE = [
  '/',
  '/index.html',
  '/listings.html',
  '/about.html',
  '/submit.html',
  '/faq.html',
  '/privacy.html',
  '/property.html',
  '/404.html'
];

// Install: cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== STATIC_CACHE && key !== PAGES_CACHE;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', function(event) {
  var request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (analytics, forms, etc.)
  if (!request.url.startsWith(self.location.origin)) return;

  // HTML pages: network-first (fresh content), fallback to cache
  if (request.headers.get('Accept') && request.headers.get('Accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(request).then(function(response) {
        var clone = response.clone();
        caches.open(PAGES_CACHE).then(function(cache) {
          cache.put(request, clone);
        });
        return response;
      }).catch(function() {
        return caches.match(request).then(function(cached) {
          return cached || caches.match('/404.html');
        });
      })
    );
    return;
  }

  // Static assets (CSS, JS, images): cache-first
  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        var clone = response.clone();
        caches.open(STATIC_CACHE).then(function(cache) {
          cache.put(request, clone);
        });
        return response;
      });
    })
  );
});
