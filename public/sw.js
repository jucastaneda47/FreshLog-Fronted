// Service worker de FreshLog.
// - Guarda la "cáscara" de la app para que abra rápido y se pueda instalar.
// - NUNCA guarda las respuestas de la API: los datos siempre vienen del servidor.
// Al cambiar la app, sube el número de VERSION para limpiar la caché vieja.
const VERSION = "freshlog-v1";
const BASICOS = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(BASICOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  const url = new URL(peticion.url);

  // Solo se gestionan peticiones GET al mismo sitio. La API (otro dominio) pasa directo.
  if (peticion.method !== "GET" || url.origin !== self.location.origin) return;

  // Páginas: primero la red (siempre la versión nueva); sin conexión, la copia guardada.
  if (peticion.mode === "navigate") {
    evento.respondWith(fetch(peticion).catch(() => caches.match("/")));
    return;
  }

  // Archivos de la app (JS, CSS, imágenes): copia guardada si existe; si no, red y se guarda.
  evento.respondWith(
    caches.match(peticion).then(
      (guardada) =>
        guardada ||
        fetch(peticion).then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(VERSION).then((cache) => cache.put(peticion, copia));
          }
          return respuesta;
        })
    )
  );
});
