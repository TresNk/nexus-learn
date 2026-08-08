// PWA Service Worker for Nexus Learn Platform
// Cache-first strategy for assets, network-first for API

const CACHE_NAME = 'nexus-learn-v1';
const ASSETS_CACHE = 'nexus-assets-v1';
const API_CACHE = 'nexus-api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== ASSETS_CACHE && cacheName !== API_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response for caching
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[ServiceWorker] Serving from cache:', request.url);
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((networkResponse) => {
        // Don't cache non-successful responses
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Clone response for caching
        const responseClone = networkResponse.clone();
        caches.open(ASSETS_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});

// Background sync for offline AI requests and multiplayer logs
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'sync-ai-requests') {
    event.waitUntil(syncAIRequests());
  } else if (event.tag === 'sync-multiplayer-logs') {
    event.waitUntil(syncMultiplayerLogs());
  }
});

// Helper function to sync queued AI requests
async function syncAIRequests() {
  try {
    const db = await openDatabase();
    const tx = db.transaction('aiRequests', 'readonly');
    const store = tx.objectStore('aiRequests');
    const requests = await getAllFromStore(store);

    for (const request of requests) {
      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        });
        // Remove successful request from queue
        await deleteFromStore(store, request.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync AI request:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync AI requests failed:', error);
  }
}

// Helper function to sync multiplayer logs
async function syncMultiplayerLogs() {
  try {
    const db = await openDatabase();
    const tx = db.transaction('multiplayerLogs', 'readonly');
    const store = tx.objectStore('multiplayerLogs');
    const logs = await getAllFromStore(store);

    for (const log of logs) {
      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log.data)
        });
        await deleteFromStore(store, log.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync multiplayer log:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync multiplayer logs failed:', error);
  }
}

// IndexedDB helper functions
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexus-offline-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('aiRequests')) {
        db.createObjectStore('aiRequests', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('multiplayerLogs')) {
        db.createObjectStore('multiplayerLogs', { keyPath: 'id' });
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function deleteFromStore(store, id) {
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notifications for learning reminders
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Nexus Learn';
  const options = {
    body: data.body || 'Time to continue your learning journey!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[ServiceWorker] Service Worker loaded and ready');
