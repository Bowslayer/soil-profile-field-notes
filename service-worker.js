const CACHE_NAME='soil-profile-field-notes-v7';
const ASSETS=['./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});

function patchMunsell(html){
  const oldFn="function normalizeColor(t){const numberWords={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/-/g,'/').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');const n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  const newFn="function normalizeColor(t){const numberWords={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/-/g,'/').replace(/[’']/g,'').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');let n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);if(!n){const compact=s.replace(/\\D/g,'');if(/^\\d{2}$/.test(compact))n=[compact,compact[0],compact[1]];}return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  return html.replace(oldFn,newFn).replace('Build 2026-09-02 · Tract Parcel Lot Voice Fix','Build 2026-09-02 · Munsell Compact Voice Fix');
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(async response=>{
      const html=patchMunsell(await response.text());
      const patched=new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8'}});
      const copy=patched.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));
      return patched;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(req).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));return response;}).catch(()=>caches.match(req)));
});