const CACHE_NAME = "jeunes-explorateurs-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./inscription.html",
  "./assets/css/styles.css",
  "./assets/css/theme.css",
  "./assets/js/theme.js",
  "./assets/css/logo.css",
  "./assets/css/navigation.css",
  "./assets/css/mobile-menu.css",
  "./assets/js/mobile-menu.js",
  "./assets/css/page-transitions.css",
  "./assets/js/page-transitions.js",
  "./assets/css/contact.css",
  "./assets/css/privacy.css",
  "./assets/css/hero-photo.css",
  "./assets/css/activity-registration.css",
  "./assets/css/registration.css",
  "./assets/css/access-to-leisure.css",
  "./assets/css/cookie.css",
  "./assets/js/app.js",
  "./assets/js/registration.js",
  "./assets/js/cookie.js",
  "./assets/js/supabase-config.js",
  "./assets/js/stripe-config.js",
  "./assets/images/logo-petits-explorateurs-512.png",
  "./assets/images/sortie-musee-enfants.jpg"
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
