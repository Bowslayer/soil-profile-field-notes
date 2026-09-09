const CACHE_NAME='soil-profile-field-notes-v25';

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{
      const response=await fetch('./',{cache:'no-store'});
      if(response.ok){
        const html=patchApp(await response.text());
        await cache.put('./',new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8'}}));
        await cache.put('./index.html',new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8'}}));
      }
    }catch(e){}
    try{await cache.add('./manifest.webmanifest')}catch(e){}
    self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

function patchApp(html){
  html=html.replace('Build 2026-09-08 · Version 20','Build 2026-09-09 · Version 25');
  html=html.replace('Build 2026-09-08 · Version 21','Build 2026-09-09 · Version 25');
  html=html.replace('Build 2026-09-08 · Version 22','Build 2026-09-09 · Version 25');
  html=html.replace('Build 2026-09-08 · Version 23','Build 2026-09-09 · Version 25');
  html=html.replace('Build 2026-09-08 · Version 24','Build 2026-09-09 · Version 25');

  // Keep the current Subdivision Name wording while preserving the saved/report key.
  html=html.replace('<label>Location</label><input id="location">','<label>Subdivision Name</label><input id="location">');
  html=html.replace("['location','What is the test pit location?']","['location','What is the Subdivision Name?']");
  html=html.replace("location:'For example, Test Pit 1, north test pit, or replacement area test pit.'","location:'For example, Smith Subdivision, Mountain View Subdivision, or the subdivision name for this site.'");

  // Restore robust Munsell voice parsing. Android speech often hears "four two" as "for two".
  const oldColorFn="function normalizeColor(t){const numberWords={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/[’']/g,' ').replace(/-/g,'/').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');let n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/);if(!n){const compact=s.replace(/\\D/g,'');if(/^\\d{2}$/.test(compact))n=[compact,compact[0],compact[1]]}if(!n)n=s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  const newColorFn="function normalizeColor(t){const numberWords={zero:'0',oh:'0',one:'1',won:'1',two:'2',to:'2',too:'2',three:'3',tree:'3',four:'4',for:'4',fore:'4',five:'5',six:'6',seven:'7',eight:'8',ate:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/[’']/g,' ').replace(/-/g,'/').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');let n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/);if(!n){const compact=s.replace(/\\D/g,'');if(/^\\d{2}$/.test(compact))n=[compact,compact[0],compact[1]]}if(!n)n=s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  html=html.replace(oldColorFn,newColorFn);

  // Restore the lab-sample pending workflow from the earlier working version.
  html=html.replace('.active-field{outline:3px solid currentColor;outline-offset:2px}', '.active-field{outline:3px solid currentColor;outline-offset:2px}.sample-pending{background:#c8f7c5!important;border-color:#2e7d32!important}');
  html=html.replace("texture:'Options are sand, loamy sand, sandy loam, loam, silt loam, silt, sandy clay loam, clay loam, silty clay loam, sandy clay, silty clay, or clay.'", "texture:'Options are sand, loamy sand, sandy loam, loam, silt loam, silt, sandy clay loam, clay loam, silty clay loam, sandy clay, silty clay, clay, or say sample if a lab sample is needed.'");
  html=html.replace("if(key==='rockSize')return normalizeRockSize(t);if(key==='rootsNotes')return String(t).replace(/\\bmini\\b/gi,'many');if(vocab[key])return closest(t,vocab[key]);return t", "if(key==='rockSize')return normalizeRockSize(t);if(key==='rootsNotes')return String(t).replace(/\\bmini\\b/gi,'many');if(key==='texture'&&words(t)==='sample')return 'Sample';if(vocab[key])return closest(t,vocab[key]);return t");

  // Preserve texture-driven Wet Consistence and Stickiness, plus Sample pending behavior.
  const marker="const pad=n=>String(n).padStart(2,'0');";
  const textureHelper="const textureWetStick={'sand':['nonplastic','nonsticky'],'loamy sand':['nonplastic','nonsticky'],'sandy loam':['slightly plastic','slightly sticky'],'loam':['slightly plastic','slightly sticky'],'silt loam':['moderately plastic','moderately sticky'],'silt':['moderately plastic','moderately sticky'],'sandy clay loam':['moderately plastic','moderately sticky'],'clay loam':['very plastic','very sticky'],'silty clay loam':['very plastic','very sticky'],'sandy clay':['very plastic','very sticky'],'silty clay':['very plastic','very sticky'],'clay':['very plastic','very sticky']};function applyTextureDefaults(i,t){if(!state.horizons[i])return;const h=state.horizons[i];const texture=document.querySelector('[data-h=\"'+i+'\"][data-k=\"texture\"]');const wet=document.querySelector('[data-h=\"'+i+'\"][data-k=\"wetConsistence\"]');const sticky=document.querySelector('[data-h=\"'+i+'\"][data-k=\"stickiness\"]');const pending=words(t)==='sample';[texture,wet,sticky].forEach(e=>{if(e)e.classList.toggle('sample-pending',pending)});if(pending){h.wetConsistence='';h.stickiness='';if(wet)wet.value='';if(sticky)sticky.value='';return;}const tex=closest(t,vocab.texture);const pair=textureWetStick[tex];if(!pair)return;h.wetConsistence=pair[0];h.stickiness=pair[1];if(wet)wet.value=pair[0];if(sticky)sticky.value=pair[1];}";
  if(!html.includes('const textureWetStick=')) html=html.replace(marker,textureHelper+marker);
  html=html.replace("x.value=h[k]||'';x.oninput=()=>{h[k]=x.value;save()};", "x.value=h[k]||'';if((k==='texture'||k==='wetConsistence'||k==='stickiness')&&words(h.texture)==='sample')x.classList.add('sample-pending');x.oninput=()=>{h[k]=x.value;if(k==='texture')applyTextureDefaults(i,x.value);save()};");
  html=html.replace("x.oninput=()=>{h[k]=x.value;save()};","x.oninput=()=>{h[k]=x.value;if(k==='texture')applyTextureDefaults(i,x.value);save()};");
  html=html.replace("if(q.scope==='detail')$(q.key).value=v;else state.horizons[q.i][q.key]=v;const e=elem(q);","if(q.scope==='detail')$(q.key).value=v;else{state.horizons[q.i][q.key]=v;if(q.key==='texture')applyTextureDefaults(q.i,v)}const e=elem(q);");
  html=html.replace("const v=String(val(qs[i])||'').trim();if(!v||", "const v=String(val(qs[i])||'').trim();if((qs[i].key==='wetConsistence'||qs[i].key==='stickiness')&&words(state.horizons[qs[i].i]?.texture)==='sample')continue;if(!v||");

  // Preserve the multi-horizon depth entry behavior.
  const oldDepthFn="function setDepths(t){const n=(t.match(/\\d+(?:\\.\\d+)?/g)||[]);if(n.length<2){speak('Please say the horizon depths again.',()=>listen());return}const r=[];for(let i=0;i+1<n.length;i+=2)r.push([n[i],n[i+1]]);state.horizons=r.map(x=>blank({top:x[0],bottom:x[1]}));state.depthsSet=true;render();save();state.mode='depthConfirm';state.pending=r;speak(r.map(x=>x[0]+' to '+x[1]).join(', ')+'. Is that correct?',()=>setTimeout(listen,100))}";
  const newDepthFn="function setDepths(t){const raw=String(t||'').toLowerCase().replace(/inches?|inch|\\bin\\b/g,' ').replace(/through|thru|–|—|-/g,' to ');let r=[];const re=/(\\d+(?:\\.\\d+)?)\\s*(?:to)\\s*(\\d+(?:\\.\\d+)?)/g;let m;while((m=re.exec(raw)))r.push([m[1],m[2]]);if(!r.length){const n=(raw.match(/\\d+(?:\\.\\d+)?/g)||[]);if(n.length>=2){for(let i=0;i+1<n.length;i+=2)r.push([n[i],n[i+1]])}}if(!r.length){speak('Please say the horizon depths again. For example, 0 inches to 9 inches, 9 inches to 45 inches, 45 inches to 98 inches.',()=>listen());return}state.horizons=r.map(x=>blank({top:x[0],bottom:x[1]}));state.depthsSet=true;render();save();state.mode='depthConfirm';state.pending=r;speak(r.map(x=>x[0]+' to '+x[1]+' inches').join(', ')+'. Is that correct?',()=>setTimeout(listen,navigator.onLine?250:1200))}";
  html=html.replace(oldDepthFn,newDepthFn);
  const oldHandleStart="function handle(t){closeMic();const x=words(t);";
  const newHandleStart="function handle(t){closeMic();const x=words(t);const rangeCount=(String(t||'').match(/(?:\\d+(?:\\.\\d+)?)\\s*(?:inches?|inch|in)?\\s*(?:to|through|thru|[-–—])\\s*(?:\\d+(?:\\.\\d+)?)/gi)||[]).length;if(rangeCount>=2)return setDepths(t);";
  html=html.replace(oldHandleStart,newHandleStart);

  // Only speech timing change in Version 25: wait longer before reopening the mic while offline.
  html=html.replaceAll('setTimeout(listen,100)','setTimeout(listen,navigator.onLine?250:1200)');
  html=html.replaceAll('setTimeout(listen,250)','setTimeout(listen,navigator.onLine?250:1200)');
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
      caches.open(CACHE_NAME).then(cache=>{
        cache.put('./',copy.clone());
        cache.put('./index.html',copy);
      }).catch(()=>{});
      return patched;
    }).catch(async()=>{
      const cached=await caches.match(req);
      return cached||await caches.match('./')||await caches.match('./index.html');
    }));
    return;
  }
  event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
    if(response.ok&&new URL(req.url).origin===self.location.origin){
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)).catch(()=>{});
    }
    return response;
  }).catch(()=>caches.match(req)));
});
