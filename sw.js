self.addEventListener('install', e => {
 e.waitUntil(
    caches.open('dev-to-reader').then(cache => {
        return cache.addAll([
            '/',
            'dev.to/',
            'res.cloudinary.com/'
        ])
            .then(() => self.skipWaiting());
    })
  )
});

self.addEventListener('activate', event => {
 event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
        return response || fetch(event.request);
    })
  );
});
