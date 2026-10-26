/* 极简 · Service Worker
   每次部署都要把 CACHE 里的版本号 +1，否则手机上拿不到新代码。

   ★ 注意：这个 app 有两个 HTML —— index.html 和 app-prototype.html，内容完全一样。
     manifest 的 start_url 指向 app-prototype.html（桌面图标打开的是它），
     index.html 只服务目录网址 /digital-shelf/。
     所以每次部署必须把两个都推上去，少推一个就会出现「桌面图标还是旧版」。 */
const CACHE = 'digital-shelf-v51';

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

// 预缓存用 cache:'reload' 绕过 HTTP 缓存（GitHub Pages 有 max-age=600，
// 直接 fetch 可能拿到旧文件）。任何单个资源失败都不该让整个安装失败。
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
  if (url.origin !== location.origin) return;   // 外部请求（字体 CDN 等）直接放行

  // 页面导航：网络优先，成功就顺手更新缓存；断网时退回缓存
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

  // 静态资源：缓存优先，未命中再走网络并写回缓存
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
