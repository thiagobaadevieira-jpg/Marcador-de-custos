const CACHE_NAME = 'controle-gastos-v2';

// ─── Notification Scheduler ───────────────────────────────────────────────────
let notifTimer = null;
let notifConfig = {
  time: null,
  title: 'Controle de Gastos',
  body: 'Você lembrou de anotar os seus gastos hoje?',
};

function scheduleNextNotification() {
  if (notifTimer) clearTimeout(notifTimer);
  if (!notifConfig.time) return;

  const [hours, minutes] = notifConfig.time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // Se o horário de hoje já passou, agenda para amanhã
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  notifTimer = setTimeout(() => {
    self.registration.showNotification(notifConfig.title, {
      body: notifConfig.body,
      icon: '/icon-192.png',
      badge: '/badge.svg',
      vibrate: [200, 100, 200],
      tag: 'remind-gastos',
    });
    // Agenda automaticamente para o dia seguinte
    scheduleNextNotification();
  }, delay);
}

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    notifConfig = {
      time: event.data.time,
      title: event.data.title || 'Controle de Gastos',
      body: event.data.body || 'Você lembrou de anotar os seus gastos hoje?',
    };
    scheduleNextNotification();
  }

  if (event.data.type === 'CANCEL_NOTIFICATION') {
    if (notifTimer) clearTimeout(notifTimer);
    notifTimer = null;
    notifConfig.time = null;
  }
});

// ─── Install / Activate / Fetch (cache) ──────────────────────────────────────

self.addEventListener('install', () => {
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
    event.respondWith(fetch(request).catch(() => caches.match('/')));
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
