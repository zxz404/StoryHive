const CACHE_NAME = 'storyhive-pwa-v6';
const API_CACHE_NAME = 'storyhive-api-v2';

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/src/index.html',
  './index.html',
  './src/index.html',
  '/styles/styles.css',
  '/src/styles/styles.css',
  './styles/styles.css',
  '/scripts/pages/app.js',
  '/src/scripts/pages/app.js',
  './scripts/pages/app.js',
  '/images/Logo.png',
  '/src/public/images/Logo.png',
  './images/Logo.png',
  '/images/Logo2.png',
  '/src/public/images/Logo2.png', 
  './images/Logo2.png',
  '/images/Logo3.png',
  '/src/public/images/Logo3.png',
  './images/Logo3.png',
  '/manifest.json',
  '/public/manifest.json',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_SHELL_URLS).catch(error => {
          console.log('Failed to cache:', error);
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

  if (url.hostname === 'story-api.dicoding.dev') {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(handleAppRequest(request));
    return;
  }
});

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
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

async function handleAppRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);

  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    if (request.destination === 'document' || url.pathname === '/') {
      const indexResponse = await cache.match('/index.html');
      if (indexResponse) return indexResponse;
    }

    if (url.pathname.includes('.png') || url.pathname.includes('.jpg')) {
      return new Response('', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return new Response('', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
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
    badge: '/images/favicon.png'
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
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin);
      }
    })
  );
});