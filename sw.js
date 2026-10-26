// Service worker de BodyMap Rehab: guarda la app para abrirla sin conexión.
// Los vídeos (YouTube, Vimeo) siempre necesitan red y no se guardan.
const CACHE = "bodymap-v8";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "data.js",
  "manifest.webmanifest",
  "fonts/atkinson-hyperlegible-next-latin.woff2",
  "fonts/barlow-condensed-700-latin.woff2",
  "icons/favicon-48.png",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "anatomy-viewer.js",
  "anatomy-data.js",
  "vendor/three.module.min.js",
  "vendor/OrbitControls.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter((k) => k !== CACHE);
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.clients.claim();
    // Había una versión anterior: la página abierta sigue con los archivos viejos.
    if (old.length) notifyUpdate();
  })());
});

async function notifyUpdate() {
  for (const client of await self.clients.matchAll({ type: "window" })) {
    client.postMessage({ type: "update-ready" });
  }
}

// GitHub Pages manda ETag y Last-Modified; si no hay ninguno no se avisa.
function changed(cached, fresh) {
  const tag = (r) => (r.headers.get("etag") || r.headers.get("last-modified") || "").replace(/^W\//, "");
  return Boolean(tag(cached) && tag(fresh) && tag(cached) !== tag(fresh));
}

// "Reload" pide descargar toda la app antes de recargar, para no mezclar versiones.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "refresh") return;
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: "reload" }))))
      .catch(() => {})
      .then(() => event.source?.postMessage({ type: "refreshed" }))
  );
});

// Se sirve lo guardado al momento y se actualiza en segundo plano.
// Si un archivo cambió, la página muestra el aviso de nueva versión.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            if (cached && changed(cached, response)) notifyUpdate();
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached || (request.mode === "navigate" ? cache.match("index.html") : Response.error()));
      return cached || network;
    })
  );
});
