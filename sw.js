const CACHE_NAME = 'tournepage-v1';

// Liste des ressources essentielles à mettre en cache dès l'installation
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // Mise en cache des librairies CDN utilisées dans ton HTML
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Installation : on met en cache les fichiers statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation : on nettoie les anciens caches s'il y a une mise à jour
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes : Stratégie "Cache First" (Cache d'abord, réseau ensuite)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Si la ressource est dans le cache, on la retourne
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Sinon, on fait la requête réseau
      return fetch(event.request).then(networkResponse => {
        // Mise en cache dynamique des polices Google Fonts si elles sont demandées
        if (event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Optionnel : Gérer ici le comportement si le réseau est coupé et que l'asset n'est pas en cache
      });
    })
  );
});
