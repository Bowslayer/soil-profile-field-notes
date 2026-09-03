const CACHE_NAME='soil-profile-field-notes-v18';

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

function patchApp(html){
  // Preserve the full texture -> wet consistence / stickiness auto-fill table.
  const marker="const pad=n=>String(n).padStart(2,'0');";
  const textureHelper="const textureWetStick={'sand':['nonplastic','nonsticky'],'loamy sand':['nonplastic','nonsticky'],'sandy loam':['slightly plastic','slightly sticky'],'loam':['slightly plastic','slightly sticky'],'silt loam':['moderately plastic','moderately sticky'],'silt':['moderately plastic','moderately sticky'],'sandy clay loam':['moderately plastic','moderately sticky'],'clay loam':['very plastic','very sticky'],'silty clay loam':['very plastic','very sticky'],'sandy clay':['very plastic','very sticky'],'silty clay':['very plastic','very sticky'],'clay':['very plastic','very sticky']};function applyTextureDefaults(i,t){const texture=closest(t,vocab.texture);const pair=textureWetStick[texture];if(!pair||!state.horizons[i])return;const h=state.horizons[i];h.wetConsistence=pair[0];h.stickiness=pair[1];const wet=document.querySelector('[data-h=\"'+i+'\"][data-k=\"wetConsistence\"]');if(wet)wet.value=pair[0];const sticky=document.querySelector('[data-h=\"'+i+'\"][data-k=\"stickiness\"]');if(sticky)sticky.value=pair[1];}";
  if(!html.includes('const textureWetStick=')) html=html.replace(marker,textureHelper+marker);

  html=html.replace(
    "x.oninput=()=>{h[k]=x.value;save()};",
    "x.oninput=()=>{h[k]=x.value;if(k==='texture')applyTextureDefaults(i,x.value);save()};"
  );
  html=html.replace(
    "if(q.scope==='detail')$(q.key).value=v;else state.horizons[q.i][q.key]=v;const e=elem(q);",
    "if(q.scope==='detail')$(q.key).value=v;else{state.horizons[q.i][q.key]=v;if(q.key==='texture')applyTextureDefaults(q.i,v)}const e=elem(q);"
  );

  // Restore and harden the spoken multi-horizon depth parser. It accepts phrases
  // like "0 in to 9 in, 9 in to 45 in, 45 in to 98 in" and creates three horizons.
  const oldDepthFn="function setDepths(t){const n=(t.match(/\\d+(?:\\.\\d+)?/g)||[]);if(n.length<2){speak('Please say the horizon depths again.',()=>listen());return}const r=[];for(let i=0;i+1<n.length;i+=2)r.push([n[i],n[i+1]]);state.horizons=r.map(x=>blank({top:x[0],bottom:x[1]}));state.depthsSet=true;render();save();state.mode='depthConfirm';state.pending=r;speak(r.map(x=>x[0]+' to '+x[1]).join(', ')+'. Is that correct?',()=>setTimeout(listen,100))}";
  const newDepthFn="function setDepths(t){const raw=String(t||'').toLowerCase().replace(/inches?|inch|\\bin\\b/g,' ').replace(/through|thru|–|—|-/g,' to ');let r=[];const re=/(\\d+(?:\\.\\d+)?)\\s*(?:to)\\s*(\\d+(?:\\.\\d+)?)/g;let m;while((m=re.exec(raw)))r.push([m[1],m[2]]);if(!r.length){const n=(raw.match(/\\d+(?:\\.\\d+)?/g)||[]);if(n.length>=2){for(let i=0;i+1<n.length;i+=2)r.push([n[i],n[i+1]])}}if(!r.length){speak('Please say the horizon depths again. For example, 0 inches to 9 inches, 9 inches to 45 inches, 45 inches to 98 inches.',()=>listen());return}state.horizons=r.map(x=>blank({top:x[0],bottom:x[1]}));state.depthsSet=true;render();save();state.mode='depthConfirm';state.pending=r;speak(r.map(x=>x[0]+' to '+x[1]+' inches').join(', ')+'. Is that correct?',()=>setTimeout(listen,100))}";
  html=html.replace(oldDepthFn,newDepthFn);

  // Also recognize a complete list of horizon ranges even if speech recognition
  // delivers it while another prompt is active.
  const oldHandleStart="function handle(t){closeMic();const x=words(t);";
  const newHandleStart="function handle(t){closeMic();const x=words(t);const rangeCount=(String(t||'').match(/(?:\\d+(?:\\.\\d+)?)\\s*(?:inches?|inch|in)?\\s*(?:to|through|thru|[-–—])\\s*(?:\\d+(?:\\.\\d+)?)/gi)||[]).length;if(rangeCount>=2)return setDepths(t);";
  html=html.replace(oldHandleStart,newHandleStart);

  return html;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(async response=>{
      const html=patchApp(await response.text());
      return new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8'}});
    }).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
});
