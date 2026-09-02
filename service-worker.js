const CACHE_NAME='soil-profile-field-notes-v5';
const ASSETS=['./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));return response;}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(req).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));return response;}).catch(()=>caches.match(req)));
});