var CACHE_VERSION = 'tempo-v2';
var STATIC_CACHE = CACHE_VERSION + '-static';
var PAGES_CACHE = CACHE_VERSION + '-pages';

var HTML_PAGES = [
  '/calendar/',
  '/calendar/index.html'
];

var STATIC_ASSETS = [
  'css/style.css',
  'js/app.js',
  'favicon.png',
  'favicon.ico',
  'images/icon-192.png',
  'images/icon-512.png',
  'manifest.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(function (cache) {
        return Promise.all(STATIC_ASSETS.map(function (url) {
          return cache.add(url).catch(function () {});
        }));
      }),
      caches.open(PAGES_CACHE).then(function (cache) {
        return Promise.all(HTML_PAGES.map(function (url) {
          return cache.add(url).catch(function () {});
        }));
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== STATIC_CACHE && k !== PAGES_CACHE;
      }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  if (request.headers.get('Accept') && request.headers.get('Accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(request).then(function (response) {
        var clone = response.clone();
        caches.open(PAGES_CACHE).then(function (cache) { cache.put(request, clone); });
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tempo</title><style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0f;color:#f5f5f7;text-align:center;padding:20px}h1{color:#a855f7;font-size:1.5rem}p{color:#8a8a99}a{color:#a855f7;font-weight:600}</style></head><body><div><h1>Tempo</h1><p>Reload to open your calendar.</p><p><a href="/calendar/">Reload</a></p></div></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(STATIC_CACHE).then(function (cache) { cache.put(request, clone); });
        }
        return response;
      });
    })
  );
});
