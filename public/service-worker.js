const CACHE_NAME = 'mining-cache-v1';
const OFFLINE_URL = '/offline.html';

// Install event - cache offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});

// Background sync for mining data
self.addEventListener('sync', (event) => {
  if (event.tag === 'mining-sync') {
    event.waitUntil(syncMiningData());
  }
});

// Handle offline mining data sync
async function syncMiningData() {
  try {
    const db = await openMiningDB();
    const offlineSessions = await db.getAll('mining-sessions');
    
    if (offlineSessions.length === 0) return;

    // Process each offline session
    for (const session of offlineSessions) {
      try {
        // Send to server
        const response = await fetch('/api/mining/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(session),
        });

        if (response.ok) {
          // Remove synced session from IndexedDB
          await db.delete('mining-sessions', session.id);
        }
      } catch (error) {
        console.error('Error syncing mining session:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncMiningData:', error);
  }
}

// Open IndexedDB for mining data
function openMiningDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mining-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('mining-sessions')) {
        db.createObjectStore('mining-sessions', { keyPath: 'id' });
      }
    };
  });
}

// Handle fetch events
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
}); 