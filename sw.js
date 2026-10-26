// Service worker de BodyMap Rehab: guarda la app para abrirla sin conexión.
// Los vídeos (YouTube, Vimeo) siempre necesitan red y no se guardan.
const CACHE = "bodymap-v6";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "data.js",
  "manifest.webmanifest",
  "fonts/atkinson-hyperlegible-next-latin.woff2",
  "fonts/barlow-condensed-700-latin.woff2",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "anatomy-viewer.js",
  "anatomy-data.js",
  "vendor/three.module.min.js",
  "vendor/OrbitControls.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Se sirve lo guardado al momento y se actualiza en segundo plano,
// así un cambio en data.js aparece la siguiente vez que se abre la app.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached || (request.mode === "navigate" ? cache.match("index.html") : Response.error()));
      return cached || network;
    })
  );
});
