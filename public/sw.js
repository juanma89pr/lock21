// Service worker mínimo para que la app sea instalable y abra sin conexión.
// Estrategia: red primero para todo; si no hay red, la copia guardada.
// Nunca guarda llamadas a funciones ni a Firebase.
var CACHE = 'lock21-v1';

self.addEventListener('install', function (evento) {
  evento.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['/app', '/manifest.webmanifest', '/favicon.svg']); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (evento) {
  var url = new URL(evento.request.url);
  if (evento.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.indexOf('/.netlify/') === 0) { return; }
  evento.respondWith(fetch(evento.request).then(function (res) {
    if (res.ok) {
      var copia = res.clone();
      caches.open(CACHE).then(function (c) { c.put(evento.request, copia); });
    }
    return res;
  }).catch(function () {
    return caches.match(evento.request).then(function (r) {
      return r || (evento.request.mode === 'navigate' ? caches.match('/app') : Response.error());
    });
  }));
});
