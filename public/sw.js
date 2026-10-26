const CACHE = "apblitz-offline-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/offline.html", "/logo-ap-blitz.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Navigations are left to the browser. Wrapping them here waits for the full
// server render and leaves the screen black until every database call finishes.

self.addEventListener("push", (event) => {
  let data = { title: "AP Blitz", body: "Something new is waiting.", href: "/" };
  try {
    data = { ...data, ...(event.data ? event.data.json() : {}) };
  } catch {
    data.body = event.data ? event.data.text() : data.body;
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo-ap-blitz.png",
      badge: "/logo-ap-blitz.png",
      data: { href: data.href || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/";
  event.waitUntil(self.clients.openWindow(href));
});
