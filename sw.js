/* 电子收纳 · Service Worker
   改代码后必须把下面的 CACHE 版本号 +1，否则已安装的用户拿不到更新。 */
const CACHE = 'digital-shelf-v1';

const ASSETS = [
  './app-prototype.html',
  './manifest.json',
  './fonts/zcoolkuaile.woff2',
  './fonts/kalam700.woff2',
  './fonts/patrickhand.woff2',
  './fonts/mashanzheng.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // 只管本站资源

  // 导航请求：优先用网络，断网回落到缓存的页面
  if (req.mode === 'navigate'){
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./app-prototype.html').then(r => r || caches.match(req)))
    );
    return;
  }

  // 静态资源：缓存优先，回落到网络并写入缓存
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic'){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
    })
  );
});
