const CACHE_NAME = 'controle-gastos-v4';

// ─── Push recebido do servidor (Web Push via Supabase Edge Function) ──────────
self.addEventListener('push', (event) => {
  let data = { title: 'Controle de Gastos', body: 'Você lembrou de anotar os seus gastos hoje?' };
  try {
    if (event.data) data = { ...data, ...JSON.parse(event.data.text()) };
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge.svg',
      vibrate: [200, 100, 200],
      tag: 'remind-gastos',
    })
  );
});

// Clique na notificação abre o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});

// ─── Install / Activate / Fetch (cache) ──────────────────────────────────────

self.addEventListener('install', (event) => {
  // Pré-cacheia o app shell para o app abrir sem internet
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;
  if (request.mode === 'navigate' || request.url.endsWith('.html')) {
    // Network-first; sucesso atualiza o cache do shell, falha cai no cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const toCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', toCache));
          }
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      }).catch(() => {});
    })
  );
});
