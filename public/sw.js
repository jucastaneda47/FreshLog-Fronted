// Service worker de FreshLog.
// - Guarda la "cáscara" de la app (HTML, JS, CSS, imágenes) para que abra aunque NO haya internet.
// - NUNCA guarda las respuestas de la API (otro dominio): los datos sin conexión los guarda la propia
//   app en IndexedDB, separados por usuario, y se borran al cerrar sesión.
// Al cambiar la app, sube el número de VERSION para limpiar la caché vieja.
const VERSION = "freshlog-v2";
const BASICOS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/logo-alacena.png",
  "/fondo-auth.jpg",
  "/favicon.svg",
];
const ESPERA_RED_MS = 3500; // si la red tarda más que esto al abrir la app, se usa la copia guardada

// Archivos que el HTML necesita (JS y CSS con nombre único generado en cada compilación)
function archivosDelHtml(html) {
  const encontrados = new Set();
  const patron = /(?:src|href)=["'](\/assets\/[^"']+)["']/g;
  let m;
  while ((m = patron.exec(html)) !== null) encontrados.add(m[1]);
  return [...encontrados];
}

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      // La página principal y todo lo que usa quedan guardados desde la instalación
      const respuesta = await fetch("/", { cache: "reload" });
      const html = await respuesta.clone().text();
      await cache.put("/", respuesta);
      await cache.addAll([...archivosDelHtml(html), ...BASICOS]);
      await self.skipWaiting();
    })()
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

function conTiempo(direccion, ms) {
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), ms);
  return fetch(direccion, { signal: control.signal }).finally(() => clearTimeout(t));
}

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  const url = new URL(peticion.url);

  // Solo se gestionan peticiones GET al mismo sitio. La API (otro dominio) pasa directo.
  if (peticion.method !== "GET" || url.origin !== self.location.origin) return;

  // Páginas: primero la red (siempre la versión nueva); sin conexión o muy lenta, la copia guardada.
  if (peticion.mode === "navigate") {
    evento.respondWith(
      (async () => {
        try {
          const respuesta = await conTiempo(peticion.url, ESPERA_RED_MS);
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(VERSION).then((cache) => cache.put("/", copia));
          }
          return respuesta;
        } catch {
          return (await caches.match("/")) || Response.error();
        }
      })()
    );
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
