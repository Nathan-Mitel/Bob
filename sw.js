/* Service worker de « Bob le calculateur »
   Rôle : mettre l'app en cache pour qu'elle fonctionne HORS LIGNE
   une fois chargée une première fois (utile en mobilité).
   Pour forcer une mise à jour après modification de l'app :
   incrémenter le numéro de version ci-dessous (bob-v1 → bob-v2). */
const CACHE = 'bob-v2'; // v2 : nouvelles icônes orange

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

/* installation : on met la coquille de l'app en cache */
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

/* activation : on purge les anciens caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* requêtes :
   — pages HTML : RÉSEAU d'abord (pour recevoir les mises à jour de l'app),
     cache en secours quand on est hors ligne ;
   — le reste (icônes, polices…) : cache d'abord, réseau sinon.          */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // navigation (ouverture de l'app) → réseau d'abord
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // ressources → cache d'abord
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit ||
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
    )
  );
});
