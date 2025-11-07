const CACHE_NAME = 'storyhive-pwa-v4'; 
const API_CACHE_NAME = 'storyhive-api-v1';


const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/src/index.html',
    '/styles/styles.css',
    '/src/styles/styles.css',
    '/scripts/pages/app.js',
    '/src/scripts/pages/app.js',
    '/scripts/utils/push-notification.js',
    '/src/scripts/utils/push-notification.js',
    '/scripts/data/api.js',
    '/src/scripts/data/api.js',
    '/images/Logo.png',
    '/src/public/images/Logo.png',
    '/images/favicon.png',
    '/src/public/images/favicon.png',
    '/manifest.json',
    '/public/manifest.json'
];


self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(APP_SHELL_URLS).catch(error => {
                    console.log('Cache addAll failed:', error);
                });
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== API_CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    if (url.protocol === 'chrome-extension:') return;

    if (url.hostname === 'story-api.dicoding.dev') {
        event.respondWith(handleApiRequest(request));
        return;
    }

    if (isAppShellRequest(request)) {
        event.respondWith(handleAppShellRequest(request));
        return;
    }

    event.respondWith(handleDefaultRequest(request));
});

async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE_NAME);
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone).catch(error => {
                console.log('Cache put failed for API:', error);
            });
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        if (request.url.includes('/v1/stories')) {
            return new Response(JSON.stringify({
                error: 'offline',
                message: 'Anda sedang offline. Data terakhir yang tersedia akan ditampilkan.',
                listStory: await getCachedStories()
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({
            error: 'offline',
            message: 'Tidak dapat terhubung ke server.'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleAppShellRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone()).catch(error => {
                console.log('Cache put failed:', error);
            });
        }
        return networkResponse;
    } catch (error) {
        if (request.destination === 'document') {
            return caches.match('/');
        }
        return new Response('Network error', { status: 408 });
    }
}

async function handleDefaultRequest(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        return cachedResponse || new Response('Offline', { status: 503 });
    }
}

function isAppShellRequest(request) {
    const url = new URL(request.url);
    return APP_SHELL_URLS.some(appUrl => {
        try {
            const appURL = new URL(appUrl, self.location.origin);
            return appURL.pathname === url.pathname;
        } catch {
            return request.url.includes(appUrl);
        }
    });
}

async function getCachedStories() {
    try {
        const cache = await caches.open(API_CACHE_NAME);
        const response = await cache.match('https://story-api.dicoding.dev/v1/stories');
        
        if (response) {
            const data = await response.json();
            return data.listStory || [];
        }
    } catch (error) {
        console.log('Error getting cached stories:', error);
    }
    
    return [];
}

self.addEventListener('sync', (event) => {
    if (event.tag === 'storyhive-data-sync') {
        event.waitUntil(syncStoriesData());
    }
});

async function syncStoriesData() {
    try {
        const response = await fetch('https://story-api.dicoding.dev/v1/stories');
        if (response.ok) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put('https://story-api.dicoding.dev/v1/stories', response);
        }
    } catch (error) {
        console.log('Background sync failed:', error);
    }
}

self.addEventListener('push', (event) => {
    let data = {
        title: 'StoryHive',
        body: 'Anda memiliki notifikasi baru',
        icon: '/images/favicon.png',
        badge: '/images/favicon.png',
        tag: 'storyhive-general',
        url: '#/home',
        actions: [
            {
                action: 'open',
                title: 'Buka Aplikasi'
            },
            {
                action: 'close',
                title: 'Tutup'
            }
        ]
    };

    if (event.data) {
        try {
            const serverData = event.data.json();
            data = { ...data, ...serverData };
        } catch (error) {
            data.body = event.data.text() || data.body;
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: {
            url: data.url,
            timestamp: new Date().toISOString(),
            source: 'storyhive'
        },
        actions: data.actions,
        vibrate: [200, 100, 200],
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;
    const notificationData = notification.data || {};
    const targetUrl = notificationData.url || '#/home';

    notification.close();

    if (action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ 
            type: 'window',
            includeUncontrolled: true 
        })
        .then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin)) {
                    if ('focus' in client) {
                        client.focus();
                    }
                    
                    if (targetUrl && client.url !== targetUrl) {
                        client.postMessage({
                            type: 'NAVIGATE_TO_URL',
                            url: targetUrl
                        });
                    }
                    return;
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(self.location.origin + targetUrl);
            }
        })
    );
});