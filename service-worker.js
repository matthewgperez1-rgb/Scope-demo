const CACHE='scope-mobile-v0.4.0-r1';
const CORE=['./','./index.html','./styles.css?v=0.4.0','./app.js?v=0.4.0','./console-ui.js?v=0.4.0','./manifest.webmanifest','./vendor/html5-qrcode.min.js?v=2.3.8','./scope-emblem-gold.png?v=0.4.0','./scope-icon-180.png?v=0.4.0','./scope-icon-192.png?v=0.4.0','./scope-icon-512.png?v=0.4.0'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  const isNavigation=event.request.mode==='navigate';
  const isAppAsset=url.origin===self.location.origin && (
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/styles.css') ||
    url.pathname.endsWith('/manifest.webmanifest') ||
    url.pathname.endsWith('/icon.svg') ||
    url.pathname.endsWith('/Scope-demo/') ||
    url.pathname.endsWith('/Scope-demo')
  );

  if(isNavigation || isAppAsset){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
          return response;
        })
        .catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      return response;
    }))
  );
});