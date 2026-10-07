const CACHE_PREFIX = "coamo-totem-";
const CACHE_NAME = "coamo-totem-v55";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// V55 intentionally does NOT intercept fetch/navigation.
// All game links go directly to their own HTML files, so an old offline
// fallback can no longer send the visitor to index.html/presentation mode.
