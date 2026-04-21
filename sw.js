// Service worker. Three cache strategies:
//   - Shell (index.html, manifest, vendor/marked): cache-first, precached on install.
//   - Catalog data (catalog.json, metadata.json): network-first, cache fallback.
//   - Per-note sidecars + image assets: stale-while-revalidate on first fetch.
// Bump CACHE_VERSION whenever the shell changes.
const CACHE_VERSION = "en2karp-v4";
const SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./logo.png",
    "./vendor/marked.min.js",
];

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

function isCatalogData(pathname) {
    return pathname.endsWith("/catalog.json") || pathname.endsWith("/metadata.json");
}

function isLazyAsset(pathname) {
    // Per-note sidecars live under /notes/*.json; images under /assets/images/.
    return (
        /\/notes\/[^/]+\.json$/.test(pathname) ||
        /\/assets\/images\/[^/]+$/.test(pathname)
    );
}

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (isCatalogData(url.pathname)) {
        // Network-first for the top-level index — always try fresh.
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

    if (isLazyAsset(url.pathname)) {
        // Stale-while-revalidate: serve cache if present, refresh in background.
        event.respondWith(
            caches.open(CACHE_VERSION).then((cache) =>
                cache.match(event.request).then((cached) => {
                    const networkPromise = fetch(event.request)
                        .then((resp) => {
                            if (resp && resp.ok) cache.put(event.request, resp.clone());
                            return resp;
                        })
                        .catch(() => cached);
                    return cached || networkPromise;
                })
            )
        );
        return;
    }

    // Cache-first for the shell.
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
