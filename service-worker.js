const CACHE_NAME='soil-profile-field-notes-v8';
const ASSETS=['./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});

function patchApp(html){
  const oldFn="function normalizeColor(t){const numberWords={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/-/g,'/').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');const n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  const newFn="function normalizeColor(t){const numberWords={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/-/g,'/').replace(/[’']/g,'').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');let n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);if(!n){const compact=s.replace(/\\D/g,'');if(/^\\d{2}$/.test(compact))n=[compact,compact[0],compact[1]];}return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  html=html.replace(oldFn,newFn);

  const marker="const pad=n=>String(n).padStart(2,'0');";
  const textureHelper="const textureWetStick={'sand':['nonplastic','nonsticky'],'loamy sand':['nonplastic','nonsticky'],'sandy loam':['slightly plastic','slightly sticky'],'loam':['slightly plastic','slightly sticky'],'silt loam':['moderately plastic','moderately sticky'],'silt':['moderately plastic','moderately sticky'],'sandy clay loam':['moderately plastic','moderately sticky'],'clay loam':['very plastic','very sticky'],'silty clay loam':['very plastic','very sticky'],'sandy clay':['very plastic','very sticky'],'silty clay':['very plastic','very sticky'],'clay':['very plastic','very sticky']};function applyTextureDefaults(i,t){const texture=closest(t,vocab.texture);const pair=textureWetStick[texture];if(!pair||!state.horizons[i])return;const h=state.horizons[i];h.wetConsistence=pair[0];h.stickiness=pair[1];const wet=document.querySelector('[data-h=\"'+i+'\"][data-k=\"wetConsistence\"]');if(wet)wet.value=pair[0];const sticky=document.querySelector('[data-h=\"'+i+'\"][data-k=\"stickiness\"]');if(sticky)sticky.value=pair[1];}";
  if(!html.includes('const textureWetStick='))html=html.replace(marker,textureHelper+marker);

  html=html.replace("x.oninput=()=>{h[k]=x.value;save()};","x.oninput=()=>{h[k]=x.value;if(k==='texture')applyTextureDefaults(i,x.value);save()};");
  html=html.replace("if(q.scope==='detail')$(q.key).value=v;else state.horizons[q.i][q.key]=v;const e=elem(q);","if(q.scope==='detail')$(q.key).value=v;else{state.horizons[q.i][q.key]=v;if(q.key==='texture')applyTextureDefaults(q.i,v)}const e=elem(q);");

  html=html.replace('Build 2026-09-02 · Rock Size Voice Fix','Build 2026-09-02 · Texture Auto-Fill');
  html=html.replace('Build 2026-09-02 · Munsell Compact Voice Fix','Build 2026-09-02 · Texture Auto-Fill');
  html=html.replace('Build 2026-09-02 · Tract Parcel Lot Voice Fix','Build 2026-09-02 · Texture Auto-Fill');
  return html;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(async response=>{
      const html=patchApp(await response.text());
      const patched=new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8'}});
      const copy=patched.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));
      return patched;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(req).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));return response;}).catch(()=>caches.match(req)));
});