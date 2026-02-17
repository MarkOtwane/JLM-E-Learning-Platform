/// <reference lib="webworker" />

/**
 * Angular Service Worker
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

import {
  cleanupOutdatedCaches,
  precacheAndRoute,
} from '@angular/service-worker/sw';

declare const self: ServiceWorkerGlobalScope;

// Remove old caches from previous versions
cleanupOutdatedCaches();

// Pre-cache critical files defined in ngsw-config.json
precacheAndRoute([
  // Angular pre-populates this with build artifacts
] as any[]);

/**
 * Handle messages from the app
 * Used for features like: update notifications, skip waiting
 */
self.addEventListener('message', (event) => {
  // Handle message from main app to skip waiting
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Handle version update notification
  if (event.data && event.data.type === 'VERSION_UPDATE') {
    console.log('New version available:', event.data.payload);
  }
});

/**
 * Fetch Event Handler
 * Implements caching strategies based on request type
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = event.request.url;

  // Skip cross-origin requests (different domain)
  if (!url.startsWith(self.location.origin)) {
    return;
  }

  // Strategy 1: Network-first for API calls (with cache fallback)
  if (url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cloned = response.clone();
            caches.open('api-cache-v1').then((cache) => {
              cache.put(event.request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed: try cache
          return caches.match(event.request).then((cached) => {
            if (cached) {
              return cached;
            }
            // No cache available: return offline error
            return new Response(
              JSON.stringify({
                error: 'Offline: This data is not available offline',
                timestamp: new Date().toISOString(),
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Offline': 'true',
                },
              },
            );
          });
        }),
    );
  }

  // Strategy 2: Cache-first for static assets (update in background)
  else if (
    url.includes('/assets/') ||
    url.match(/\.(woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        // Return cached if available
        if (cached) {
          // Update cache in background
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches.open('assets-cache-v1').then((cache) => {
                cache.put(event.request, response);
              });
            }
          });
          return cached;
        }

        // Not in cache: fetch and cache
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open('assets-cache-v1').then((cache) => {
              cache.put(event.request, cloned);
            });
          }
          return response;
        });
      }),
    );
  }

  // Strategy 3: Network-first for HTML (pages)
  else if (event.request.mode === 'navigate' || url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful page loads
          if (response.ok) {
            const cloned = response.clone();
            caches.open('page-cache-v1').then((cache) => {
              cache.put(event.request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed: try cache, fall back to offline page
          return caches.match(event.request).then((cached) => {
            return (
              cached ||
              caches.match('/offline.html') ||
              new Response('You are offline', {
                status: 503,
                statusText: 'Service Unavailable',
              })
            );
          });
        }),
    );
  }

  // Strategy 4: Cache Cloudinary images
  else if (url.includes('res.cloudinary.com')) {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => {
          return (
            cached ||
            fetch(event.request).then((response) => {
              if (response.ok) {
                const cloned = response.clone();
                caches.open('cloudinary-cache-v1').then((cache) => {
                  cache.put(event.request, cloned);
                });
              }
              return response;
            })
          );
        })
        .catch(() => {
          // Image not available: return placeholder
          const canvas = new OffscreenCanvas(200, 200);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Offline', 100, 100);
          }
          return canvas.convertToBlob().then((blob) => {
            if (blob) {
              return new Response(blob, {
                headers: { 'Content-Type': 'image/png' },
              });
            }
            return new Response('Image unavailable', { status: 404 });
          });
        }),
    );
  }

  // Default: network-first with cache fallback
  else {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open('default-cache-v1').then((cache) => {
              cache.put(event.request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          return (
            caches.match(event.request) ||
            new Response('Resource not available offline', {
              status: 503,
            })
          );
        }),
    );
  }
});

/**
 * Activate Event
 * Clean up old caches from previous versions
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Keep only current cache versions
          const currentCaches = [
            'api-cache-v1',
            'assets-cache-v1',
            'page-cache-v1',
            'cloudinary-cache-v1',
            'default-cache-v1',
            'ngsw:db:main:data',
          ];

          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );

  // Claim clients to start controlling pages immediately
  return self.clients.claim();
});

/**
 * Install Event
 * Cache critical files on first install
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open('critical-cache-v1').then((cache) => {
      return cache.addAll(['/index.html', '/offline.html']);
    }),
  );

  // Skip waiting: activate immediately without waiting for other tabs
  self.skipWaiting();
});

/**
 * Background Sync Event
 * Used for queuing failed requests to retry when online
 */
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-courses') {
    event.waitUntil(
      // Implement background sync logic
      fetch('/api/courses').then((response) => {
        if (response.ok) {
          caches.open('api-cache-v1').then((cache) => {
            cache.put('/api/courses', response);
          });
        }
      }),
    );
  }
});

/**
 * Push Event
 * Handle push notifications (if configured)
 */
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  const options: NotificationOptions = {
    body: data.body || 'New update available',
    icon: '/assets/icon-192x192.png',
    badge: '/assets/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/**
 * Notification Click Event
 * Handle user clicking on notifications
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if ('focus' in client) {
          return (client as WindowClient).focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data?.url || '/');
      }
    }),
  );
});
