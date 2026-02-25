var CACHE_VERSION = 'crm-v15';
var STATIC_CACHE = CACHE_VERSION + '-static';
var PAGES_CACHE = CACHE_VERSION + '-pages';

var HTML_PAGES = [
  '/rentals/',
  '/rentals/index.html',
  '/rentals/listings.html',
  '/rentals/property.html',
  '/rentals/submit.html',
  '/rentals/about.html',
  '/rentals/faq.html',
  '/rentals/privacy.html',
  '/rentals/terms.html',
  '/rentals/share.html',
  '/rentals/verify.html',
  '/rentals/list.html',
  '/rentals/agreement.html'
];

var STATIC_ASSETS = [
  'css/style.css',
  'js/app.js',
  'js/listings.js',
  'js/analytics.js',
  'js/submit.js',
  'js/share-card.js',
  'data/rentals.js',
  'favicon.png',
  'favicon.ico',
  'images/icon-192.png',
  'images/icon-512.png',
  'manifest.json'
];

// Install: cache static assets AND all HTML pages upfront
self.addEventListener('install', function(event) {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(function(cache) {
        return Promise.all(
          STATIC_ASSETS.map(function(url) {
            return cache.add(url).catch(function() {});
          })
        );
      }),
      caches.open(PAGES_CACHE).then(function(cache) {
        return Promise.all(
          HTML_PAGES.map(function(url) {
            return cache.add(url).catch(function() {});
          })
        );
      })
    ])
  );
  self.skipWaiting();
});

// Activate: clean ALL old caches
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

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) return;

  // HTML pages: network-first, fallback to cache, then offline message
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
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — CebuRentMarket</title><style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;color:#333;text-align:center;padding:20px}h1{color:#7B1FA2;font-size:1.5rem}p{margin:12px 0;color:#666}a{color:#7B1FA2;font-weight:600}</style></head><body><div><h1>You\'re Offline</h1><p>Check your internet connection and try again.</p><p><a href="/rentals/">Go to Homepage</a></p></div></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(STATIC_CACHE).then(function(cache) {
            cache.put(request, clone);
          });
        }
        return response;
      });
    })
  );
});
