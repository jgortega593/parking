const CACHE_NAME = 'parqueadero-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Agrega aquí los archivos importantes de tu app
];

// Guardar archivos al instalar
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Servir archivos desde el caché cuando no hay internet
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
