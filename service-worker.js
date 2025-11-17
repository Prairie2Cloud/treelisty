/**
 * TreeListy Service Worker
 * Enables offline PWA functionality and .treelisty file handling
 */

const CACHE_NAME = 'treelisty-v1.0';
const urlsToCache = [
  '/treeplexity.html',
  '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('🌳 TreeListy Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened, adding files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🌳 TreeListy Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Handle file launches (when .treelisty files are opened)
self.addEventListener('launch', event => {
  console.log('🌳 TreeListy: File launch event received');

  if (event.files && event.files.length > 0) {
    // File was launched - extract file data
    const fileHandlers = event.files.map(async file => {
      const fileData = await file.data.text();
      return {
        name: file.name,
        content: fileData
      };
    });

    // Store file data in IndexedDB or pass to client
    Promise.all(fileHandlers).then(files => {
      console.log('✅ Files loaded:', files);

      // Send message to all clients to load the file
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'FILE_OPENED',
            files: files
          });
        });
      });
    });
  }
});
