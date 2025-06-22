const CACHE_NAME = 'layoutvibe-cache-v18'; // <-- Updated version
const URLS_TO_PRECACHE = [
    '/',
    '/index.html',
    '/manifest.json',

    // JavaScript
    '/js/main.js',

    // CSS
    '/css/tailwind.min.css',
    '/css/all.min.css',

    // Local Assets
    '/assets/help-video.mp4',
    '/assets/video-poster.png',

    // Font Awesome webfonts (these are crucial for icons to appear offline)
    '/webfonts/fa-solid-90ç0.woff2',
    '/webfonts/fa-regular-400.woff2',
    '/webfonts/fa-brands-400.woff2'
];

// Install event: open cache and add all core files to it
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Precaching core assets.');
                // Add all the files from the URLS_TO_PRECACHE list to the cache
                return cache.addAll(URLS_TO_PRECACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event: delete old caches to clean up
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // If a cache's name is not the current one, delete it
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event: serve from cache first, fall back to network
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // If the resource is in the cache, serve it directly
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If it's not in the cache, fetch it from the network
                return fetch(event.request).then(
                    (networkResponse) => {
                        // Don't cache opaque responses or errors
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clone the response because it's a one-time-use stream
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                // Cache the newly fetched resource for next time
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    // This will be triggered if the network fetch fails (e.g., offline)
                    // and the item was not in the cache.
                    console.log('[Service Worker] Fetch failed; user is offline and resource is not cached.', error);
                });
            })
    );
});