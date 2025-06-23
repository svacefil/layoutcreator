const CACHE_NAME = 'layoutvibe-cache-v18'; // You can increment this version to force an update
const URLS_TO_PRECACHE = [
    './',
    'index.html',
    'manifest.json',

    'js/main.js',

    'css/tailwind.min.css',
    'css/all.min.css',

    'assets/help-video.mp4',
    'assets/video-poster.png',

    'webfonts/fa-solid-900.woff2',
    'webfonts/fa-regular-400.woff2',
    'webfonts/fa-brands-400.woff2'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Precaching core assets.');
                return cache.addAll(URLS_TO_PRECACHE);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(
                    (networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.log('[Service Worker] Fetch failed; user is offline and resource is not cached.', error);
                });
            })
    );
});