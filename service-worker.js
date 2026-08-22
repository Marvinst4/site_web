const CACHE_NAME = "jeunes-explorateurs-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./theme.css",
  "./theme.js",
  "./logo.css",
  "./navigation.css",
  "./mobile-menu.css",
  "./mobile-menu.js",
  "./page-transitions.css",
  "./page-transitions.js",
  "./contact.css",
  "./privacy.css",
  "./hero-photo.css",
  "./activity-registration.css",
  "./access-to-leisure.css",
  "./app.js",
  "./cookie.js",
  "./supabase-config.js",
  "./stripe-config.js",
  "./images/logo-petits-explorateurs.png",
  "./images/sortie-musee-enfants.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(caches.match(request).then(cached => {
    const fresh = fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => cached || (request.mode === "navigate" ? caches.match("./index.html") : undefined));
    return cached || fresh;
  }));
});
