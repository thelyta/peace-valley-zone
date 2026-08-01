const SHELL_CACHE = "peace-valley-shell-v1";
const SHELL = ["/", "/offline/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Never cache API responses: they can contain authenticated resident, gate,
  // or visitor data and must not create an offline admission path.
  if (url.pathname.startsWith("/v1/") || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((hit) => hit || caches.match("/offline/")),
    ),
  );
});
