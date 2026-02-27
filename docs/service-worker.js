// 陶然小灶点餐系统 - Service Worker
// 提供离线缓存和加速加载

const CACHE_NAME = 'trxa-v8';
const urlsToCache = [
  '/trxa/',
  '/trxa/index.html',
  '/trxa/manifest.json',
  '/trxa/icon-192.png',
  '/trxa/icon-512.png',
  '/trxa/icon-maskable-192.png',
  '/trxa/icon-maskable-512.png'
];

// 安装阶段：缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: 缓存核心文件');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // 立即激活新的 Service Worker
        return self.skipWaiting();
      })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 清理旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即接管所有客户端
      return self.clients.claim();
    })
  );
});

// 拦截请求：优先用缓存，离线也能打开
self.addEventListener('fetch', event => {
  // 忽略 IndexedDB 相关请求（避免缓存数据库操作）
  if (event.request.url.includes('indexeddb') || event.request.url.includes('chrome-extension')) {
    return fetch(event.request).catch(() => new Response('', { status: 204 }));
  }

  // 本地文件优先用缓存
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，直接返回
        if (response) {
          return response;
        }
        // 否则去网络请求
        return fetch(event.request)
          .then(networkResponse => {
            // 只缓存成功的 GET 请求
            if (networkResponse.status === 200 && event.request.method === 'GET') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // 网络失败时，尝试返回离线页面
            return caches.match('/trxa/index.html');
          });
      })
  );
});

// 处理消息（用于更新提示）
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
