const CACHE_NAME='soil-profile-field-notes-v17';

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

function patchTextureAutofill(html){
  const marker="const pad=n=>String(n).padStart(2,'0');";
  const helper="const textureWetStick={'sand':['nonplastic','nonsticky'],'loamy sand':['nonplastic','nonsticky'],'sandy loam':['slightly plastic','slightly sticky'],'loam':['slightly plastic','slightly sticky'],'silt loam':['moderately plastic','moderately sticky'],'silt':['moderately plastic','moderately sticky'],'sandy clay loam':['moderately plastic','moderately sticky'],'clay loam':['very plastic','very sticky'],'silty clay loam':['very plastic','very sticky'],'sandy clay':['very plastic','very sticky'],'silty clay':['very plastic','very sticky'],'clay':['very plastic','very sticky']};function applyTextureDefaults(i,t){const texture=closest(t,vocab.texture);const pair=textureWetStick[texture];if(!pair||!state.horizons[i])return;const h=state.horizons[i];h.wetConsistence=pair[0];h.stickiness=pair[1];const wet=document.querySelector('[data-h=\"'+i+'\"][data-k=\"wetConsistence\"]');if(wet)wet.value=pair[0];const sticky=document.querySelector('[data-h=\"'+i+'\"][data-k=\"stickiness\"]');if(sticky)sticky.value=pair[1];}";

  if(!html.includes('const textureWetStick=')) html=html.replace(marker,helper+marker);

  html=html.replace(
    "x.oninput=()=>{h[k]=x.value;save()};",
    "x.oninput=()=>{h[k]=x.value;if(k==='texture')applyTextureDefaults(i,x.value);save()};"
  );

  html=html.replace(
    "if(q.scope==='detail')$(q.key).value=v;else state.horizons[q.i][q.key]=v;const e=elem(q);",
    "if(q.scope==='detail')$(q.key).value=v;else{state.horizons[q.i][q.key]=v;if(q.key==='texture')applyTextureDefaults(q.i,v)}const e=elem(q);"
  );

  return html;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(async response=>{
      const html=patchTextureAutofill(await response.text());
      return new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8'}});
    }).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
});
