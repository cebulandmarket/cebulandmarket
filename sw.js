var CACHE_VERSION = 'clm-v25';
var STATIC_CACHE = CACHE_VERSION + '-static';
var PAGES_CACHE = CACHE_VERSION + '-pages';

var HTML_PAGES = [
  '/',
  '/index.html',
  '/listings.html',
  '/property.html',
  '/submit.html',
  '/about.html',
  '/faq.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/share.html',
  '/verify.html'
];

var STATIC_ASSETS = [
  'css/style.css?v=5',
  'js/app.js',
  'js/listings.js',
  'js/analytics.js',
  'js/submit.js',
  'js/share-card.js',
  'data/listings.js',
  'favicon.png',
  'favicon.ico',
  'images/icon-192.png',
  'images/icon-512.png',
  'images/og-image.jpg',
  'images/gcash-qr.jpg',
  'manifest.json',
  'att.k0OivdrTbggDP2oVXbyAk7F4NYyO-o2cy26pCwMJN0M.jpg',
  'images/banilad-2.jpg',
  'images/mactan-1.jpg',
  'images/minglanilla-1.jpg',
  'images/talamban-1.jpg',
  'images/talamban-3.jpg',
  'images/liloan-1.jpg',
  'images/lahug-1.jpg',
  'images/pakigne-1.jpg',
  'images/canjulao-1.jpg',
  'images/tigbao-3.jpg',
  'images/bulacao-3.jpg',
  'images/liloan-vlp-3.jpg',
  'images/busay-1.jpg',
  'images/banilad-commercial-1.jpg',
  'images/vertex-1.jpg'
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

  var url = new URL(request.url);

  // Fix old /cebulandmarket/ paths — redirect to root
  if (url.pathname.indexOf('/cebulandmarket/') === 0) {
    var fixedPath = url.pathname.replace('/cebulandmarket/', '/');
    event.respondWith(Response.redirect(url.origin + fixedPath + url.search, 301));
    return;
  }

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
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — CebuLandMarket</title><style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;color:#333;text-align:center;padding:20px}h1{color:#2e7d32;font-size:1.5rem}p{margin:12px 0;color:#666}a{color:#2e7d32;font-weight:600}</style></head><body><div><h1>You\'re Offline</h1><p>Check your internet connection and try again.</p><p><a href="/">Go to Homepage</a></p></div></body></html>',
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
