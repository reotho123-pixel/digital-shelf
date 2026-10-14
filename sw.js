/* 电子收纳 · Service Worker
   改代码后必须把下面的 CACHE 版本号 +1，否则已安装的用户拿不到更新。

   注意：入口文件是 index.html（不是 app-prototype.html）——
   两者内容相同，index.html 是访问 /digital-shelf/ 时实际加载的那个。
   预缓存和离线回落都必须指向 index.html，否则断网时打不开。 */
const CACHE = 'digital-shelf-v18';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './fonts/zcoolkuaile.woff2',
  './fonts/kalam700.woff2',
  './fonts/patrickhand.woff2',
  './fonts/mashanzheng.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// 版本变化时重新预缓存。用 cache:'reload' 绕开浏览器自己的 HTTP 缓存 ——
// GitHub Pages 给静态资源发了 max-age=600，不绕开的话装上的还是旧文件。
// 串行抓取：并发十几个请求在弱网下容易整批失败，而这里总共也就几十KB。
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      ASSETS.reduce((chain, url) =>
        chain.then(() => fetch(url, { cache: 'reload' }).then(res => {
          if (res && res.ok) return c.put(url, res);
        }).catch(() => {})), Promise.resolve())
    ).then(() => self.skipWaiting())
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
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match(req)))
    );
    return;
  }

  // 静态资源：缓存优先，回落到网络并写入缓存
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
    })
  );
});
