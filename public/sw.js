/* VV service worker — minimal, installability + a safe offline fallback only.
 * Deliberately NOT an aggressive offline cache: every request goes to the
 * network first so users never see stale content. The cache is a fallback that
 * only kicks in when the network is unavailable, and it never touches API,
 * auth, or dashboard responses (which are private / must always be fresh). */
const CACHE = 'vv-shell-v3';
const SHELL = ['/'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept private / always-fresh routes — let them hit the network
  // directly with no caching.
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/auth')
  ) {
    return;
  }

  // Network-first. Fresh response wins and, for page navigations, seeds the
  // cache so an offline reload still renders the shell.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200 && request.mode === 'navigate') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/'))
      )
  );
});
