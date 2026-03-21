// BLEU Service Worker — v1.0
// Caches core assets for offline access
// Never blocks the user — always tries network first

const CACHE_NAME = 'bleu-v1';
const OFFLINE_ESSENTIALS = [
  '/',
  '/index.html'
];

// Install — cache essentials
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(OFFLINE_ESSENTIALS).catch(function() {
        // Silent fail — offline cache is nice-to-have not critical
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', function(event) {
  // Only handle GET requests for our own domain
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Skip Supabase, Stripe, external APIs — never intercept
  const skipDomains = ['supabase.co', 'stripe.com', 'anthropic.com', 'openai.com'];
  if (skipDomains.some(d => event.request.url.includes(d))) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Network failed — try cache
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // Last resort for HTML pages — return cached index
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
