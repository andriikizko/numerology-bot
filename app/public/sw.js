// v2: network-first для HTML (щоб ніколи не залипати на старому білді),
// cache-first для хешованих статичних файлів (їх вміст незмінний для даного імені).
const CACHE_NAME = "numerology-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // API-запити ніколи не кешуємо
  if (request.url.includes("cloudfunctions.net")) {
    return;
  }

  const isNavigation =
    request.mode === "navigate" ||
    (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));

  if (isNavigation) {
    // Network-first: завжди тягнемо свіжий index.html, щоб він вказував
    // на актуальні хешовані JS/CSS файли поточного білда.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Статичні хешовані файли (JS/CSS/зображення): cache-first, бо ім'я файлу
  // унікальне для кожного вмісту і ніколи не перевикористовується повторно.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
