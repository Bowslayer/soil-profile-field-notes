const CACHE_NAME='soil-profile-field-notes-v9';
const ASSETS=['./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});

function patchApp(html){
  const oldFn="function normalizeColor(t){const numberWords={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/-/g,'/').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');const n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  const newFn="function normalizeColor(t){const numberWords={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/-/g,'/').replace(/[’']/g,'').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');let n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);if(!n){const compact=s.replace(/\\D/g,'');if(/^\\d{2}$/.test(compact))n=[compact,compact[0],compact[1]];}return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  html=html.replace(oldFn,newFn);

  html=html.replace('.active-field{outline:3px solid currentColor;outline-offset:2px}', '.active-field{outline:3px solid currentColor;outline-offset:2px}.sample-pending{background:#c8f7c5!important;border-color:#2e7d32!important}');
  html=html.replace("texture:'Options are sand, loamy sand, sandy loam, loam, silt loam, silt, sandy clay loam, clay loam, silty clay loam, sandy clay, silty clay, or clay.'", "texture:'Options are sand, loamy sand, sandy loam, loam, silt loam, silt, sandy clay loam, clay loam, silty clay loam, sandy clay, silty clay, clay, or say sample if a lab sample is needed.'");
  html=html.replace("rockSize:'Just say the number of inches. For example, say 5 and I will enter up to 5 in, or say 10 and I will enter up to 10 in.'", "rockSize:'Just say the number of inches. For example, say 5 and I will enter up to 5 inches, or say 10 and I will enter up to 10 inches.'");
  html=html.replace("return n?`up to ${n} in`:t", "return n?`up to ${n} inches`:t");
  html=html.replace("if(key==='rockSize')return normalizeRockSize(t);if(vocab[key])return closest(t,vocab[key]);return t", "if(key==='rockSize')return normalizeRockSize(t);if(key==='rootsNotes')return String(t).replace(/\\bmini\\b/gi,'many');if(key==='texture'&&words(t)==='sample')return 'Sample';if(vocab[key])return closest(t,vocab[key]);return t");

  const marker="const pad=n=>String(n).padStart(2,'0');";
  const textureHelper="const textureWetStick={'sand':['nonplastic','nonsticky'],'loamy sand':['nonplastic','nonsticky'],'sandy loam':['slightly plastic','slightly sticky'],'loam':['slightly plastic','slightly sticky'],'silt loam':['moderately plastic','moderately sticky'],'silt':['moderately plastic','moderately sticky'],'sandy clay loam':['moderately plastic','moderately sticky'],'clay loam':['very plastic','very sticky'],'silty clay loam':['very plastic','very sticky'],'sandy clay':['very plastic','very sticky'],'silty clay':['very plastic','very sticky'],'clay':['very plastic','very sticky']};function applyTextureDefaults(i,t){if(!state.horizons[i])return;const h=state.horizons[i];const wet=document.querySelector('[data-h=\"'+i+'\"][data-k=\"wetConsistence\"]');const sticky=document.querySelector('[data-h=\"'+i+'\"][data-k=\"stickiness\"]');if(words(t)==='sample'){h.wetConsistence='';h.stickiness='';if(wet)wet.value='';if(sticky)sticky.value='';return;}const texture=closest(t,vocab.texture);const pair=textureWetStick[texture];if(!pair)return;h.wetConsistence=pair[0];h.stickiness=pair[1];if(wet)wet.value=pair[0];if(sticky)sticky.value=pair[1];}";
  if(!html.includes('const textureWetStick='))html=html.replace(marker,textureHelper+marker);

  html=html.replace("x.value=h[k]||'';x.oninput=()=>{h[k]=x.value;save()};", "x.value=h[k]||'';if(k==='texture'&&words(x.value)==='sample')x.classList.add('sample-pending');x.oninput=()=>{h[k]=x.value;if(k==='texture'){applyTextureDefaults(i,x.value);x.classList.toggle('sample-pending',words(x.value)==='sample')}save()};");
  html=html.replace("if(q.scope==='detail')$(q.key).value=v;else state.horizons[q.i][q.key]=v;const e=elem(q);", "if(q.scope==='detail')$(q.key).value=v;else{state.horizons[q.i][q.key]=v;if(q.key==='texture')applyTextureDefaults(q.i,v)}const e=elem(q);if(e&&q.key==='texture')e.classList.toggle('sample-pending',words(v)==='sample');");
  html=html.replace("const v=String(val(qs[i])||'').trim();if(!v||", "const v=String(val(qs[i])||'').trim();if((qs[i].key==='wetConsistence'||qs[i].key==='stickiness')&&words(state.horizons[qs[i].i]?.texture)==='sample')continue;if(!v||");

  html=html.replace('Build 2026-09-02 · Rock Size Voice Fix','Build 2026-09-02 · Lab Sample + Voice Fixes');
  html=html.replace('Build 2026-09-02 · Texture Auto-Fill','Build 2026-09-02 · Lab Sample + Voice Fixes');
  html=html.replace('Build 2026-09-02 · Munsell Compact Voice Fix','Build 2026-09-02 · Lab Sample + Voice Fixes');
  html=html.replace('Build 2026-09-02 · Tract Parcel Lot Voice Fix','Build 2026-09-02 · Lab Sample + Voice Fixes');
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