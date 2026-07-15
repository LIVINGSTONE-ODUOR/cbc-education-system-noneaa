// NONEAA service worker — enables offline access to the app shell and to
// the student's timetable data. Personal notes (Digital Notebook) already
// live entirely in localStorage, so they're offline-available with zero
// extra work here; this file's job is the app shell + network data.
//
// Strategy:
//  - Navigations (page loads):        network-first, falling back to the
//                                      cached shell when offline.
//  - Timetable API GET requests:      network-first, cached for offline
//                                      viewing once fetched successfully.
//  - Other same-origin static assets: cache-first, filled in as they're
//                                      requested (no build-time asset list
//                                      needed since Vite hashes filenames).

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `cbe-shell-${CACHE_VERSION}`;
const API_CACHE = `cbe-api-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, API_CACHE];

// Any GET request whose path includes one of these is cached for offline
// use. Currently just the timetable endpoints (used by both the student
// portal directly and the shared Parent-Portal Timetable component the
// student portal reuses).
const OFFLINE_API_PATTERNS = ['/timetable'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(['/', '/index.html', '/manifest.webmanifest']).catch(() => {
      // Best-effort — if the app shell isn't reachable at install time
      // (e.g. built offline in CI), runtime caching will fill it in on
      // the first successful online visit instead.
    }))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => !CURRENT_CACHES.includes(name)).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

const networkFirst = async (request, cacheName, fallbackUrl) => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = (await cache.match(request)) || (fallbackUrl ? await cache.match(fallbackUrl) : undefined);
    if (cached) return cached;
    throw err;
  }
};

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // Never cache writes — leave POST/PUT/DELETE to the network as-is.

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  const isOfflineApi = OFFLINE_API_PATTERNS.some((pattern) => url.pathname.includes(pattern));
  if (isOfflineApi) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE, '/index.html'));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
  }
});
