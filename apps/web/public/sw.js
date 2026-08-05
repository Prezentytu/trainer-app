/* Workout Alchemist — portal client SW (push + app shell). */
const CACHE_VERSION = "wa-portal-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = "/portal/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(async (cache) => {
        const urls = [OFFLINE_URL, "/icons/192", "/icons/180"];
        await Promise.all(
          urls.map((url) =>
            cache.add(url).catch(() => {
              /* nie blokuj instalacji SW przy pudle jednego assetu */
            }),
          ),
        );
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("wa-portal-") && !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

function isPortalNavigation(request, url) {
  return (
    request.mode === "navigate" &&
    sameOrigin(url) &&
    (url.pathname === "/portal" || url.pathname.startsWith("/portal/"))
  );
}

function isStaticAsset(url) {
  return (
    sameOrigin(url) &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/splash/") ||
      url.pathname === "/icon.svg")
  );
}

function isPortalApiGet(request, url) {
  if (request.method !== "GET") return false;
  // API może być na innym origin (NEXT_PUBLIC_API_URL)
  return url.pathname.includes("/api/portal/");
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        void cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || (await networkPromise);
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    void cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      void cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("offline");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (isPortalNavigation(request, url)) {
    event.respondWith(
      (async () => {
        try {
          const response = await staleWhileRevalidate(request, RUNTIME_CACHE);
          if (response) return response;
        } catch {
          /* fall through */
        }
        const cache = await caches.open(SHELL_CACHE);
        const offline = await cache.match(OFFLINE_URL);
        return offline || Response.error();
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isPortalApiGet(request, url)) {
    event.respondWith(
      networkFirst(request).catch(async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        return cached || Response.error();
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Workout Alchemist";
  const options = {
    body: data.body || "Masz nowe przypomnienie od trenera.",
    data: { url: data.url || "/" },
    tag: data.tag || "wa-push",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.includes(target.split("?")[0])) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
