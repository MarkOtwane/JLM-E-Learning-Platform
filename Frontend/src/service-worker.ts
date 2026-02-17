/// <reference lib="webworker" />

/**
 * Custom Service Worker
 *
 * Enables offline support, caching strategies, and background sync.
 * Implements:
 * - Precaching of critical app files
 * - Network-first fallback for API calls
 * - Cache-first for static assets
 * - Offline error handling
 *
 * Configuration: ngsw-config.json
 * Activation: src/main.ts registers 'ngsw-worker.js'
 */

// Use 'any' type to avoid TypeScript service worker type issues in standard Angular setup
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const swSelf: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const global = typeof self !== 'undefined' ? self : swSelf;

// Install Event - Activate service worker immediately
global.addEventListener('install', (event: any) => {
  event.waitUntil(
    (global as any).skipWaiting()
  );
});

global.addEventListener('activate', (event: any) => {
  event.waitUntil(
    (global as any).clients.claim()
  );
});

// Cache configuration
const CACHE_NAMES = {
  api: 'api-cache-v1',
  assets: 'assets-cache-v1',
  page: 'page-cache-v1',
  cloudinary: 'cloudinary-cache-v1',
  default: 'default-cache-v1',
};

// Fetch Event - Handle all network requests
global.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== (global.location?.origin || self.location?.origin)) {
    return;
  }

  // Strategy 1: Cache-first for static assets
  if (
    url.pathname.includes('/assets/') ||
    url.pathname.match(/\.(woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    event.respondWith(
      (global as any).caches.match(request).then((cached: any) => {
        if (cached) {
          // Update cache in background
          fetch(request).then((response: any) => {
            if (response.ok) {
              (global as any).caches.open(CACHE_NAMES.assets).then((cache: any) => {
                cache.put(request, response);
              });
            }
          });
          return cached;
        }

        // Not in cache: fetch and cache
        return fetch(request).then((response: any) => {
          if (response.ok) {
            const cloned = response.clone();
            (global as any).caches.open(CACHE_NAMES.assets).then((cache: any) => {
              cache.put(request, cloned);
            });
          }
          return response;
        });
      }),
    );
  }

  // Strategy 2: Network-first for API calls
  else if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response: any) => {
          if (response.ok) {
            const cloned = response.clone();
            (global as any).caches.open(CACHE_NAMES.api).then((cache: any) => {
              cache.put(request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          return (global as any).caches.match(request).then((cached: any) => {
            return cached || new Response('API unavailable offline', { status: 503 });
          });
        }),
    );
  }

  // Strategy 3: Network-first for HTML (pages)
  else if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      (async (): Promise<Response> => {
        try {
          const response = await fetch(request);
          // Cache successful page loads
          if (response.ok) {
            const cloned = response.clone();
            (global as any).caches.open(CACHE_NAMES.page).then((cache: any) => {
              cache.put(request, cloned);
            });
          }
          return response;
        } catch {
          // Network failed: try cache, fall back to offline page
          const cached = await (global as any).caches.match(request);
          if (cached) {
            return cached;
          }
          const offlinePage = await (global as any).caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
          return new Response('You are offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
      })(),
    );
  }

  // Strategy 4: Cache Cloudinary images
  else if (url.href.includes('res.cloudinary.com')) {
    event.respondWith(
      (global as any).caches
        .match(request)
        .then((cached: any) => {
          return (
            cached ||
            fetch(request).then((response: any) => {
              if (response.ok) {
                const cloned = response.clone();
                (global as any).caches.open(CACHE_NAMES.cloudinary).then((cache: any) => {
                  cache.put(request, cloned);
                });
              }
              return response;
            })
          );
        })
        .catch(() => {
          // Network failed, try to return placeholder
          return (global as any).caches.match('/assets/images/placeholder.png').then((placeholder: any) => {
            if (placeholder) {
              return placeholder;
            }
            // Return a simple 1x1 transparent PNG if no placeholder
            return new Response('', {
              status: 200,
              headers: { 'Content-Type': 'image/png' },
            });
          });
        }),
    );
  }

  // Default: network-first with cache fallback
  else {
    event.respondWith(
      (async (): Promise<Response> => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cloned = response.clone();
            (global as any).caches.open(CACHE_NAMES.default).then((cache: any) => {
              cache.put(request, cloned);
            });
          }
          return response;
        } catch {
          // Network failed: try cache, fall back to error response
          const cached = await (global as any).caches.match(request);
          if (cached) {
            return cached;
          }
          return new Response('Resource not available offline', {
            status: 503,
          });
        }
      })(),
    );
  }
});

// Activate Event - Clean up old caches
global.addEventListener('activate', (event: any) => {
  event.waitUntil(
    (global as any).caches.keys().then((cacheNames: string[]) => {
      return Promise.all(
        cacheNames.map((cacheName: string) => {
          const currentCaches = [
            CACHE_NAMES.api,
            CACHE_NAMES.assets,
            CACHE_NAMES.page,
            CACHE_NAMES.cloudinary,
            CACHE_NAMES.default,
          ];

          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return (global as any).caches.delete(cacheName);
          }
          return Promise.resolve();
        }),
      );
    }),
  );
});

// Push Notification Event
global.addEventListener('push', (event: any) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
  };

  event.waitUntil(
    (global as any).registration.showNotification(data.title || 'JLM E-Learning', options)
  );
});

// Notification Click Event
global.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  event.waitUntil(
    (global as any).clients.matchAll({ type: 'window' }).then((clients: any[]) => {
      // Check if there's already a window open
      for (const client of clients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none exists
      if ((global as any).clients.openWindow) {
        return (global as any).clients.openWindow(event.notification.data.url || '/');
      }
    }),
  );
});
