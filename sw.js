/*
@title        Plantdex - service worker
@version      0.1.1
@author       La Gia Huy
@since        2026-11-16
@updated      2026-11-16
@engine       JavaScript (Service Worker)
@target       Plantdex web app served over https
@about        Offline support for the app shell. Network first, cache fallback, so edits
              to data.js show up on the next online visit. LEGO images are cross-origin
              and are left to the browser's normal cache.
@changelog    0.1.1  Revalidate with the server on every fetch (cache: "no-cache"), so GitHub
                     Pages' 10-minute max-age doesn't hide a new version.
              0.1.0  First version.
*/
var SHELL = "plantdex-shell-v2";
var FILES = ["./", "index.html", "app.js", "app.css", "data.js", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-180.png", "icons/icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== SHELL; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(SHELL).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () { return caches.match(req, { ignoreSearch: true }); }));
});
