// ===========================================================================
// MyTraining — Service Worker
// ===========================================================================
// Estrategia:
//   - Precache de assets estáticos (iconos, manifest, index.html)
//   - Cache-first para todo lo cacheable
//   - Network-only para Supabase (auth, DB)
//   - Network-only para métodos != GET
// ===========================================================================

const CACHE = 'mytraining-v2';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
];

// ---------------------------------------------------------------------------
// INSTALL — precachea los assets estáticos
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// ACTIVATE — limpia cachés antiguas
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// FETCH — cache-first con fallback a red
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo cacheamos GET
  if (request.method !== 'GET') return;

  // Nunca cacheamos Supabase ni Google Fonts (tienen su propio caching)
  const url = request.url;
  if (url.includes('supabase.co')) return;
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((res) => {
          // No cacheamos respuestas opacas o con error
          if (!res || res.status !== 200 || res.type === 'opaque') return res;

          const copy = res.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {
              /* Ignoramos errores de quota */
            });

          return res;
        })
        .catch(() => {
          // Si no hay red y no hay caché, intenta servir el index.html
          // para que la SPA al menos arranque (modo offline básico)
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // Sin red y sin fallback: promesa rechazada -> el navegador
          // muestra el error nativo, que es lo correcto aquí
          return Promise.reject(new Error('Sin conexión'));
        });
    }),
  );
});