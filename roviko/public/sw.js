const CACHE='roviko-shell-v1.54.0';
// 1.54: flags, illustrations, fonts and shapes keep their own cache across updates (they used to be thrown away and
// downloaded again with every new version). Shown from the cache at once and refreshed in the background.
const MEDIA='roviko-media-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/offline.html','/favicon.png'])));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==MEDIA).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||u.pathname.startsWith('/api/')||e.request.method!=='GET')return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/offline.html')));return;}
if(/^\/(flags|art|fonts|shapes)\//.test(u.pathname)||u.pathname==='/globe-logo.webp'){e.respondWith(caches.open(MEDIA).then(cache=>cache.match(e.request).then(r=>{const fresh=fetch(e.request).then(res=>{if(res.ok)cache.put(e.request,res.clone());return res;});if(r){e.waitUntil(fresh.catch(()=>{}));return r;}return fresh;})));return;}
if(/^\/(data|assets|_next)\//.test(u.pathname)){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c));}return res;})));}});
