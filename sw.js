// Service worker: cache-first for the shell, network-first for catalog data.
// Bump CACHE_VERSION whenever index.html or manifest.json changes.
const CACHE_VERSION = "en2karp-v1";
const SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    const isData = url.pathname.endsWith("/catalog.json") || url.pathname.endsWith("/metadata.json");

    if (isData) {
        // Network-first: always try fresh data, fall back to cache offline.
        event.respondWith(
            fetch(event.request)
                .then((resp) => {
                    const copy = resp.clone();
                    caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy));
                    return resp;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for the shell.
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
