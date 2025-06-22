// service-worker.js

const CACHE_NAME = 'pomo-timer-v1';
const urlsToCache = [
    '/pomodoro/', // Root of the app on GitHub Pages
    '/pomodoro/index.html',
    '/pomodoro/script.js',
    '/pomodoro/audio.mp3', // Make sure this path is correct
    '/pomodoro/manifest.json',
    // Add paths to your icons:
    '/pomodoro/icons/icon-192x192.png', // Recommended PNG for best compatibility
    '/pomodoro/icons/icon-512x512.png', // Recommended PNG for best compatibility
    '/pomodoro/icon.svg', // Cache the SVG icon, now located directly in /pomodoro/
    'https://cdn.tailwindcss.com?plugins=forms,container-queries', // Cache Tailwind CDN
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', // Cache Inter font
    'https://fonts.googleapis.com/icon?family=Material+Icons' // Cache Material Icons
];

// Install event: caching app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to cache during install:', error);
            })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event: serve from cache first, then network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                return fetch(event.request).then(
                    (fetchResponse) => {
                        // Check if we received a valid response
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and can only be consumed once. We must clone it so that
                        // the browser can consume one and we can consume the other.
                        const responseToCache = fetchResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return fetchResponse;
                    }
                ).catch(error => {
                    // Handle network errors for offline experience
                    console.error('Fetch failed for:', event.request.url, error);
                    // You might want to return a fallback page here for offline
                    // return caches.match('/pomodoro/offline.html'); // If you have an offline page
                });
            })
    );
});
