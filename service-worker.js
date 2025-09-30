// 캐시 이름
const CACHE_NAME = 'cache-v1';

// 캐싱할 파일
const FILES_TO_CACHE = [
  './assets/favicon/apple-touch-icon.png',
  './assets/favicon/android-chrome-192x192.png',
  './assets/favicon/android-chrome-512x512.png',
  './assets/favicon/favicon-32x32.png',
  './assets/favicon/favicon-16x16.png',
];

// 상술한 파일 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          FILES_TO_CACHE.map(file => {
            return cache.add(file).catch(error => {
              console.error(`Failed to cache ${file}:`, error);
              // 개별 파일 캐시 실패를 무시하고 계속 진행
              return Promise.resolve();
            });
          })
        );
      })
  );
});

// CACHE_NAME이 변경되면 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (CACHE_NAME !== key) return caches.delete(key);
        }),
      ),
    ),
  );
});

//fetch : web resource에 접근하기 위해 행해지는 모든 resquest action
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // First, try to use the navigation preload response if it's supported.
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }

        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        console.log('Fetch failed; returning offline page instead.', error);

        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        return cachedResponse || new Response('오프라인 상태입니다.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain;charset=UTF-8'
          })
        });
      }
    })());
  }
});
